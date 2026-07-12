// Activity log query endpoint (admin / managers).
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /activity-logs ?user=&entityType=&from=&to=
router.get('/', requireAuth, requireRole('admin', 'asset_manager', 'dept_head'), (req, res) => {
  const { user, entityType, from, to } = req.query;
  const where = [];
  const params = {};
  if (user) { where.push('l.user_id = @user'); params.user = user; }
  if (entityType) { where.push('l.entity_type = @entityType'); params.entityType = entityType; }
  if (from) { where.push('datetime(l.created_at) >= datetime(@from)'); params.from = from; }
  if (to) { where.push('datetime(l.created_at) <= datetime(@to)'); params.to = to; }
  const rows = db.prepare(
    `SELECT l.*, u.name AS user_name FROM activity_logs l
       LEFT JOIN users u ON u.id = l.user_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY l.created_at DESC, l.id DESC
     LIMIT 500`
  ).all(params);
  res.json({
    ok: true,
    data: rows.map((l) => ({
      id: l.id,
      userId: l.user_id,
      userName: l.user_name,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      detail: l.detail,
      createdAt: l.created_at,
    })),
  });
});

module.exports = router;
