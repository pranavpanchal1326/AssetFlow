// Users / Employee Directory.
// GET: admin sees all fields; others get id+name only (for pickers).
// PUT: admin-only — the single role-assignment surface in the app (PRD §2.1).
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logActivity } = require('../services/activity');

const router = express.Router();

const ROLES = ['admin', 'asset_manager', 'dept_head', 'employee'];
const STATUSES = ['active', 'inactive'];

function fullUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    departmentId: u.department_id,
    status: u.status,
    createdAt: u.created_at,
  };
}

// GET /users — admin: full directory; others: id+name pickers only.
router.get('/', requireAuth, (req, res) => {
  if (req.user.role === 'admin') {
    const rows = db.prepare('SELECT * FROM users ORDER BY name').all();
    return res.json({ ok: true, data: rows.map(fullUser) });
  }
  const rows = db.prepare('SELECT id, name FROM users WHERE status = \'active\' ORDER BY name').all();
  res.json({ ok: true, data: rows.map((u) => ({ id: u.id, name: u.name })) });
});

// PUT /users/:id {role?,departmentId?,status?} (admin only — role assignment).
router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }
  const { role, departmentId, status } = req.body || {};
  if (role !== undefined && !ROLES.includes(role)) {
    return res.status(400).json({ ok: false, error: 'Invalid role' });
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    return res.status(400).json({ ok: false, error: 'Invalid status' });
  }
  db.prepare(
    `UPDATE users SET role = ?, department_id = ?, status = ? WHERE id = ?`
  ).run(
    role ?? user.role,
    departmentId !== undefined ? departmentId : user.department_id,
    status ?? user.status,
    user.id
  );
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  logActivity(req.user.id, 'update_user', 'user', user.id, {
    role: updated.role,
    departmentId: updated.department_id,
    status: updated.status,
  });
  res.json({ ok: true, data: fullUser(updated) });
});

module.exports = router;
