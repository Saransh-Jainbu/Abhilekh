const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleCallback(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify the token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, sub: googleId, name } = payload;

    // Find or create user
    let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);

    if (result.rows.length === 0) {
      // Create new user
      result = await pool.query(
        'INSERT INTO users (email, google_id) VALUES ($1, $2) RETURNING id, email, created_at',
        [email, googleId]
      );
    }

    const user = result.rows[0];

    // Create session
    const sessionId = jwt.sign({ userId: user.id, email: user.email }, process.env.SESSION_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      sessionId,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

async function logout(req, res) {
  res.json({ message: 'Logged out' });
}

module.exports = {
  googleCallback,
  logout,
};
