// SQLite database bootstrap + schema (PRD §6).
// Single better-sqlite3 connection shared across the app.
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'assetflow.db');

// If DB_PATH is inside a volume and doesn't exist, copy the pre-seeded DB from the package
if (!fs.existsSync(DB_PATH)) {
  const defaultDbPath = path.join(__dirname, '..', 'assetflow.db');
  if (fs.existsSync(defaultDbPath) && path.resolve(DB_PATH) !== path.resolve(defaultDbPath)) {
    console.log(`Database not found at ${DB_PATH}. Copying pre-seeded database from ${defaultDbPath}...`);
    try {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.copyFileSync(defaultDbPath, DB_PATH);
      console.log('Database successfully copied.');
    } catch (err) {
      console.error('Failed to copy pre-seeded database:', err);
    }
  }
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');


// Full schema. Every table from PRD §6. Idempotent (IF NOT EXISTS).
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  email          TEXT    NOT NULL UNIQUE,
  password_hash  TEXT    NOT NULL,
  role           TEXT    NOT NULL DEFAULT 'employee'
                 CHECK (role IN ('admin','asset_manager','dept_head','employee')),
  department_id  INTEGER REFERENCES departments(id),
  status         TEXT    NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','inactive')),
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS departments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  head_user_id  INTEGER REFERENCES users(id),
  parent_id     INTEGER REFERENCES departments(id),
  status        TEXT    NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','inactive'))
);

CREATE TABLE IF NOT EXISTS categories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  description   TEXT,
  custom_fields TEXT    NOT NULL DEFAULT '[]'   -- JSON array of field definitions
);

CREATE TABLE IF NOT EXISTS assets (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  tag              TEXT    NOT NULL UNIQUE,      -- AF-0001 sequence
  name             TEXT    NOT NULL,
  category_id      INTEGER REFERENCES categories(id),
  serial_no        TEXT,
  acquisition_date TEXT,
  acquisition_cost REAL,
  condition        TEXT    CHECK (condition IN ('New','Good','Fair','Poor')),
  location         TEXT,
  photo_url        TEXT,
  is_bookable      INTEGER NOT NULL DEFAULT 0,
  status           TEXT    NOT NULL DEFAULT 'Available'
                   CHECK (status IN ('Available','Allocated','Reserved','Under Maintenance','Lost','Retired','Disposed')),
  custom_values    TEXT    NOT NULL DEFAULT '{}', -- JSON object
  created_by       INTEGER REFERENCES users(id),
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS asset_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id   INTEGER NOT NULL REFERENCES assets(id),
  from_state TEXT,
  to_state   TEXT    NOT NULL,
  actor_id   INTEGER REFERENCES users(id),
  detail     TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS allocations (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id               INTEGER NOT NULL REFERENCES assets(id),
  holder_user_id         INTEGER REFERENCES users(id),
  holder_department_id   INTEGER REFERENCES departments(id),
  allocated_by           INTEGER REFERENCES users(id),
  allocated_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  expected_return_date   TEXT,
  returned_at            TEXT,
  return_condition_notes TEXT,
  status                 TEXT    NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','returned'))
);

CREATE TABLE IF NOT EXISTS transfer_requests (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id            INTEGER NOT NULL REFERENCES assets(id),
  from_allocation_id  INTEGER REFERENCES allocations(id),
  requested_by        INTEGER REFERENCES users(id),
  to_user_id          INTEGER REFERENCES users(id),
  to_department_id    INTEGER REFERENCES departments(id),
  status              TEXT    NOT NULL DEFAULT 'requested'
                      CHECK (status IN ('requested','approved','rejected')),
  decided_by          INTEGER REFERENCES users(id),
  decided_at          TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id   INTEGER NOT NULL REFERENCES assets(id),
  booked_by  INTEGER REFERENCES users(id),
  start_time TEXT    NOT NULL,
  end_time   TEXT    NOT NULL,
  purpose    TEXT,
  status     TEXT    NOT NULL DEFAULT 'booked'
             CHECK (status IN ('booked','cancelled')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id           INTEGER NOT NULL REFERENCES assets(id),
  raised_by          INTEGER REFERENCES users(id),
  issue              TEXT    NOT NULL,
  priority           TEXT    NOT NULL DEFAULT 'Medium'
                     CHECK (priority IN ('Low','Medium','High')),
  photo_url          TEXT,
  status             TEXT    NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected','assigned','in_progress','resolved')),
  technician_name    TEXT,
  technician_contact TEXT,
  decided_by         INTEGER REFERENCES users(id),
  resolved_at        TEXT,
  created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_cycles (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL,
  scope_department_id INTEGER REFERENCES departments(id),
  scope_location      TEXT,
  start_date          TEXT,
  end_date            TEXT,
  status              TEXT    NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','closed')),
  created_by          INTEGER REFERENCES users(id),
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_assignments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id        INTEGER NOT NULL REFERENCES audit_cycles(id),
  auditor_user_id INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id   INTEGER NOT NULL REFERENCES audit_cycles(id),
  asset_id   INTEGER NOT NULL REFERENCES assets(id),
  result     TEXT    NOT NULL DEFAULT 'pending'
             CHECK (result IN ('pending','verified','missing','damaged')),
  note       TEXT,
  checked_by INTEGER REFERENCES users(id),
  checked_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  type       TEXT    NOT NULL,
  title      TEXT    NOT NULL,
  body       TEXT,
  entity_ref TEXT,
  is_read    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id),
  action      TEXT    NOT NULL,
  entity_type TEXT,
  entity_id   INTEGER,
  detail      TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_resets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  token      TEXT    NOT NULL,
  expires_at TEXT    NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0
);
`);

module.exports = db;
