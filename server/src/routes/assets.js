// Asset registry: CRUD, auto AF-NNNN tag, search/filters, photo upload,
// custom-field values, lifecycle transitions, detail with histories, QR.
const express = require('express');
const QRCode = require('qrcode');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload, publicUrl } = require('../middleware/upload');
const { logActivity } = require('../services/activity');
const { transitionAsset, TransitionError, STATES } = require('../services/lifecycle');

const router = express.Router();

const CONDITIONS = ['New', 'Good', 'Fair', 'Poor'];

function shape(a) {
  let customValues = {};
  try { customValues = JSON.parse(a.custom_values || '{}'); } catch (_) { customValues = {}; }
  return {
    id: a.id,
    tag: a.tag,
    name: a.name,
    categoryId: a.category_id,
    serialNo: a.serial_no,
    acquisitionDate: a.acquisition_date,
    acquisitionCost: a.acquisition_cost,
    condition: a.condition,
    location: a.location,
    photoUrl: a.photo_url,
    isBookable: !!a.is_bookable,
    status: a.status,
    customValues,
    createdBy: a.created_by,
    createdAt: a.created_at,
  };
}

// Generate the next AF-NNNN tag from the current max. Zero-padded to 4.
function nextTag() {
  const row = db.prepare(
    `SELECT tag FROM assets WHERE tag LIKE 'AF-%' ORDER BY id DESC LIMIT 1`
  ).get();
  let n = 0;
  if (row) {
    const m = /^AF-(\d+)$/.exec(row.tag);
    if (m) n = parseInt(m[1], 10);
  }
  // Walk forward in case of gaps/collisions.
  let tag;
  do {
    n += 1;
    tag = `AF-${String(n).padStart(4, '0')}`;
  } while (db.prepare('SELECT 1 FROM assets WHERE tag = ?').get(tag));
  return tag;
}

// GET /assets ?search=&category=&status=&department=&location=&bookable=
router.get('/', requireAuth, (req, res) => {
  const { search, category, status, department, location, bookable } = req.query;
  const where = [];
  const params = {};
  if (search) {
    where.push('(a.tag LIKE @s OR a.serial_no LIKE @s OR a.name LIKE @s)');
    params.s = `%${search}%`;
  }
  if (category) { where.push('a.category_id = @category'); params.category = category; }
  if (status) { where.push('a.status = @status'); params.status = status; }
  if (location) { where.push('a.location = @location'); params.location = location; }
  if (bookable != null && bookable !== '') {
    where.push('a.is_bookable = @bookable');
    params.bookable = (bookable === 'true' || bookable === '1') ? 1 : 0;
  }
  // "department" filters by the department of the asset's active holder.
  if (department) {
    where.push(`a.id IN (
      SELECT asset_id FROM allocations
      WHERE status = 'active' AND holder_department_id = @department
    )`);
    params.department = department;
  }
  const sql = `SELECT a.* FROM assets a
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY a.id DESC`;
  const rows = db.prepare(sql).all(params);
  res.json({ ok: true, data: rows.map(shape) });
});

// GET /assets/:id → asset + allocationHistory + maintenanceHistory + lifecycle timeline
router.get('/:id', requireAuth, (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) {
    return res.status(404).json({ ok: false, error: 'Asset not found' });
  }
  const allocationHistory = db.prepare(
    `SELECT al.*, u.name AS holder_user_name, d.name AS holder_department_name
       FROM allocations al
       LEFT JOIN users u ON u.id = al.holder_user_id
       LEFT JOIN departments d ON d.id = al.holder_department_id
      WHERE al.asset_id = ?
      ORDER BY al.allocated_at DESC`
  ).all(asset.id).map((al) => ({
    id: al.id,
    holderUserId: al.holder_user_id,
    holderUserName: al.holder_user_name,
    holderDepartmentId: al.holder_department_id,
    holderDepartmentName: al.holder_department_name,
    allocatedBy: al.allocated_by,
    allocatedAt: al.allocated_at,
    expectedReturnDate: al.expected_return_date,
    returnedAt: al.returned_at,
    returnConditionNotes: al.return_condition_notes,
    status: al.status,
  }));
  const maintenanceHistory = db.prepare(
    `SELECT * FROM maintenance_requests WHERE asset_id = ? ORDER BY created_at DESC`
  ).all(asset.id).map((m) => ({
    id: m.id,
    issue: m.issue,
    priority: m.priority,
    status: m.status,
    technicianName: m.technician_name,
    technicianContact: m.technician_contact,
    photoUrl: m.photo_url,
    resolvedAt: m.resolved_at,
    createdAt: m.created_at,
  }));
  const timeline = db.prepare(
    `SELECT from_state, to_state, actor_id, detail, created_at
       FROM asset_history WHERE asset_id = ? ORDER BY created_at ASC, id ASC`
  ).all(asset.id).map((h) => ({
    fromState: h.from_state,
    toState: h.to_state,
    actorId: h.actor_id,
    detail: h.detail,
    at: h.created_at,
  }));
  res.json({ ok: true, data: { ...shape(asset), allocationHistory, maintenanceHistory, timeline } });
});

