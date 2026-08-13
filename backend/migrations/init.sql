-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'player',
  created_at TIMESTAMP
);

-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  title TEXT,
  type TEXT,
  description TEXT,
  start_date TIMESTAMP,
  status TEXT,
  created_by INTEGER,
  created_at TIMESTAMP
);

-- Participants
CREATE TABLE IF NOT EXISTS tournament_participants (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  seed INTEGER,
  status TEXT,
  joined_at TIMESTAMP,
  UNIQUE (tournament_id, user_id)
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER,
  player1_id INTEGER REFERENCES users(id),
  player2_id INTEGER REFERENCES users(id),
  score1 INTEGER,
  score2 INTEGER,
  scheduled_at TIMESTAMP,
  status TEXT,
  winner_id INTEGER
);

-- Chat logs
CREATE TABLE IF NOT EXISTS chat_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  message TEXT,
  sender TEXT,
  tournament_id INTEGER,
  created_at TIMESTAMP
);

-- Q/A table (for local chatbot)
CREATE TABLE IF NOT EXISTS qa_kv (
  id SERIAL PRIMARY KEY,
  question_text TEXT,
  answer_text TEXT,
  tags TEXT,
  created_at TIMESTAMP
);

-- Sample QA
INSERT INTO qa_kv (question_text, answer_text, created_at) VALUES
('tournament ka schedule', 'Tournament schedule homepage par aur specific tournament page par diya hota hai.', NOW()),
('kaise join karen', 'Tournament page par join kar ke register karein.', NOW());

-- Seed tournaments (from user)
INSERT INTO tournaments (title,type,description,start_date,status,created_at) VALUES
('BR Solo','battle_royale','BR Solo — max 20 players, entry ₹200',NOW(),'open',NOW()),
('BR Duo','battle_royale','BR Duo — max 40 teams, entry ₹400',NOW(),'open',NOW()),
('BR Squad','battle_royale','BR Squad — max 80 teams, entry ₹800',NOW(),'open',NOW()),
('CS 1v1','cs','CS 1v1 — max 100 players, entry ₹150',NOW(),'open',NOW()),
('CS 2v2','cs','CS 2v2 — max 150 teams, entry ₹200',NOW(),'open',NOW()),
('CS 4v4','cs','CS 4v4 — max 200 teams, entry ₹400',NOW(),'open',NOW());
