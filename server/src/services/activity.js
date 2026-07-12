// Activity log + notification helpers.
// logActivity() is called from every mutating route from Phase A1 onward.
const db = require('../db');

function logActivity(userId, action, entityType, entityId, detail) {
  db.prepare(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, detail)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    userId ?? null,
    action,
    entityType ?? null,
    entityId ?? null,
    detail == null ? null : (typeof detail === 'string' ? detail : JSON.stringify(detail))
  );
}

function notify(userId, type, title, body, entityRef) {
  db.prepare(
    `INSERT INTO notifications (user_id, type, title, body, entity_ref)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userId, type, title, body ?? null, entityRef ?? null);
}

module.exports = { logActivity, notify };
