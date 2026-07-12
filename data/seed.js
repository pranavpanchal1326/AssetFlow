/**
 * seed.js — AssetFlow Database Seed Script
 * 
 * Loads all JSON seed data from the data/ directory into the SQLite database.
 * Creates the admin account (admin@assetflow.app / Admin@123) as specified in 
 * IMPLEMENTATION.md §4 Phase A1.
 * 
 * Usage:
 *   node server/src/seed.js
 * 
 * Prerequisites:
 *   - SQLite database initialized (db.js must have run CREATE TABLE statements)
 *   - bcryptjs installed
 *   - data/*.json files present in project root
 * 
 * This script is idempotent — it will DROP and recreate data on each run.
 */

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Database connection — adjust path based on your db.js setup
const Database = require('better-sqlite3');
const DB_PATH = path.join(__dirname, '..', 'assetflow.db');
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`  ⚠  ${filename} not found, skipping.`);
    return [];
  }
  const raw = fs.readFileSync(filepath, 'utf8');
  return JSON.parse(raw);
}

function seed() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  console.log('🌱 AssetFlow Seed Script');
  console.log('========================\n');

  // ── 1. Clear existing data (reverse FK order) ──────────────────────
  console.log('Clearing existing data...');
  const tables = [
    'activity_logs', 'notifications', 'password_resets',
    'audit_items', 'audit_assignments', 'audit_cycles',
    'maintenance_requests', 'bookings', 'transfer_requests',
    'allocations', 'assets', 'categories', 'departments', 'users'
  ];
  for (const table of tables) {
    db.exec(`DELETE FROM ${table}`);
  }
  console.log('  ✓ All tables cleared.\n');

  // ── 2. Seed Admin Account ─────────────────────────────────────────
  console.log('Creating admin account...');
  const adminHash = bcrypt.hashSync('Admin@123', 10);
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, department_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 'Arjun Mehta', 'admin@assetflow.app', adminHash, 'admin', null, 'active', '2025-06-01T09:00:00.000Z');
  console.log('  ✓ Admin: admin@assetflow.app / Admin@123\n');

  // ── 3. Seed Departments ───────────────────────────────────────────
  console.log('Seeding departments...');
  const departments = loadJSON('departments.json');
  const deptStmt = db.prepare(`
    INSERT INTO departments (id, name, head_user_id, parent_id, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const d of departments) {
    deptStmt.run(d.id, d.name, d.head_user_id, d.parent_id, d.status);
  }
  console.log(`  ✓ ${departments.length} departments seeded.\n`);

  // ── 4. Seed Categories ────────────────────────────────────────────
  console.log('Seeding categories...');
  const categories = loadJSON('categories.json');
  const catStmt = db.prepare(`
    INSERT INTO categories (id, name, description, custom_fields)
    VALUES (?, ?, ?, ?)
  `);
  for (const c of categories) {
    catStmt.run(c.id, c.name, c.description, JSON.stringify(c.custom_fields));
  }
  console.log(`  ✓ ${categories.length} categories seeded.\n`);

  // ── 5. Seed Employees/Users ───────────────────────────────────────
  console.log('Seeding employees...');
  const employees = loadJSON('employees.json');
  const userStmt = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, password_hash, role, department_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const defaultHash = bcrypt.hashSync('Password@123', 10);
  for (const e of employees) {
    // Admin already inserted above with admin@assetflow.app; 
    // also insert their org email for reference
    if (e.id === 1) {
      // Update admin's department now that departments are seeded
      db.prepare('UPDATE users SET department_id = ? WHERE id = 1').run(e.department_id);
      // Also insert the org-email alias (admin uses admin@assetflow.app for login)
      continue;
    }
    const hash = e.password === 'Admin@123' ? adminHash : defaultHash;
    userStmt.run(e.id, e.name, e.email, hash, e.role, e.department_id, e.status, e.created_at);
  }
  console.log(`  ✓ ${employees.length} employees seeded (including admin).\n`);

  // ── 6. Seed Assets ────────────────────────────────────────────────
  console.log('Seeding assets...');
  const assets = loadJSON('assets.json');
  const assetStmt = db.prepare(`
    INSERT INTO assets (id, tag, name, category_id, serial_no, acquisition_date, acquisition_cost, 
                        condition, location, is_bookable, status, custom_values, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of assets) {
    assetStmt.run(
      a.id, a.tag, a.name, a.category_id, a.serial_no,
      a.acquisition_date, a.acquisition_cost, a.condition,
      a.location, a.is_bookable ? 1 : 0, a.status,
      JSON.stringify(a.custom_values), a.created_by
    );
  }
  console.log(`  ✓ ${assets.length} assets seeded.\n`);

  // ── 7. Seed Allocations ───────────────────────────────────────────
  console.log('Seeding allocations...');
  const allocations = loadJSON('allocations.json');
  const allocStmt = db.prepare(`
    INSERT INTO allocations (id, asset_id, holder_user_id, holder_department_id, allocated_by,
                             allocated_at, expected_return_date, returned_at, return_condition_notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of allocations) {
    allocStmt.run(
      a.id, a.asset_id, a.holder_user_id, a.holder_department_id,
      a.allocated_by, a.allocated_at, a.expected_return_date,
      a.returned_at, a.return_condition_notes, a.status
    );
  }
  console.log(`  ✓ ${allocations.length} allocations seeded.\n`);

  // ── 8. Seed Transfer Requests ─────────────────────────────────────
  console.log('Seeding transfer requests...');
  const transfers = loadJSON('transfers.json');
  const transferStmt = db.prepare(`
    INSERT INTO transfer_requests (id, asset_id, from_allocation_id, requested_by, 
                                   to_user_id, to_department_id, status, decided_by, decided_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of transfers) {
    transferStmt.run(
      t.id, t.asset_id, t.from_allocation_id, t.requested_by,
      t.to_user_id, t.to_department_id, t.status, t.decided_by, t.decided_at
    );
  }
  console.log(`  ✓ ${transfers.length} transfer requests seeded.\n`);

  // ── 9. Seed Bookings ──────────────────────────────────────────────
  console.log('Seeding bookings...');
  const bookings = loadJSON('bookings.json');
  const bookingStmt = db.prepare(`
    INSERT INTO bookings (id, asset_id, booked_by, start_time, end_time, purpose, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const b of bookings) {
    bookingStmt.run(b.id, b.asset_id, b.booked_by, b.start_time, b.end_time, b.purpose, b.status);
  }
  console.log(`  ✓ ${bookings.length} bookings seeded.\n`);

  // ── 10. Seed Maintenance Requests ─────────────────────────────────
  console.log('Seeding maintenance requests...');
  const maintenance = loadJSON('maintenance.json');
  const maintStmt = db.prepare(`
    INSERT INTO maintenance_requests (id, asset_id, raised_by, issue, priority, photo_url,
                                      status, technician_name, technician_contact, decided_by, resolved_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const m of maintenance) {
    maintStmt.run(
      m.id, m.asset_id, m.raised_by, m.issue, m.priority, m.photo_url,
      m.status, m.technician_name, m.technician_contact, m.decided_by,
      m.resolved_at, m.created_at
    );
  }
  console.log(`  ✓ ${maintenance.length} maintenance requests seeded.\n`);

  // ── 11. Seed Audit Cycles ─────────────────────────────────────────
  console.log('Seeding audit cycles...');
  const cycles = loadJSON('audit_cycles.json');
  const cycleStmt = db.prepare(`
    INSERT INTO audit_cycles (id, name, scope_department_id, scope_location, start_date, end_date, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of cycles) {
    cycleStmt.run(c.id, c.name, c.scope_department_id, c.scope_location, c.start_date, c.end_date, c.status, c.created_by);
  }
  console.log(`  ✓ ${cycles.length} audit cycles seeded.\n`);

  // ── 12. Seed Audit Assignments ────────────────────────────────────
  console.log('Seeding audit assignments...');
  const assignments = loadJSON('audit_assignments.json');
  const assignStmt = db.prepare(`
    INSERT INTO audit_assignments (id, cycle_id, auditor_user_id)
    VALUES (?, ?, ?)
  `);
  for (const a of assignments) {
    assignStmt.run(a.id, a.cycle_id, a.auditor_user_id);
  }
  console.log(`  ✓ ${assignments.length} audit assignments seeded.\n`);

  // ── 13. Seed Audit Items ──────────────────────────────────────────
  console.log('Seeding audit items...');
  const items = loadJSON('audit_items.json');
  const itemStmt = db.prepare(`
    INSERT INTO audit_items (id, cycle_id, asset_id, result, note, checked_by, checked_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const i of items) {
    itemStmt.run(i.id, i.cycle_id, i.asset_id, i.result, i.note, i.checked_by, i.checked_at);
  }
  console.log(`  ✓ ${items.length} audit items seeded.\n`);

  // ── 14. Seed Notifications ────────────────────────────────────────
  console.log('Seeding notifications...');
  const notifications = loadJSON('notifications.json');
  const notifStmt = db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, body, entity_ref, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const n of notifications) {
    notifStmt.run(n.id, n.user_id, n.type, n.title, n.body, n.entity_ref, n.is_read ? 1 : 0, n.created_at);
  }
  console.log(`  ✓ ${notifications.length} notifications seeded.\n`);

  // ── 15. Seed Activity Logs ────────────────────────────────────────
  console.log('Seeding activity logs...');
  const logs = loadJSON('activity_logs.json');
  const logStmt = db.prepare(`
    INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const l of logs) {
    logStmt.run(l.id, l.user_id, l.action, l.entity_type, l.entity_id, JSON.stringify(l.detail), l.created_at);
  }
  console.log(`  ✓ ${logs.length} activity log entries seeded.\n`);

  // ── Summary ───────────────────────────────────────────────────────
  console.log('========================');
  console.log('🎉 Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:          admin@assetflow.app  /  Admin@123');
  console.log('  All other users: <email>  /  Password@123');
  console.log('');
  console.log(`Database: ${DB_PATH}`);
  console.log(`Total: ${departments.length} depts, ${employees.length} users, ${assets.length} assets,`);
  console.log(`       ${allocations.length} allocations, ${transfers.length} transfers, ${bookings.length} bookings,`);
  console.log(`       ${maintenance.length} maintenance, ${cycles.length} audits, ${notifications.length} notifications,`);
  console.log(`       ${logs.length} activity logs`);

  db.close();
}

try {
  seed();
} catch (err) {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
}
