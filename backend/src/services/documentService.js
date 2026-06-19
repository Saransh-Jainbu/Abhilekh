const pool = require('../config/database');

async function createDocument(userId, filename, filePath, languageCode = 'en') {
  const result = await pool.query(
    'INSERT INTO documents (user_id, filename, file_path, status, language_code) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, filename, filePath, 'pending', languageCode]
  );
  return result.rows[0];
}

async function getDocument(userId, documentId) {
  const result = await pool.query(
    'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
    [documentId, userId]
  );
  return result.rows[0];
}

async function getDocuments(userId) {
  const result = await pool.query(
    'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function updateDocumentStatus(documentId, status) {
  const result = await pool.query(
    'UPDATE documents SET status = $1, processed_at = NOW() WHERE id = $2 RETURNING *',
    [status, documentId]
  );
  return result.rows[0];
}

async function updateDocumentStage(documentId, stage) {
  const result = await pool.query(
    'UPDATE documents SET stage = $1 WHERE id = $2 RETURNING *',
    [stage, documentId]
  );
  return result.rows[0];
}

async function updateDocumentText(documentId, text, pages = null) {
  const result = await pool.query(
    'UPDATE documents SET original_text = $1, original_pages = $2, extracted_at = NOW() WHERE id = $3 RETURNING *',
    [text, pages ? JSON.stringify(pages) : null, documentId]
  );
  return result.rows[0];
}

async function createInsight(documentId, insightsText) {
  const result = await pool.query(
    'INSERT INTO insights (document_id, insights_text) VALUES ($1, $2) RETURNING *',
    [documentId, insightsText]
  );
  return result.rows[0];
}

async function getInsight(documentId) {
  const result = await pool.query(
    'SELECT * FROM insights WHERE document_id = $1 ORDER BY generated_at DESC LIMIT 1',
    [documentId]
  );
  return result.rows[0] || null;
}

async function createTranslation(documentId, language, translatedText, translatedPages = null) {
  const pages = translatedPages ? JSON.stringify(translatedPages) : null;
  const result = await pool.query(
    `INSERT INTO translations (document_id, language, translated_text, translated_pages)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (document_id, language)
     DO UPDATE SET translated_text = $3, translated_pages = $4
     RETURNING *`,
    [documentId, language, translatedText, pages]
  );
  return result.rows[0];
}

async function getTranslation(documentId, language) {
  const result = await pool.query(
    'SELECT * FROM translations WHERE document_id = $1 AND language = $2',
    [documentId, language]
  );
  return result.rows[0] || null;
}

async function getTranslations(documentId) {
  const result = await pool.query(
    'SELECT * FROM translations WHERE document_id = $1 ORDER BY created_at DESC',
    [documentId]
  );
  return result.rows;
}

async function deleteDocument(userId, documentId) {
  const result = await pool.query(
    'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id',
    [documentId, userId]
  );
  return result.rows.length > 0;
}

async function saveChatMessage(documentId, userId, role, content) {
  const result = await pool.query(
    'INSERT INTO chat_messages (document_id, user_id, role, content) VALUES ($1, $2, $3, $4) RETURNING *',
    [documentId, userId, role, content]
  );
  return result.rows[0];
}

async function getChatMessages(documentId, limit = 100) {
  const result = await pool.query(
    'SELECT role, content, created_at FROM chat_messages WHERE document_id = $1 ORDER BY created_at ASC LIMIT $2',
    [documentId, limit]
  );
  return result.rows;
}

module.exports = {
  createDocument,
  getDocument,
  getDocuments,
  updateDocumentStatus,
  updateDocumentStage,
  updateDocumentText,
  createInsight,
  getInsight,
  createTranslation,
  getTranslation,
  getTranslations,
  deleteDocument,
  saveChatMessage,
  getChatMessages,
};
