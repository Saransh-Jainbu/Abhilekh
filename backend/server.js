const path = require('path');

// Load .env.local first, then fall back to .env
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`Database URL set: ${process.env.DATABASE_URL ? '✅' : '❌'}`);
});
