// Notification center API.
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function shape(n) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    entityRef: n.entity_ref,
    isRead: !!n.is_read,
    createdAt: n.created_at,
  };
}

// GET /notifications ?unread=true
router.get('/', requireAuth, (req, res) => {
  const onlyUnread = req.query.unread === 'true' || req.query.unread === '1';
  const rows = db.prepare(
    `SELECT * FROM notifications WHERE user_id = ? ${onlyUnread ? 'AND is_read = 0' : ''}
     ORDER BY created_at DESC, id DESC`
  ).all(req.user.id);
  const unreadCount = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).c;
  res.json({ ok: true, data: { notifications: rows.map(shape), unreadCount } });
});

// PUT /notifications/:id/read
router.put('/:id/read', requireAuth, (req, res) => {
  const n = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!n) {
    return res.status(404).json({ ok: false, error: 'Notification not found' });
  }
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(n.id);
  res.json({ ok: true, data: shape({ ...n, is_read: 1 }) });
});

// PUT /notifications/read-all
router.put('/read-all', requireAuth, (req, res) => {
  const info = db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
  res.json({ ok: true, data: { marked: info.changes } });
});

module.exports = router;
