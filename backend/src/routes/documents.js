const express = require('express');
const authMiddleware = require('../middleware/auth');
const upload = require('../utils/fileUpload');
const {
  uploadDocument,
  listDocuments,
  getDocument,
  getFile,
  processDoc,
  getStatus,
  getInsights,
  translate,
  getTranslations,
  deleteDoc,
  getChatHistory,
  chat,
} = require('../controllers/documentController');

const router = express.Router();

router.post('/', authMiddleware, upload.single('file'), uploadDocument);
router.get('/', authMiddleware, listDocuments);
router.get('/:id', authMiddleware, getDocument);
router.get('/:id/file', authMiddleware, getFile);
router.post('/:id/process', authMiddleware, processDoc);
router.get('/:id/status', authMiddleware, getStatus);
router.get('/:id/insights', authMiddleware, getInsights);
router.post('/:id/translate', authMiddleware, translate);
router.get('/:id/translations', authMiddleware, getTranslations);
router.get('/:id/chat', authMiddleware, getChatHistory);
router.post('/:id/chat', authMiddleware, chat);
router.delete('/:id', authMiddleware, deleteDoc);

module.exports = router;
