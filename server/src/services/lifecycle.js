// Asset lifecycle state machine (PRD §4).
// Single entry point transitionAsset() validates the transition, updates the
// asset status, and writes both asset_history and the global activity log.
const db = require('../db');
const { logActivity } = require('./activity');

const STATES = [
  'Available', 'Allocated', 'Reserved', 'Under Maintenance',
  'Lost', 'Retired', 'Disposed',
];

// Allowed transitions per PRD §4. Note Allocated → Allocated is permitted
// (transfer re-allocation, history updated).
const TRANSITIONS = {
  'Available':         ['Allocated', 'Reserved', 'Under Maintenance', 'Retired', 'Disposed', 'Lost'],
  'Allocated':         ['Available', 'Allocated', 'Under Maintenance', 'Lost'],
  'Reserved':          ['Allocated', 'Available'],
  'Under Maintenance': ['Available', 'Retired', 'Disposed'],
  'Lost':              ['Available'],
  'Retired':           ['Disposed'],
  'Disposed':          [], // terminal
};

function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

// Thrown for invalid transitions so routes can turn it into a 400.
class TransitionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TransitionError';
    this.status = 400;
  }
}

// transitionAsset(assetId, toState, actorId, detail?)
// Returns the updated asset row. Throws TransitionError on an illegal move.
function transitionAsset(assetId, toState, actorId, detail) {
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
  if (!asset) {
    throw new TransitionError('Asset not found');
  }
  if (!STATES.includes(toState)) {
    throw new TransitionError(`Unknown state "${toState}"`);
  }
  const from = asset.status;
  if (from === toState && toState !== 'Allocated') {
    // No-op for identical states, except Allocated→Allocated which is a real transfer.
    return asset;
  }
  if (!canTransition(from, toState)) {
    throw new TransitionError(`Cannot move asset from ${from} to ${toState}`);
  }
  db.prepare('UPDATE assets SET status = ? WHERE id = ?').run(toState, assetId);
  db.prepare(
    `INSERT INTO asset_history (asset_id, from_state, to_state, actor_id, detail)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    assetId, from, toState, actorId ?? null,
    detail == null ? null : (typeof detail === 'string' ? detail : JSON.stringify(detail))
  );
  logActivity(actorId, 'transition', 'asset', assetId, { from, to: toState, ...(detail && typeof detail === 'object' ? detail : {}) });
  return db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
}

module.exports = { STATES, TRANSITIONS, canTransition, transitionAsset, TransitionError };
