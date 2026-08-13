const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      'INSERT INTO users (name,email,password_hash,role,created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING id,name,email,role',
      [name||null,email,hashed,'player']
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const r = await db.query('SELECT id,name,email,password_hash,role FROM users WHERE email=$1', [email]);
  if(r.rowCount === 0) return res.status(400).json({ error: 'Invalid credentials' });
  const user = r.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if(!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: {id:user.id,name:user.name,email:user.email,role:user.role}, token });
});

module.exports = router;
