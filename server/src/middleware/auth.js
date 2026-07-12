// JWT auth + RBAC middleware.
const jwt = require('jsonwebtoken');
const db = require('../db');

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production (see server/.env.example)');
}
if (!process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('⚠ JWT_SECRET is not set — using an insecure development fallback. Set it in server/.env for real use.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'assetflow-dev-secret-change-me';
const JWT_EXPIRES = '7d';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// Requires a valid Bearer token; loads the fresh user record onto req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid session' });
    if (user.status !== 'active') {
      return res.status(403).json({ ok: false, error: 'Account is inactive' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
  }
}

// Restricts a route to one of the given roles. Use after requireAuth.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: 'You do not have permission to perform this action' });
    }
    next();
  };
}

module.exports = { signToken, requireAuth, requireRole, JWT_SECRET };
