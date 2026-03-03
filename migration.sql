-- Migration: Add v2 columns to stories table
ALTER TABLE stories ADD COLUMN content_hash TEXT;
ALTER TABLE stories ADD COLUMN input_type TEXT;
ALTER TABLE stories ADD COLUMN original_input TEXT;
CREATE INDEX IF NOT EXISTS idx_stories_content_hash ON stories(content_hash);
