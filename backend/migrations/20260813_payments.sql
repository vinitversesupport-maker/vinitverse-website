-- Add entry_fee and max_players to tournaments and payments table + participant status
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS entry_fee INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_players INTEGER;

-- Add payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  amount INTEGER,
  currency TEXT DEFAULT 'INR',
  method TEXT,
  txn_id TEXT,
  proof_path TEXT,
  status TEXT DEFAULT 'pending', -- pending, verified, rejected
  created_at TIMESTAMP,
  verified_by INTEGER,
  verified_at TIMESTAMP
);

-- Add status to participants
ALTER TABLE tournament_participants
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL;
