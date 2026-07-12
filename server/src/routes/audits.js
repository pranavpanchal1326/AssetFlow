// Audit cycles: create with scope → auto-populate items; auditor marking;
// discrepancy report (derived); close → Missing→Lost, Damaged→auto-raise maintenance, lock.
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logActivity, notify } = require('../services/activity');
const { transitionAsset, canTransition } = require('../services/lifecycle');

const router = express.Router();

// Find assets in scope. Department scope matches assets whose active allocation
// is to that department or to a user in that department. Location scope matches
// asset.location. Both may combine (AND); neither → all assets.
function assetsInScope(scopeDepartmentId, scopeLocation) {
  const where = [];
  const params = {};
  if (scopeLocation) { where.push('a.location = @loc'); params.loc = scopeLocation; }
  if (scopeDepartmentId) {
    where.push(`a.id IN (
      SELECT al.asset_id FROM allocations al
        LEFT JOIN users u ON u.id = al.holder_user_id
       WHERE al.status = 'active'
         AND (al.holder_department_id = @dept OR u.department_id = @dept)
    )`);
    params.dept = scopeDepartmentId;
  }
  return db.prepare(
    `SELECT a.id FROM assets a ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`
  ).all(params);
}

function cycleShape(c) {
  const auditors = db.prepare(
    `SELECT aa.auditor_user_id AS id, u.name FROM audit_assignments aa
       LEFT JOIN users u ON u.id = aa.auditor_user_id WHERE aa.cycle_id = ?`
  ).all(c.id);
  return {
    id: c.id,
    name: c.name,
    scopeDepartmentId: c.scope_department_id,
    scopeLocation: c.scope_location,
    startDate: c.start_date,
    endDate: c.end_date,
    status: c.status,
    createdBy: c.created_by,
    createdAt: c.created_at,
    auditors,
  };
}

function itemShape(i) {
  return {
    id: i.id,
    cycleId: i.cycle_id,
    assetId: i.asset_id,
    assetTag: i.asset_tag,
    assetName: i.asset_name,
    result: i.result,
    note: i.note,
    checkedBy: i.checked_by,
    checkedAt: i.checked_at,
  };
}

function loadItems(cycleId) {
  return db.prepare(
    `SELECT ai.*, a.tag AS asset_tag, a.name AS asset_name
       FROM audit_items ai JOIN assets a ON a.id = ai.asset_id
      WHERE ai.cycle_id = ? ORDER BY a.tag`
  ).all(cycleId);
}

// GET /audits
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM audit_cycles ORDER BY created_at DESC').all();
  res.json({ ok: true, data: rows.map(cycleShape) });
});

// GET /audits/:id → cycle + items + discrepancies
router.get('/:id', requireAuth, (req, res) => {
  const c = db.prepare('SELECT * FROM audit_cycles WHERE id = ?').get(req.params.id);
  if (!c) {
    return res.status(404).json({ ok: false, error: 'Audit cycle not found' });
  }
  const items = loadItems(c.id).map(itemShape);
  const discrepancies = items.filter((i) => i.result === 'missing' || i.result === 'damaged');
  res.json({ ok: true, data: { ...cycleShape(c), items, discrepancies } });
});

// POST /audits (admin)
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const { name, scopeDepartmentId, scopeLocation, startDate, endDate, auditorIds } = req.body || {};
  if (!name) {
    return res.status(400).json({ ok: false, error: 'Audit cycle name is required' });
  }
  if (!Array.isArray(auditorIds) || auditorIds.length === 0) {
    return res.status(400).json({ ok: false, error: 'At least one auditor must be assigned' });
  }
  const scoped = assetsInScope(scopeDepartmentId ?? null, scopeLocation ?? null);
  const tx = db.transaction(() => {
    const info = db.prepare(
      `INSERT INTO audit_cycles (name, scope_department_id, scope_location, start_date, end_date, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'open', ?)`
    ).run(name, scopeDepartmentId ?? null, scopeLocation ?? null, startDate ?? null, endDate ?? null, req.user.id);
    const cycleId = info.lastInsertRowid;
    const insItem = db.prepare(`INSERT INTO audit_items (cycle_id, asset_id, result) VALUES (?, ?, 'pending')`);
    for (const a of scoped) insItem.run(cycleId, a.id);
    const insAssign = db.prepare('INSERT INTO audit_assignments (cycle_id, auditor_user_id) VALUES (?, ?)');
    for (const uid of auditorIds) insAssign.run(cycleId, uid);
    return cycleId;
  });
  const cycleId = tx();
  logActivity(req.user.id, 'create', 'audit_cycle', cycleId, { name, items: scoped.length });
  // Notify assigned auditors.
  for (const uid of auditorIds) {
    notify(uid, 'audit_assigned', 'Audit Assignment', `You have been assigned to audit "${name}"`, `audit:${cycleId}`);
  }
  const c = db.prepare('SELECT * FROM audit_cycles WHERE id = ?').get(cycleId);
  const items = loadItems(cycleId).map(itemShape);
  res.status(201).json({ ok: true, data: { ...cycleShape(c), items, discrepancies: [] } });
});

