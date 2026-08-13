-- Migration to add bracket fields to matches table
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS parent_match_id INTEGER REFERENCES matches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position INTEGER;
