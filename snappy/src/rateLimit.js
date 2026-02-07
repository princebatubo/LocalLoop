const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'snappy.db');
const MONTHLY_LIMIT = 5;

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_usage_user_month
      ON usage (user_id, created_at)
    `);
  }
  return db;
}

function getMonthlyUsage(userId) {
  const row = getDb().prepare(`
    SELECT COUNT(*) as count FROM usage
    WHERE user_id = ?
    AND created_at >= date('now', 'start of month')
  `).get(userId);

  return row.count;
}

function checkRateLimit(userId) {
  const used = getMonthlyUsage(userId);
  const allowed = used < MONTHLY_LIMIT;
  const remaining = Math.max(0, MONTHLY_LIMIT - used - (allowed ? 1 : 0));

  return { allowed, remaining, used };
}

function recordUsage(userId, postId) {
  getDb().prepare(`
    INSERT INTO usage (user_id, post_id) VALUES (?, ?)
  `).run(userId, postId);
}

module.exports = { checkRateLimit, recordUsage, MONTHLY_LIMIT };