// PUT /audits/:id/items/:itemId {result,note?} (assigned auditor)
router.put('/:id/items/:itemId', requireAuth, (req, res) => {
  const c = db.prepare('SELECT * FROM audit_cycles WHERE id = ?').get(req.params.id);
  if (!c) {
    return res.status(404).json({ ok: false, error: 'Audit cycle not found' });
  }
  if (c.status === 'closed') {
    return res.status(400).json({ ok: false, error: 'This audit cycle is closed' });
  }
  const assigned = db.prepare(
    'SELECT 1 FROM audit_assignments WHERE cycle_id = ? AND auditor_user_id = ?'
  ).get(c.id, req.user.id);
  if (!assigned && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'You are not an assigned auditor for this cycle' });
  }
  const item = db.prepare('SELECT * FROM audit_items WHERE id = ? AND cycle_id = ?').get(req.params.itemId, c.id);
  if (!item) {
    return res.status(404).json({ ok: false, error: 'Audit item not found' });
  }
  const { result, note } = req.body || {};
  if (!['verified', 'missing', 'damaged'].includes(result)) {
    return res.status(400).json({ ok: false, error: 'result must be verified, missing or damaged' });
  }
  db.prepare(
    `UPDATE audit_items SET result = ?, note = ?, checked_by = ?, checked_at = datetime('now') WHERE id = ?`
  ).run(result, note ?? null, req.user.id, item.id);
  logActivity(req.user.id, 'audit_mark', 'asset', item.asset_id, { cycleId: c.id, result });
  const updated = db.prepare(
    `SELECT ai.*, a.tag AS asset_tag, a.name AS asset_name FROM audit_items ai
       JOIN assets a ON a.id = ai.asset_id WHERE ai.id = ?`
  ).get(item.id);
  res.json({ ok: true, data: itemShape(updated) });
});

// PUT /audits/:id {action:"close"} (admin) → applies status updates, locks cycle
router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const c = db.prepare('SELECT * FROM audit_cycles WHERE id = ?').get(req.params.id);
  if (!c) {
    return res.status(404).json({ ok: false, error: 'Audit cycle not found' });
  }
  if ((req.body || {}).action !== 'close') {
    return res.status(400).json({ ok: false, error: 'action must be "close"' });
  }
  if (c.status === 'closed') {
    return res.status(400).json({ ok: false, error: 'Audit cycle is already closed' });
  }
  const items = loadItems(c.id);
  const applied = { lost: 0, maintenanceRaised: 0 };
  const tx = db.transaction(() => {
    for (const it of items) {
      if (it.result === 'missing') {
        // Confirmed missing → Lost. Use the state machine when legal, else force with history.
        const asset = db.prepare('SELECT status FROM assets WHERE id = ?').get(it.asset_id);
        if (canTransition(asset.status, 'Lost')) {
          transitionAsset(it.asset_id, 'Lost', req.user.id, `Audit "${c.name}": marked missing`);
        } else if (asset.status !== 'Lost') {
          db.prepare('UPDATE assets SET status = ? WHERE id = ?').run('Lost', it.asset_id);
          db.prepare(
            `INSERT INTO asset_history (asset_id, from_state, to_state, actor_id, detail)
             VALUES (?, ?, 'Lost', ?, ?)`
          ).run(it.asset_id, asset.status, req.user.id, `Audit "${c.name}": marked missing`);
        }
        applied.lost++;
      } else if (it.result === 'damaged') {
        // Auto-raise a maintenance request.
        db.prepare(
          `INSERT INTO maintenance_requests (asset_id, raised_by, issue, priority, status)
           VALUES (?, ?, ?, 'Medium', 'pending')`
        ).run(it.asset_id, req.user.id, `Damage found during audit "${c.name}"${it.note ? ': ' + it.note : ''}`);
        applied.maintenanceRaised++;
      }
    }
    db.prepare("UPDATE audit_cycles SET status = 'closed' WHERE id = ?").run(c.id);
  });
  tx();
  logActivity(req.user.id, 'close', 'audit_cycle', c.id, applied);
  // Discrepancy notification to the cycle creator.
  const discrepancies = items.filter((i) => i.result === 'missing' || i.result === 'damaged').length;
  if (discrepancies > 0) {
    notify(c.created_by, 'audit_discrepancy', 'Audit Discrepancy Flagged',
      `Audit "${c.name}" closed with ${discrepancies} discrepancy(ies): ${applied.lost} lost, ${applied.maintenanceRaised} sent to maintenance`,
      `audit:${c.id}`);
  }
  const updated = db.prepare('SELECT * FROM audit_cycles WHERE id = ?').get(c.id);
  const finalItems = loadItems(c.id).map(itemShape);
  res.json({
    ok: true,
    data: {
      ...cycleShape(updated),
      items: finalItems,
      discrepancies: finalItems.filter((i) => i.result === 'missing' || i.result === 'damaged'),
      applied,
    },
  });
});

module.exports = router;
