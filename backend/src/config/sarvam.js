const path = require('path');

// Load .env.local first, then fall back to .env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config();

const { SarvamAIClient } = require('sarvamai');

const sarvamClient = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY,
});

module.exports = sarvamClient;
