const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

async function authMiddleware(req, res, next) {
  try {
    const sessionId = req.headers['x-session-id'] || req.session?.sessionId;

    if (!sessionId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify JWT token
    const decoded = jwt.verify(sessionId, process.env.SESSION_SECRET);
    const userId = decoded.userId;

    // Get user from database
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = authMiddleware;
