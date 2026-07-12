// Cron-lite reminders: every 60s, notify bookers of upcoming slots starting soon
// and flag overdue returns. Idempotent per entity via entity_ref guards.
const db = require('../db');
const { notify } = require('./activity');

const WINDOW_MINUTES = 30; // remind when a slot starts within the next 30 minutes

// Overdue Return Alerts: one per overdue allocation, emitted automatically so
// they appear even if no client ever queries /allocations?overdue=true.
function scanOverdue() {
  const rows = db.prepare(
    `SELECT al.id, al.holder_user_id, al.expected_return_date,
            a.tag AS asset_tag, a.name AS asset_name
       FROM allocations al JOIN assets a ON a.id = al.asset_id
      WHERE al.status = 'active' AND al.returned_at IS NULL
        AND al.holder_user_id IS NOT NULL
        AND al.expected_return_date IS NOT NULL
        AND datetime(al.expected_return_date) < datetime('now')`
  ).all();
  for (const al of rows) {
    const ref = `overdue:allocation:${al.id}`;
    const exists = db.prepare('SELECT 1 FROM notifications WHERE entity_ref = ? LIMIT 1').get(ref);
    if (exists) continue;
    notify(al.holder_user_id, 'overdue_return', 'Overdue Return Alert',
      `${al.asset_tag} ${al.asset_name} was due on ${al.expected_return_date}`, ref);
  }
}

function scanOnce() {
  scanOverdue();
  const now = new Date();
  const horizon = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000).toISOString();
  const rows = db.prepare(
    `SELECT b.*, a.tag AS asset_tag, a.name AS asset_name
       FROM bookings b JOIN assets a ON a.id = b.asset_id
      WHERE b.status = 'booked'
        AND datetime(b.start_time) > datetime(@now)
        AND datetime(b.start_time) <= datetime(@horizon)`
  ).all({ now: now.toISOString(), horizon });
  for (const b of rows) {
    const ref = `reminder:booking:${b.id}`;
    const exists = db.prepare('SELECT 1 FROM notifications WHERE entity_ref = ? LIMIT 1').get(ref);
    if (exists) continue;
    notify(b.booked_by, 'booking_reminder', 'Booking Reminder',
      `${b.asset_tag} ${b.asset_name} starts at ${b.start_time}`, ref);
  }
}

let timer = null;
function startReminders() {
  if (timer) return timer;
  try { scanOnce(); } catch (err) { console.error('reminder scan error', err); }
  timer = setInterval(() => {
    try { scanOnce(); } catch (err) { console.error('reminder scan error', err); }
  }, 60 * 1000);
  timer.unref?.();
  return timer;
}

module.exports = { startReminders, scanOnce };
