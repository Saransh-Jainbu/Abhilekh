const pool = require('../config/database');

async function createDocument(userId, filename, filePath) {
  const result = await pool.query(
    'INSERT INTO documents (user_id, filename, file_path, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, filename, filePath, 'pending']
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

async function updateDocumentText(documentId, text) {
  const result = await pool.query(
    'UPDATE documents SET original_text = $1, extracted_at = NOW() WHERE id = $2 RETURNING *',
    [text, documentId]
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

async function createTranslation(documentId, language, translatedText) {
  const result = await pool.query(
    'INSERT INTO translations (document_id, language, translated_text) VALUES ($1, $2, $3) ON CONFLICT (document_id, language) DO UPDATE SET translated_text = $3 RETURNING *',
    [documentId, language, translatedText]
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

module.exports = {
  createDocument,
  getDocument,
  getDocuments,
  updateDocumentStatus,
  updateDocumentText,
  createInsight,
  getInsight,
  createTranslation,
  getTranslation,
  getTranslations,
  deleteDocument,
};
