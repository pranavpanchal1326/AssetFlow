// AssetFlow API server entry point.
const path = require('path');
const express = require('express');
const cors = require('cors');

require('./db'); // ensure schema is created on boot

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
// Static uploads (photos/documents) — populated in later phases.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, data: { status: 'up', time: new Date().toISOString() } });
});

// --- Routes (Phase A1) ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/users', require('./routes/users'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/allocations', require('./routes/allocations'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/maintenance', require('./routes/maintenance'));

// 404 for unknown API routes.
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: 'Endpoint not found' });
});

// Central error handler — always contract-shaped.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ ok: false, error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AssetFlow API listening on http://localhost:${PORT}`);
  });
  // Cron-lite booking reminders (skipped during test imports).
  require('./services/reminders').startReminders();
}

module.exports = app;
