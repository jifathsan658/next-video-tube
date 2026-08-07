CREATE TABLE IF NOT EXISTS users (
  telegram_id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  preview_url TEXT NOT NULL,
  full_url TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ad_sessions (
  ymid TEXT PRIMARY KEY,
  telegram_id TEXT,
  content_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  verified INTEGER DEFAULT 0,
  reward_event_type TEXT,
  estimated_price REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS postbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ymid TEXT,
  event_type TEXT,
  reward_event_type TEXT,
  zone_id TEXT,
  telegram_id TEXT,
  estimated_price REAL DEFAULT 0,
  request_var TEXT,
  received_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_postbacks_ymid ON postbacks(ymid);
CREATE INDEX IF NOT EXISTS idx_sessions_telegram ON ad_sessions(telegram_id);
