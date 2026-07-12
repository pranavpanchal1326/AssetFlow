// Transfer requests: request → approve/reject → re-allocation with automatic history.
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logActivity, notify } = require('../services/activity');
const { transitionAsset, TransitionError } = require('../services/lifecycle');
const { activeAllocation } = require('./allocations');

const router = express.Router();

function shape(t) {
  return {
    id: t.id,
    assetId: t.asset_id,
    fromAllocationId: t.from_allocation_id,
    requestedBy: t.requested_by,
    toUserId: t.to_user_id,
    toDepartmentId: t.to_department_id,
    status: t.status,
    decidedBy: t.decided_by,
    decidedAt: t.decided_at,
    createdAt: t.created_at,
  };
}

// GET /transfers ?status=
router.get('/', requireAuth, (req, res) => {
  const { status } = req.query;
  const where = [];
  const params = {};
  if (status) { where.push('status = @status'); params.status = status; }
  const rows = db.prepare(
    `SELECT * FROM transfer_requests ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`
  ).all(params);
  res.json({ ok: true, data: rows.map(shape) });
});

// POST /transfers {assetId, toUserId|toDepartmentId}
// Employees may request transfer of an asset they currently hold; managers/heads for any.
router.post('/', requireAuth, (req, res) => {
  const { assetId, toUserId, toDepartmentId } = req.body || {};
  if (!assetId) {
    return res.status(400).json({ ok: false, error: 'assetId is required' });
  }
  if (!toUserId && !toDepartmentId) {
    return res.status(400).json({ ok: false, error: 'A transfer target (user or department) is required' });
  }
  // Validate the target exists up front.
  if (toUserId && !db.prepare('SELECT 1 FROM users WHERE id = ?').get(toUserId)) {
    return res.status(400).json({ ok: false, error: 'Transfer target user not found' });
  }
  if (toDepartmentId && !db.prepare('SELECT 1 FROM departments WHERE id = ?').get(toDepartmentId)) {
    return res.status(400).json({ ok: false, error: 'Transfer target department not found' });
  }
  const current = activeAllocation(assetId);
  if (!current) {
    return res.status(400).json({ ok: false, error: 'Asset is not currently allocated — allocate it directly instead' });
  }
  // Employees can only request transfers for assets they hold.
  const privileged = ['admin', 'asset_manager', 'dept_head'].includes(req.user.role);
  if (!privileged && current.holder_user_id !== req.user.id) {
    return res.status(403).json({ ok: false, error: 'You can only request transfers for assets allocated to you' });
  }
  const info = db.prepare(
    `INSERT INTO transfer_requests
       (asset_id, from_allocation_id, requested_by, to_user_id, to_department_id, status)
     VALUES (?, ?, ?, ?, ?, 'requested')`
  ).run(assetId, current.id, req.user.id, toUserId ?? null, toDepartmentId ?? null);
  const t = db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(info.lastInsertRowid);
  logActivity(req.user.id, 'request_transfer', 'asset', assetId, { transferId: t.id });
  res.status(201).json({ ok: true, data: shape(t) });
});

// PUT /transfers/:id {action:"approve"|"reject"} (asset manager / dept head)
router.put('/:id', requireAuth, requireRole('asset_manager', 'dept_head'), (req, res) => {
  const t = db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(req.params.id);
  if (!t) {
    return res.status(404).json({ ok: false, error: 'Transfer request not found' });
  }
  if (t.status !== 'requested') {
    return res.status(400).json({ ok: false, error: `Transfer already ${t.status}` });
  }
  const { action } = req.body || {};
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ ok: false, error: 'action must be "approve" or "reject"' });
  }

  if (action === 'reject') {
    db.prepare(
      `UPDATE transfer_requests SET status = 'rejected', decided_by = ?, decided_at = datetime('now') WHERE id = ?`
    ).run(req.user.id, t.id);
    logActivity(req.user.id, 'reject_transfer', 'asset', t.asset_id, { transferId: t.id });
    notify(t.requested_by, 'transfer_rejected', 'Transfer Rejected',
      'Your transfer request was rejected', `transfer:${t.id}`);
    return res.json({ ok: true, data: shape(db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(t.id)) });
  }

  // Re-validate the target still exists (it could have been removed since the request).
  if (t.to_user_id && !db.prepare('SELECT 1 FROM users WHERE id = ?').get(t.to_user_id)) {
    return res.status(400).json({ ok: false, error: 'Transfer target user no longer exists' });
  }
  if (t.to_department_id && !db.prepare('SELECT 1 FROM departments WHERE id = ?').get(t.to_department_id)) {
    return res.status(400).json({ ok: false, error: 'Transfer target department no longer exists' });
  }
  // The asset must still be allocated (it may have been returned since the request).
  const current = activeAllocation(t.asset_id);
  if (!current) {
    return res.status(400).json({ ok: false, error: 'Asset is no longer allocated — this transfer request is stale' });
  }
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE allocations SET status = 'returned', returned_at = datetime('now'),
         return_condition_notes = 'Transferred' WHERE id = ?`
    ).run(current.id);
    // Allocated → Allocated transfer transition (writes asset_history).
    transitionAsset(t.asset_id, 'Allocated', req.user.id, 'Transferred');
    db.prepare(
      `INSERT INTO allocations (asset_id, holder_user_id, holder_department_id, allocated_by, status)
       VALUES (?, ?, ?, ?, 'active')`
    ).run(t.asset_id, t.to_user_id ?? null, t.to_department_id ?? null, req.user.id);
    db.prepare(
      `UPDATE transfer_requests SET status = 'approved', decided_by = ?, decided_at = datetime('now') WHERE id = ?`
    ).run(req.user.id, t.id);
  });
  try {
    tx();
  } catch (err) {
    if (err instanceof TransitionError) {
      return res.status(400).json({ ok: false, error: err.message });
    }
    throw err;
  }
  logActivity(req.user.id, 'approve_transfer', 'asset', t.asset_id, { transferId: t.id });
  const asset = db.prepare('SELECT tag, name FROM assets WHERE id = ?').get(t.asset_id);
  const label = asset ? `${asset.tag} ${asset.name}` : 'The asset';
  // Notify requester and the new holder (Transfer Approved / Asset Assigned).
  notify(t.requested_by, 'transfer_approved', 'Transfer Approved',
    `Your transfer request for ${label} was approved`, `transfer:${t.id}`);
  if (t.to_user_id) {
    notify(t.to_user_id, 'asset_assigned', 'Asset Assigned',
      `${label} has been assigned to you`, `asset:${t.asset_id}`);
  }
  res.json({ ok: true, data: shape(db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(t.id)) });
});

module.exports = router;
