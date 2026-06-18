const express = require('express');
const authMiddleware = require('../middleware/auth');
const { sendMessage, getChatHistory } = require('../controllers/chatController');

const router = express.Router();

router.post('/:documentId/message', authMiddleware, sendMessage);
router.get('/:documentId/history', authMiddleware, getChatHistory);

module.exports = router;
