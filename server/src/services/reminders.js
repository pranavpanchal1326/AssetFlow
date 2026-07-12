// Cron-lite reminders: every 60s, notify bookers of upcoming slots starting soon.
// Idempotent per booking via a reminder:booking:<id> entity_ref guard.
const db = require('../db');
const { notify } = require('./activity');

const WINDOW_MINUTES = 30; // remind when a slot starts within the next 30 minutes

function scanOnce() {
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
