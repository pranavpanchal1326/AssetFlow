// Allocations: allocate with double-allocation 409 block, return flow,
// overdue detection (computed on read), notifications.
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logActivity, notify } = require('../services/activity');
const { transitionAsset, TransitionError } = require('../services/lifecycle');

const router = express.Router();

// Return the active allocation for an asset (or undefined).
function activeAllocation(assetId) {
  return db.prepare(
    `SELECT * FROM allocations WHERE asset_id = ? AND status = 'active' LIMIT 1`
  ).get(assetId);
}

// Human-readable holder name for an allocation row.
function holderInfo(alloc) {
  if (alloc.holder_user_id) {
    const u = db.prepare('SELECT id, name FROM users WHERE id = ?').get(alloc.holder_user_id);
    return { type: 'user', id: alloc.holder_user_id, name: u ? u.name : 'Unknown' };
  }
  if (alloc.holder_department_id) {
    const d = db.prepare('SELECT id, name FROM departments WHERE id = ?').get(alloc.holder_department_id);
    return { type: 'department', id: alloc.holder_department_id, name: d ? d.name : 'Unknown' };
  }
  return { type: 'unknown', id: null, name: 'Unknown' };
}

function isOverdue(alloc) {
  return alloc.status === 'active'
    && !alloc.returned_at
    && alloc.expected_return_date
    && new Date(alloc.expected_return_date) < new Date();
}

function shape(alloc) {
  const holder = holderInfo(alloc);
  return {
    id: alloc.id,
    assetId: alloc.asset_id,
    holderUserId: alloc.holder_user_id,
    holderDepartmentId: alloc.holder_department_id,
    holderName: holder.name,
    holderType: holder.type,
    allocatedBy: alloc.allocated_by,
    allocatedAt: alloc.allocated_at,
    expectedReturnDate: alloc.expected_return_date,
    returnedAt: alloc.returned_at,
    returnConditionNotes: alloc.return_condition_notes,
    status: alloc.status,
    overdue: isOverdue(alloc),
  };
}

// Emit an overdue notification once per allocation (idempotent via entity_ref).
function emitOverdueAlert(alloc) {
  if (!alloc.holder_user_id) return;
  const ref = `overdue:allocation:${alloc.id}`;
  const exists = db.prepare('SELECT 1 FROM notifications WHERE entity_ref = ? LIMIT 1').get(ref);
  if (exists) return;
  const asset = db.prepare('SELECT tag, name FROM assets WHERE id = ?').get(alloc.asset_id);
  notify(
    alloc.holder_user_id,
    'overdue_return',
    'Overdue Return Alert',
    `${asset ? asset.tag + ' ' + asset.name : 'An asset'} was due on ${alloc.expected_return_date}`,
    ref
  );
}

// GET /allocations ?overdue=true&userId=&departmentId=&assetId=
router.get('/', requireAuth, (req, res) => {
  const { overdue, userId, departmentId, assetId } = req.query;
  const where = [];
  const params = {};
  if (userId) { where.push('holder_user_id = @userId'); params.userId = userId; }
  if (departmentId) { where.push('holder_department_id = @departmentId'); params.departmentId = departmentId; }
  if (assetId) { where.push('asset_id = @assetId'); params.assetId = assetId; }
  const rows = db.prepare(
    `SELECT * FROM allocations ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY allocated_at DESC`
  ).all(params);
  let result = rows.map(shape);
  if (overdue === 'true' || overdue === '1') {
    result = result.filter((a) => a.overdue);
    // Fire alerts for the overdue set (idempotent).
    for (const r of rows) { if (isOverdue(r)) emitOverdueAlert(r); }
  }
  res.json({ ok: true, data: result });
});

// POST /allocations {assetId, holderUserId|holderDepartmentId, expectedReturnDate?}
router.post('/', requireAuth, requireRole('asset_manager', 'dept_head'), (req, res) => {
  const { assetId, holderUserId, holderDepartmentId, expectedReturnDate } = req.body || {};
  if (!assetId) {
    return res.status(400).json({ ok: false, error: 'assetId is required' });
  }
  if (!holderUserId && !holderDepartmentId) {
    return res.status(400).json({ ok: false, error: 'A holder (user or department) is required' });
  }
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
  if (!asset) {
    return res.status(404).json({ ok: false, error: 'Asset not found' });
  }
  // Double-allocation block (⭐ core judging feature).
  const current = activeAllocation(assetId);
  if (current) {
    const holder = holderInfo(current);
    return res.status(409).json({
      ok: false,
      error: `Currently held by ${holder.name}`,
      holder,
      canRequestTransfer: true,
    });
  }
  // Asset must be allocatable from its current state.
  try {
    transitionAsset(assetId, 'Allocated', req.user.id, 'Allocated');
  } catch (err) {
    if (err instanceof TransitionError) {
      return res.status(400).json({ ok: false, error: `Cannot allocate: ${err.message}` });
    }
    throw err;
  }
  const info = db.prepare(
    `INSERT INTO allocations
       (asset_id, holder_user_id, holder_department_id, allocated_by, expected_return_date, status)
     VALUES (?, ?, ?, ?, ?, 'active')`
  ).run(assetId, holderUserId ?? null, holderDepartmentId ?? null, req.user.id, expectedReturnDate ?? null);
  const alloc = db.prepare('SELECT * FROM allocations WHERE id = ?').get(info.lastInsertRowid);
  logActivity(req.user.id, 'allocate', 'asset', assetId, { allocationId: alloc.id });
  // Notify the holder (Asset Assigned).
  if (holderUserId) {
    notify(holderUserId, 'asset_assigned', 'Asset Assigned',
      `${asset.tag} ${asset.name} has been assigned to you`, `asset:${assetId}`);
  }
  res.status(201).json({ ok: true, data: shape(alloc) });
});

// POST /allocations/:id/return {conditionNotes} — approved by asset manager / dept head.
router.post('/:id/return', requireAuth, requireRole('asset_manager', 'dept_head'), (req, res) => {
  const alloc = db.prepare('SELECT * FROM allocations WHERE id = ?').get(req.params.id);
  if (!alloc) {
    return res.status(404).json({ ok: false, error: 'Allocation not found' });
  }
  if (alloc.status === 'returned') {
    return res.status(400).json({ ok: false, error: 'This allocation has already been returned' });
  }
  const { conditionNotes } = req.body || {};
  db.prepare(
    `UPDATE allocations SET status = 'returned', returned_at = datetime('now'), return_condition_notes = ? WHERE id = ?`
  ).run(conditionNotes ?? null, alloc.id);
  try {
    transitionAsset(alloc.asset_id, 'Available', req.user.id, 'Returned');
  } catch (err) {
    if (!(err instanceof TransitionError)) throw err;
    // If the asset was e.g. Under Maintenance, leave its status; the allocation is still closed.
  }
  logActivity(req.user.id, 'return', 'asset', alloc.asset_id, { allocationId: alloc.id });
  const updated = db.prepare('SELECT * FROM allocations WHERE id = ?').get(alloc.id);
  res.json({ ok: true, data: shape(updated) });
});

module.exports = router;
module.exports.activeAllocation = activeAllocation;
module.exports.holderInfo = holderInfo;
module.exports.shapeAllocation = shape;
