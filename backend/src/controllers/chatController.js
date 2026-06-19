const pool = require('../config/database');
const documentService = require('../services/documentService');
const { chatWithDocument } = require('../services/sarvamService');

async function sendMessage(req, res) {
  try {
    const { documentId } = req.params;
    const { message, language } = req.body;
    const { user } = req;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify document exists and belongs to user
    const doc = await documentService.getDocument(user.id, documentId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!doc.original_text) {
      return res.status(400).json({ error: 'Document has not been processed yet' });
    }

    // Save user message
    await pool.query(
      'INSERT INTO chat_messages (document_id, user_id, role, content) VALUES ($1, $2, $3, $4)',
      [documentId, user.id, 'user', message]
    );

    // Get chat history (last 10 messages, excluding the one we just added)
    const historyResult = await pool.query(
      'SELECT role, content FROM chat_messages WHERE document_id = $1 ORDER BY created_at DESC LIMIT 11',
      [documentId]
    );

    const chatHistory = historyResult.rows.reverse().slice(0, -1);

    // Set up SSE response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Generate response and stream it
    try {
      const languageCode = language || 'en';
      const response = await chatWithDocument(doc.original_text, chatHistory, message, languageCode);

      // Stream the response in chunks
      const chunkSize = 20;
      for (let i = 0; i < response.length; i += chunkSize) {
        const chunk = response.slice(i, i + chunkSize);
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      // Save assistant message
      await pool.query(
        'INSERT INTO chat_messages (document_id, user_id, role, content) VALUES ($1, $2, $3, $4)',
        [documentId, user.id, 'assistant', response]
      );

      // Send done signal
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Chat generation error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

async function getChatHistory(req, res) {
  try {
    const { documentId } = req.params;
    const { user } = req;

    // Verify document exists and belongs to user
    const doc = await documentService.getDocument(user.id, documentId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get chat history
    const result = await pool.query(
      'SELECT role, content, created_at FROM chat_messages WHERE document_id = $1 ORDER BY created_at ASC',
      [documentId]
    );

    res.json({
      messages: result.rows.map((msg) => ({
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
      })),
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
}

module.exports = {
  sendMessage,
  getChatHistory,
};
