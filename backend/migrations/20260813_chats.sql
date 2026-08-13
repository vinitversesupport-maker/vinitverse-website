-- chat history tables
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP,
  edited_at TIMESTAMP,
  current_version_id INTEGER
);

CREATE TABLE IF NOT EXISTS message_versions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP,
  edited_by INTEGER REFERENCES users(id)
);
