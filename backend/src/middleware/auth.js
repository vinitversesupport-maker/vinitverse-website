const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization header format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload contains { userId, role, iat, exp }
    req.user = payload;
    next();
  } catch (e) {
    console.error('JWT error', e.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
