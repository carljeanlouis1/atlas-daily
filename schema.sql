CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  published_at TEXT NOT NULL,
  read_time INTEGER DEFAULT 5,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category);
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON stories(published_at DESC);