// GET /assets/:id/qr → { dataUrl } encoding the asset tag
router.get('/:id/qr', requireAuth, async (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) {
    return res.status(404).json({ ok: false, error: 'Asset not found' });
  }
  try {
    const dataUrl = await QRCode.toDataURL(asset.tag, { margin: 1, width: 240 });
    res.json({ ok: true, data: { tag: asset.tag, dataUrl } });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not generate QR code' });
  }
});

// POST /assets (asset manager) → auto tag AF-NNNN
router.post('/', requireAuth, requireRole('asset_manager'), (req, res) => {
  const {
    name, categoryId, serialNo, acquisitionDate, acquisitionCost,
    condition, location, isBookable, customValues,
  } = req.body || {};
  if (!name) {
    return res.status(400).json({ ok: false, error: 'Asset name is required' });
  }
  if (condition != null && !CONDITIONS.includes(condition)) {
    return res.status(400).json({ ok: false, error: 'Condition must be one of New, Good, Fair, Poor' });
  }
  if (customValues != null && typeof customValues !== 'object') {
    return res.status(400).json({ ok: false, error: 'customValues must be an object' });
  }
  const tag = nextTag();
  const info = db.prepare(
    `INSERT INTO assets
      (tag, name, category_id, serial_no, acquisition_date, acquisition_cost,
       condition, location, is_bookable, status, custom_values, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available', ?, ?)`
  ).run(
    tag, name, categoryId ?? null, serialNo ?? null, acquisitionDate ?? null,
    acquisitionCost ?? null, condition ?? null, location ?? null,
    isBookable ? 1 : 0, JSON.stringify(customValues || {}), req.user.id
  );
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(info.lastInsertRowid);
  // Seed the lifecycle timeline with the registration event.
  db.prepare(
    `INSERT INTO asset_history (asset_id, from_state, to_state, actor_id, detail)
     VALUES (?, NULL, 'Available', ?, 'Registered')`
  ).run(asset.id, req.user.id);
  logActivity(req.user.id, 'create', 'asset', asset.id, { tag, name });
  res.status(201).json({ ok: true, data: shape(asset) });
});

// PUT /assets/:id — edit metadata (not status; status only moves via transitions).
router.put('/:id', requireAuth, requireRole('asset_manager'), (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) {
    return res.status(404).json({ ok: false, error: 'Asset not found' });
  }
  const {
    name, categoryId, serialNo, acquisitionDate, acquisitionCost,
    condition, location, isBookable, customValues, status,
  } = req.body || {};
  if (condition != null && !CONDITIONS.includes(condition)) {
    return res.status(400).json({ ok: false, error: 'Condition must be one of New, Good, Fair, Poor' });
  }
  if (customValues != null && typeof customValues !== 'object') {
    return res.status(400).json({ ok: false, error: 'customValues must be an object' });
  }
  // Optional explicit lifecycle move (e.g. Retire / Dispose from the UI).
  if (status != null && status !== asset.status) {
    try {
      transitionAsset(asset.id, status, req.user.id, 'Manual status change');
    } catch (err) {
      if (err instanceof TransitionError) {
        return res.status(400).json({ ok: false, error: err.message });
      }
      throw err;
    }
  }
  db.prepare(
    `UPDATE assets SET
       name = ?, category_id = ?, serial_no = ?, acquisition_date = ?,
       acquisition_cost = ?, condition = ?, location = ?, is_bookable = ?, custom_values = ?
     WHERE id = ?`
  ).run(
    name ?? asset.name,
    categoryId !== undefined ? categoryId : asset.category_id,
    serialNo !== undefined ? serialNo : asset.serial_no,
    acquisitionDate !== undefined ? acquisitionDate : asset.acquisition_date,
    acquisitionCost !== undefined ? acquisitionCost : asset.acquisition_cost,
    condition !== undefined ? condition : asset.condition,
    location !== undefined ? location : asset.location,
    isBookable !== undefined ? (isBookable ? 1 : 0) : asset.is_bookable,
    customValues !== undefined ? JSON.stringify(customValues) : asset.custom_values,
    asset.id
  );
  const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset.id);
  logActivity(req.user.id, 'update', 'asset', asset.id, { tag: updated.tag });
  res.json({ ok: true, data: shape(updated) });
});

// POST /assets/:id/photo (multipart, field "photo")
router.post('/:id/photo', requireAuth, requireRole('asset_manager'), upload.single('photo'), (req, res) => {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) {
    return res.status(404).json({ ok: false, error: 'Asset not found' });
  }
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No photo uploaded (field name: photo)' });
  }
  const url = publicUrl(req.file.filename);
  db.prepare('UPDATE assets SET photo_url = ? WHERE id = ?').run(url, asset.id);
  logActivity(req.user.id, 'upload_photo', 'asset', asset.id, { url });
  res.json({ ok: true, data: { photoUrl: url } });
});

module.exports = router;
module.exports.shape = shape;
module.exports.STATES = STATES;
