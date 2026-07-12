// Maintenance workflow: raise → approve/reject → assign → start → resolve.
// Approval flips the asset to Under Maintenance; resolution flips it back to Available.
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload, publicUrl } = require('../middleware/upload');
const { logActivity, notify } = require('../services/activity');
const { transitionAsset, TransitionError } = require('../services/lifecycle');
const { activeAllocation } = require('./allocations');

const router = express.Router();

const PRIORITIES = ['Low', 'Medium', 'High'];

// action → { from: allowed current statuses, to: next status }
const ACTIONS = {
  approve: { from: ['pending'], to: 'approved' },
  reject:  { from: ['pending'], to: 'rejected' },
  assign:  { from: ['approved', 'assigned'], to: 'assigned' },
  // 'approved' is accepted for start/resolve: the kanban treats approved and
  // assigned as one column, so a ticket may progress without a formal assign.
  start:   { from: ['approved', 'assigned'], to: 'in_progress' },
  resolve: { from: ['approved', 'assigned', 'in_progress'], to: 'resolved' },
};

function shape(m) {
  return {
    id: m.id,
    assetId: m.asset_id,
    raisedBy: m.raised_by,
    issue: m.issue,
    priority: m.priority,
    photoUrl: m.photo_url,
    status: m.status,
    technicianName: m.technician_name,
    technicianContact: m.technician_contact,
    decidedBy: m.decided_by,
    resolvedAt: m.resolved_at,
    createdAt: m.created_at,
  };
}

// GET /maintenance ?status=&assetId=
router.get('/', requireAuth, (req, res) => {
  const { status, assetId } = req.query;
  const where = [];
  const params = {};
  if (status) { where.push('status = @status'); params.status = status; }
  if (assetId) { where.push('asset_id = @assetId'); params.assetId = assetId; }
  const rows = db.prepare(
    `SELECT * FROM maintenance_requests ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`
  ).all(params);
  res.json({ ok: true, data: rows.map(shape) });
});

// POST /maintenance {assetId,issue,priority} (+photo, field "photo")
router.post('/', requireAuth, upload.single('photo'), (req, res) => {
  const { assetId, issue, priority } = req.body || {};
  if (!assetId || !issue) {
    return res.status(400).json({ ok: false, error: 'assetId and issue are required' });
  }
  if (priority != null && !PRIORITIES.includes(priority)) {
    return res.status(400).json({ ok: false, error: 'priority must be Low, Medium or High' });
  }
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
  if (!asset) {
    return res.status(404).json({ ok: false, error: 'Asset not found' });
  }
  // Employees may only raise requests for assets currently allocated to them.
  if (req.user.role === 'employee') {
    const current = activeAllocation(assetId);
    if (!current || current.holder_user_id !== req.user.id) {
      return res.status(403).json({ ok: false, error: 'You can only raise maintenance for assets allocated to you' });
    }
  }
  const photoUrl = req.file ? publicUrl(req.file.filename) : null;
  const info = db.prepare(
    `INSERT INTO maintenance_requests (asset_id, raised_by, issue, priority, photo_url, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`
  ).run(assetId, req.user.id, issue, priority || 'Medium', photoUrl);
  const m = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(info.lastInsertRowid);
  logActivity(req.user.id, 'raise_maintenance', 'asset', assetId, { maintenanceId: m.id, priority: m.priority });
  res.status(201).json({ ok: true, data: shape(m) });
});

// PUT /maintenance/:id {action, technicianName?, technicianContact?} (asset manager)
router.put('/:id', requireAuth, requireRole('asset_manager'), (req, res) => {
  const m = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(req.params.id);
  if (!m) {
    return res.status(404).json({ ok: false, error: 'Maintenance request not found' });
  }
  const { action, technicianName, technicianContact } = req.body || {};
  const spec = ACTIONS[action];
  if (!spec) {
    return res.status(400).json({ ok: false, error: 'action must be approve, reject, assign, start or resolve' });
  }
  if (!spec.from.includes(m.status)) {
    return res.status(400).json({ ok: false, error: `Cannot ${action} a request that is ${m.status}` });
  }
  if (action === 'assign' && !technicianName) {
    return res.status(400).json({ ok: false, error: 'technicianName is required to assign' });
  }

  // Asset side-effects: approve → Under Maintenance; resolve → Available, then
  // back to Allocated if the asset was still allocated to a holder (repaired in place).
  try {
    if (action === 'approve') {
      transitionAsset(m.asset_id, 'Under Maintenance', req.user.id, 'Maintenance approved');
    }
    if (action === 'resolve') {
      transitionAsset(m.asset_id, 'Available', req.user.id, 'Maintenance resolved');
      if (activeAllocation(m.asset_id)) {
        transitionAsset(m.asset_id, 'Allocated', req.user.id, 'Returned to holder after maintenance');
      }
    }
  } catch (err) {
    if (err instanceof TransitionError) {
      return res.status(400).json({ ok: false, error: `Asset status cannot change: ${err.message}` });
    }
    throw err;
  }

  const fields = ['status = @to'];
  const params = { to: spec.to, id: m.id, tech: technicianName ?? m.technician_name, contact: technicianContact ?? m.technician_contact };
  if (action === 'approve' || action === 'reject') fields.push("decided_by = " + req.user.id);
  if (action === 'assign') { fields.push('technician_name = @tech', 'technician_contact = @contact'); }
  if (action === 'resolve') fields.push("resolved_at = datetime('now')");
  db.prepare(`UPDATE maintenance_requests SET ${fields.join(', ')} WHERE id = @id`).run(params);

  logActivity(req.user.id, `maintenance_${action}`, 'asset', m.asset_id, { maintenanceId: m.id });
  // Notify the requester on decision/resolution.
  const asset = db.prepare('SELECT tag, name FROM assets WHERE id = ?').get(m.asset_id);
  const label = asset ? `${asset.tag} ${asset.name}` : `asset #${m.asset_id}`;
  if (action === 'approve') notify(m.raised_by, 'maintenance_approved', 'Maintenance Approved', `Your request for ${label} was approved`, `maintenance:${m.id}`);
  if (action === 'reject') notify(m.raised_by, 'maintenance_rejected', 'Maintenance Rejected', `Your request for ${label} was rejected`, `maintenance:${m.id}`);
  if (action === 'resolve') notify(m.raised_by, 'maintenance_resolved', 'Maintenance Resolved', `${label} is fixed and available again`, `maintenance:${m.id}`);

  res.json({ ok: true, data: shape(db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(m.id)) });
});

module.exports = router;
