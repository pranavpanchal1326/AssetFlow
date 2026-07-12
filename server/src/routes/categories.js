// Asset categories CRUD (admin only for mutations).
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logActivity } = require('../services/activity');

const router = express.Router();

function shape(c) {
  let customFields = [];
  try { customFields = JSON.parse(c.custom_fields || '[]'); } catch { customFields = []; }
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    customFields,
  };
}

// GET /categories
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json({ ok: true, data: rows.map(shape) });
});

// POST /categories (admin)
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const { name, description, customFields } = req.body || {};
  if (!name) {
    return res.status(400).json({ ok: false, error: 'Category name is required' });
  }
  if (customFields !== undefined && !Array.isArray(customFields)) {
    return res.status(400).json({ ok: false, error: 'customFields must be an array of field definitions' });
  }
  const info = db.prepare(
    `INSERT INTO categories (name, description, custom_fields) VALUES (?, ?, ?)`
  ).run(name, description ?? null, JSON.stringify(customFields || []));
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
  logActivity(req.user.id, 'create', 'category', cat.id, { name });
  res.status(201).json({ ok: true, data: shape(cat) });
});

// PUT /categories/:id (admin)
router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) {
    return res.status(404).json({ ok: false, error: 'Category not found' });
  }
  const { name, description, customFields } = req.body || {};
  if (customFields !== undefined && !Array.isArray(customFields)) {
    return res.status(400).json({ ok: false, error: 'customFields must be an array of field definitions' });
  }
  db.prepare(
    `UPDATE categories SET name = ?, description = ?, custom_fields = ? WHERE id = ?`
  ).run(
    name ?? cat.name,
    description !== undefined ? description : cat.description,
    customFields !== undefined ? JSON.stringify(customFields) : cat.custom_fields,
    cat.id
  );
  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(cat.id);
  logActivity(req.user.id, 'update', 'category', cat.id, { name: updated.name });
  res.json({ ok: true, data: shape(updated) });
});

module.exports = router;
