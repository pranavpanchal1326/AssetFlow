// Seed script. Creates the first Admin and loads data/*.json when present.
// Idempotent: safe to re-run — it will not duplicate the admin or seeded rows.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function loadJson(name) {
  const file = path.join(DATA_DIR, name);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.warn(`  ! could not parse ${name}: ${err.message}`);
    return null;
  }
}

function seedAdmin() {
  const email = 'admin@assetflow.app';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    console.log('  · admin already exists, skipping');
    return existing.id;
  }
  const hash = bcrypt.hashSync('Admin@123', 10);
  const info = db.prepare(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES (?, ?, ?, 'admin', 'active')`
  ).run('Admin', email, hash);
  console.log(`  ✓ created admin ${email} / Admin@123`);
  return info.lastInsertRowid;
}

function seedDepartments() {
  const rows = loadJson('departments.json');
  if (!rows) return;
  const insert = db.prepare(
    `INSERT INTO departments (name, head_user_id, parent_id, status)
     VALUES (@name, @head_user_id, @parent_id, @status)`
  );
  let n = 0;
  for (const r of rows) {
    const exists = db.prepare('SELECT id FROM departments WHERE name = ?').get(r.name);
    if (exists) continue;
    insert.run({
      name: r.name,
      head_user_id: r.head_user_id ?? null,
      parent_id: r.parent_id ?? null,
      status: r.status ?? 'active',
    });
    n++;
  }
  if (n) console.log(`  ✓ seeded ${n} departments`);
}

function seedCategories() {
  const rows = loadJson('categories.json');
  if (!rows) return;
  const insert = db.prepare(
    `INSERT INTO categories (name, description, custom_fields)
     VALUES (@name, @description, @custom_fields)`
  );
  let n = 0;
  for (const r of rows) {
    const exists = db.prepare('SELECT id FROM categories WHERE name = ?').get(r.name);
    if (exists) continue;
    insert.run({
      name: r.name,
      description: r.description ?? null,
      custom_fields: JSON.stringify(r.custom_fields ?? r.customFields ?? []),
    });
    n++;
  }
  if (n) console.log(`  ✓ seeded ${n} categories`);
}

function seedEmployees() {
  const rows = loadJson('employees.json');
  if (!rows) return;
  const insert = db.prepare(
    `INSERT INTO users (name, email, password_hash, role, department_id, status)
     VALUES (@name, @email, @password_hash, @role, @department_id, @status)`
  );
  const defaultHash = bcrypt.hashSync('Passw0rd!', 10);
  let n = 0;
  for (const r of rows) {
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(r.email);
    if (exists) continue;
    insert.run({
      name: r.name,
      email: r.email,
      password_hash: r.password ? bcrypt.hashSync(r.password, 10) : defaultHash,
      role: r.role ?? 'employee',
      department_id: r.department_id ?? null,
      status: r.status ?? 'active',
    });
    n++;
  }
  if (n) console.log(`  ✓ seeded ${n} employees (default password: Passw0rd!)`);
}

function main() {
  console.log('Seeding AssetFlow database...');
  const run = db.transaction(() => {
    seedAdmin();
    seedDepartments();
    seedCategories();
    seedEmployees();
    // assets / bookings / maintenance seeds are wired in later phases (A2+).
  });
  run();
  console.log('Seed complete.');
}

main();
