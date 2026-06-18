const axios = require('axios');
require('dotenv').config();

const sarvamClient = axios.create({
  baseURL: 'https://api.sarvam.ai/v1',
  headers: {
    'API-Subscription-Key': process.env.SARVAM_API_KEY,
    'Content-Type': 'application/json',
  },
});

module.exports = sarvamClient;
