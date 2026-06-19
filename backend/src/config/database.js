const { Pool } = require('pg');
const path = require('path');

// Load .env.local first, then fall back to .env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config();

// Managed Postgres (Render, Railway, Neon, etc.) requires SSL over external
// connections. Local Postgres does not. Enable SSL unless the connection is to
// localhost, or force it off with DATABASE_SSL=false.
const connectionString = process.env.DATABASE_URL || '';
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
const useSsl = process.env.DATABASE_SSL
  ? process.env.DATABASE_SSL === 'true'
  : !isLocal;

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
