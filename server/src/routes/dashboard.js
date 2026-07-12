// Dashboard KPI endpoint (PRD §5 S2).
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /dashboard/kpis
router.get('/kpis', requireAuth, (req, res) => {
  const count = (sql, params = {}) => db.prepare(sql).get(params).c;

  const available = count(`SELECT COUNT(*) c FROM assets WHERE status = 'Available'`);
  const allocated = count(`SELECT COUNT(*) c FROM assets WHERE status = 'Allocated'`);
  const maintenanceToday = count(
    `SELECT COUNT(*) c FROM maintenance_requests WHERE date(created_at) = date('now')`
  );
  const activeBookings = count(
    `SELECT COUNT(*) c FROM bookings
      WHERE status = 'booked'
        AND datetime(start_time) <= datetime('now')
        AND datetime(end_time)   >= datetime('now')`
  );
  const pendingTransfers = count(`SELECT COUNT(*) c FROM transfer_requests WHERE status = 'requested'`);
  const upcomingReturns = count(
    `SELECT COUNT(*) c FROM allocations
      WHERE status = 'active' AND returned_at IS NULL
        AND expected_return_date IS NOT NULL
        AND datetime(expected_return_date) >= datetime('now')`
  );

  // Overdue returns as a detailed list (red panel on the dashboard).
  const overdueReturns = db.prepare(
    `SELECT al.id, al.asset_id, al.expected_return_date,
            a.tag AS asset_tag, a.name AS asset_name,
            u.name AS holder_name, d.name AS holder_department
       FROM allocations al
       JOIN assets a ON a.id = al.asset_id
       LEFT JOIN users u ON u.id = al.holder_user_id
       LEFT JOIN departments d ON d.id = al.holder_department_id
      WHERE al.status = 'active' AND al.returned_at IS NULL
        AND al.expected_return_date IS NOT NULL
        AND datetime(al.expected_return_date) < datetime('now')
      ORDER BY al.expected_return_date ASC`
  ).all().map((r) => ({
    allocationId: r.id,
    assetId: r.asset_id,
    assetTag: r.asset_tag,
    assetName: r.asset_name,
    holderName: r.holder_name || r.holder_department || 'Unknown',
    expectedReturnDate: r.expected_return_date,
  }));

  res.json({
    ok: true,
    data: {
      available,
      allocated,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
      overdueReturns,
    },
  });
});

module.exports = router;
