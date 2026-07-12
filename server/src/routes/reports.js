// Reports & analytics + CSV export (PRD §5 S9).
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// --- Report computations (each returns an array of flat objects) ---

// Asset utilization: how many times each asset has been allocated (most-used vs idle).
function utilization() {
  return db.prepare(
    `SELECT a.id AS assetId, a.tag, a.name, a.status,
            COUNT(al.id) AS allocationCount
       FROM assets a
       LEFT JOIN allocations al ON al.asset_id = a.id
      GROUP BY a.id
      ORDER BY allocationCount DESC, a.tag`
  ).all();
}

// Maintenance frequency by category.
function maintenanceFrequency() {
  return db.prepare(
    `SELECT COALESCE(c.name, 'Uncategorized') AS category,
            COUNT(m.id) AS requestCount
       FROM maintenance_requests m
       JOIN assets a ON a.id = m.asset_id
       LEFT JOIN categories c ON c.id = a.category_id
      GROUP BY category
      ORDER BY requestCount DESC`
  ).all();
}

// Department-wise allocation summary: active allocations per department
// (assets allocated directly to the dept or to a user in it).
function departmentSummary() {
  return db.prepare(
    `SELECT d.id AS departmentId, d.name AS department,
            COUNT(al.id) AS activeAllocations
       FROM departments d
       LEFT JOIN allocations al
         ON al.status = 'active'
        AND (al.holder_department_id = d.id
             OR al.holder_user_id IN (SELECT id FROM users WHERE department_id = d.id))
      GROUP BY d.id
      ORDER BY activeAllocations DESC, d.name`
  ).all();
}

// Booking heatmap: booking counts by weekday (0=Sun..6=Sat) x hour (0..23),
// bucketed by each booking's start time. Non-cancelled only.
function bookingHeatmap() {
  const rows = db.prepare(
    `SELECT CAST(strftime('%w', start_time) AS INTEGER) AS day,
            CAST(strftime('%H', start_time) AS INTEGER) AS hour,
            COUNT(*) AS count
       FROM bookings
      WHERE status = 'booked'
      GROUP BY day, hour`
  ).all();
  return rows;
}

const REPORTS = {
  'utilization': utilization,
  'maintenance-frequency': maintenanceFrequency,
  'department-summary': departmentSummary,
  'booking-heatmap': bookingHeatmap,
};

// Managers-and-up may view reports.
const canView = requireRole('admin', 'asset_manager', 'dept_head');

router.get('/utilization', requireAuth, canView, (req, res) => {
  res.json({ ok: true, data: utilization() });
});
router.get('/maintenance-frequency', requireAuth, canView, (req, res) => {
  res.json({ ok: true, data: maintenanceFrequency() });
});
router.get('/department-summary', requireAuth, canView, (req, res) => {
  res.json({ ok: true, data: departmentSummary() });
});
router.get('/booking-heatmap', requireAuth, canView, (req, res) => {
  res.json({ ok: true, data: bookingHeatmap() });
});

// Escape a value for CSV (RFC 4180-ish).
function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map((hd) => csvCell(r[hd])).join(','));
  return lines.join('\n');
}

// GET /reports/:name/export → CSV download
router.get('/:name/export', requireAuth, canView, (req, res) => {
  const fn = REPORTS[req.params.name];
  if (!fn) {
    return res.status(404).json({ ok: false, error: 'Unknown report' });
  }
  const csv = toCsv(fn());
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.name}.csv"`);
  res.send(csv);
});

module.exports = router;
