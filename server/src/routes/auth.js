// Auth routes: signup (employee-only), login, forgot/reset, me.
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');
const { logActivity } = require('../services/activity');

const router = express.Router();

// Shape a user for API responses (never leak password_hash).
function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    departmentId: u.department_id,
    status: u.status,
    createdAt: u.created_at,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /auth/signup — always creates an Employee. No role self-selection (PRD §2.1).
router.post('/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, error: 'Name, email and password are required' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please provide a valid email address' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ ok: false, error: 'An account with that email already exists' });
  }
  const hash = bcrypt.hashSync(String(password), 10);
  const info = db.prepare(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES (?, ?, ?, 'employee', 'active')`
  ).run(name, email, hash);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  logActivity(user.id, 'signup', 'user', user.id, { email });
  const token = signToken(user);
  res.status(201).json({ ok: true, data: { token, user: publicUser(user) } });
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ ok: false, error: 'Invalid email or password' });
  }
  if (user.status !== 'active') {
    return res.status(403).json({ ok: false, error: 'Account is inactive — contact an administrator' });
  }
  const token = signToken(user);
  res.json({ ok: true, data: { token, user: publicUser(user) } });
});

// POST /auth/forgot — returns an in-app reset link (email simulated, PRD §5 S1).
router.post('/forgot', (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ ok: false, error: 'Email is required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Always respond ok to avoid leaking which emails exist; only mint a token if the user is real.
  let resetLink = null;
  if (user) {
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    db.prepare(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).run(user.id, token, expires);
    resetLink = `/reset-password?token=${token}`;
    logActivity(user.id, 'forgot_password', 'user', user.id, null);
  }
  res.json({ ok: true, data: { resetLink } });
});

// POST /auth/reset {token,password}
router.post('/reset', (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ ok: false, error: 'Token and new password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters' });
  }
  const row = db.prepare('SELECT * FROM password_resets WHERE token = ?').get(token);
  if (!row || row.used || new Date(row.expires_at) < new Date()) {
    return res.status(400).json({ ok: false, error: 'This reset link is invalid or has expired' });
  }
  const hash = bcrypt.hashSync(String(password), 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(row.id);
  logActivity(row.user_id, 'reset_password', 'user', row.user_id, null);
  res.json({ ok: true, data: { reset: true } });
});

// GET /auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, data: { user: publicUser(req.user) } });
});

module.exports = router;
module.exports.publicUser = publicUser;
