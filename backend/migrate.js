const fs = require('fs');
const path = require('path');
const pool = require('./src/config/database');

async function runMigrations() {
  try {
    console.log('Starting migrations...');

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await pool.query(sql);
      console.log(`✓ Applied ${file}`);
    }

    console.log('✓ Database schema initialized successfully');

    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
