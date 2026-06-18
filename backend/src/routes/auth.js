const express = require('express');
const { googleCallback, logout } = require('../controllers/authController');

const router = express.Router();

router.post('/google', googleCallback);
router.post('/logout', logout);

module.exports = router;
