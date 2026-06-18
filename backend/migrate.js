const fs = require('fs');
const path = require('path');
const pool = require('./src/config/database');

async function runMigrations() {
  try {
    console.log('Starting migrations...');

    const migrationFile = path.join(__dirname, 'migrations', '001_init_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    await pool.query(sql);
    console.log('✓ Database schema initialized successfully');

    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
