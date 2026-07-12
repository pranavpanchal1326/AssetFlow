// Departments CRUD (admin only for mutations; any authed user can read for pickers).
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logActivity } = require('../services/activity');

const router = express.Router();

function shape(d) {
  return {
    id: d.id,
    name: d.name,
    headUserId: d.head_user_id,
    parentId: d.parent_id,
    status: d.status,
  };
}

// GET /departments
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM departments ORDER BY name').all();
  res.json({ ok: true, data: rows.map(shape) });
});

// POST /departments (admin)
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const { name, headUserId, parentId, status } = req.body || {};
  if (!name) {
    return res.status(400).json({ ok: false, error: 'Department name is required' });
  }
  const info = db.prepare(
    `INSERT INTO departments (name, head_user_id, parent_id, status)
     VALUES (?, ?, ?, ?)`
  ).run(name, headUserId ?? null, parentId ?? null, status || 'active');
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(info.lastInsertRowid);
  logActivity(req.user.id, 'create', 'department', dept.id, { name });
  res.status(201).json({ ok: true, data: shape(dept) });
});

// PUT /departments/:id (admin)
router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
  if (!dept) {
    return res.status(404).json({ ok: false, error: 'Department not found' });
  }
  const { name, headUserId, parentId, status } = req.body || {};
  if (parentId != null && Number(parentId) === dept.id) {
    return res.status(400).json({ ok: false, error: 'A department cannot be its own parent' });
  }
  db.prepare(
    `UPDATE departments SET name = ?, head_user_id = ?, parent_id = ?, status = ? WHERE id = ?`
  ).run(
    name ?? dept.name,
    headUserId !== undefined ? headUserId : dept.head_user_id,
    parentId !== undefined ? parentId : dept.parent_id,
    status ?? dept.status,
    dept.id
  );
  const updated = db.prepare('SELECT * FROM departments WHERE id = ?').get(dept.id);
  logActivity(req.user.id, 'update', 'department', dept.id, { name: updated.name });
  res.json({ ok: true, data: shape(updated) });
});

module.exports = router;
