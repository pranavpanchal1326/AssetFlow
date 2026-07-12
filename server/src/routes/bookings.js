// Resource booking engine: overlap rejection, derived statuses, cancel/reschedule.
// Overlap rule (PRD §6 S6): newStart < existingEnd && newEnd > existingStart
// on non-cancelled bookings of the same asset. Touching boundaries are allowed.
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { logActivity, notify } = require('../services/activity');

const router = express.Router();

// Derive a display status from time + cancellation.
function derivedStatus(b, now = new Date()) {
  if (b.status === 'cancelled') return 'Cancelled';
  const start = new Date(b.start_time);
  const end = new Date(b.end_time);
  if (now < start) return 'Upcoming';
  if (now >= start && now <= end) return 'Ongoing';
  return 'Completed';
}

function shape(b) {
  return {
    id: b.id,
    assetId: b.asset_id,
    bookedBy: b.booked_by,
    startTime: b.start_time,
    endTime: b.end_time,
    purpose: b.purpose,
    status: derivedStatus(b),
    cancelled: b.status === 'cancelled',
    createdAt: b.created_at,
  };
}

// Returns a conflicting non-cancelled booking for the asset in [start,end), or undefined.
// Optional excludeId skips a booking (used when rescheduling itself).
function findOverlap(assetId, start, end, excludeId) {
  return db.prepare(
    `SELECT * FROM bookings
      WHERE asset_id = @assetId
        AND status = 'booked'
        AND (@excludeId IS NULL OR id != @excludeId)
        AND datetime(start_time) < datetime(@end)
        AND datetime(end_time)   > datetime(@start)
      LIMIT 1`
  ).get({ assetId, start, end, excludeId: excludeId ?? null });
}

function validRange(start, end) {
  const s = new Date(start), e = new Date(end);
  if (isNaN(s) || isNaN(e)) return 'startTime and endTime must be valid dates';
  if (s >= e) return 'endTime must be after startTime';
  return null;
}

// GET /bookings ?assetId=&from=&to=&mine=true
router.get('/', requireAuth, (req, res) => {
  const { assetId, from, to, mine } = req.query;
  const where = [];
  const params = {};
  if (assetId) { where.push('asset_id = @assetId'); params.assetId = assetId; }
  if (from) { where.push('datetime(end_time) >= datetime(@from)'); params.from = from; }
  if (to) { where.push('datetime(start_time) <= datetime(@to)'); params.to = to; }
  if (mine === 'true' || mine === '1') { where.push('booked_by = @me'); params.me = req.user.id; }
  const rows = db.prepare(
    `SELECT * FROM bookings ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY datetime(start_time)`
  ).all(params);
  res.json({ ok: true, data: rows.map(shape) });
});

// POST /bookings {assetId,startTime,endTime,purpose} → 409 on overlap
router.post('/', requireAuth, (req, res) => {
  const { assetId, startTime, endTime, purpose } = req.body || {};
  if (!assetId || !startTime || !endTime) {
    return res.status(400).json({ ok: false, error: 'assetId, startTime and endTime are required' });
  }
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
  if (!asset) {
    return res.status(404).json({ ok: false, error: 'Asset not found' });
  }
  if (!asset.is_bookable) {
    return res.status(400).json({ ok: false, error: 'This asset is not marked as shared/bookable' });
  }
  const rangeErr = validRange(startTime, endTime);
  if (rangeErr) {
    return res.status(400).json({ ok: false, error: rangeErr });
  }
  // Overlap check + insert run atomically so no conflicting slot can slip in between.
  const create = db.transaction(() => {
    const clash = findOverlap(assetId, startTime, endTime);
    if (clash) return { clash };
    const info = db.prepare(
      `INSERT INTO bookings (asset_id, booked_by, start_time, end_time, purpose, status)
       VALUES (?, ?, ?, ?, ?, 'booked')`
    ).run(assetId, req.user.id, startTime, endTime, purpose ?? null);
    return { booking: db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid) };
  });
  const result = create();
  if (result.clash) {
    return res.status(409).json({
      ok: false,
      error: `This slot overlaps an existing booking (${result.clash.start_time} – ${result.clash.end_time})`,
      conflict: shape(result.clash),
    });
  }
  const b = result.booking;
  logActivity(req.user.id, 'book', 'asset', assetId, { bookingId: b.id, startTime, endTime });
  notify(req.user.id, 'booking_confirmed', 'Booking Confirmed',
    `${asset.tag} ${asset.name} booked ${startTime} – ${endTime}`, `booking:${b.id}`);
  res.status(201).json({ ok: true, data: shape(b) });
});

// PUT /bookings/:id {action:"cancel"} | {startTime,endTime}  (reschedule re-validates)
router.put('/:id', requireAuth, (req, res) => {
  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!b) {
    return res.status(404).json({ ok: false, error: 'Booking not found' });
  }
  const privileged = ['admin', 'asset_manager'].includes(req.user.role);
  if (b.booked_by !== req.user.id && !privileged) {
    return res.status(403).json({ ok: false, error: 'You can only modify your own bookings' });
  }
  const { action, startTime, endTime } = req.body || {};

  if (action === 'cancel') {
    if (b.status === 'cancelled') {
      return res.status(400).json({ ok: false, error: 'Booking is already cancelled' });
    }
    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(b.id);
    logActivity(req.user.id, 'cancel_booking', 'asset', b.asset_id, { bookingId: b.id });
    notify(b.booked_by, 'booking_cancelled', 'Booking Cancelled',
      `Your booking for asset #${b.asset_id} was cancelled`, `booking:${b.id}`);
    return res.json({ ok: true, data: shape(db.prepare('SELECT * FROM bookings WHERE id = ?').get(b.id)) });
  }

  // Reschedule
  if (startTime && endTime) {
    if (b.status === 'cancelled') {
      return res.status(400).json({ ok: false, error: 'Cannot reschedule a cancelled booking' });
    }
    const rangeErr = validRange(startTime, endTime);
    if (rangeErr) {
      return res.status(400).json({ ok: false, error: rangeErr });
    }
    const clash = findOverlap(b.asset_id, startTime, endTime, b.id);
    if (clash) {
      return res.status(409).json({
        ok: false,
        error: `This slot overlaps an existing booking (${clash.start_time} – ${clash.end_time})`,
        conflict: shape(clash),
      });
    }
    db.prepare('UPDATE bookings SET start_time = ?, end_time = ? WHERE id = ?').run(startTime, endTime, b.id);
    logActivity(req.user.id, 'reschedule_booking', 'asset', b.asset_id, { bookingId: b.id, startTime, endTime });
    return res.json({ ok: true, data: shape(db.prepare('SELECT * FROM bookings WHERE id = ?').get(b.id)) });
  }

  res.status(400).json({ ok: false, error: 'Provide action:"cancel" or startTime+endTime to reschedule' });
});

module.exports = router;
module.exports.derivedStatus = derivedStatus;
