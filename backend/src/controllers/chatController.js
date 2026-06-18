const pool = require('../config/database');
const documentService = require('../services/documentService');
const { chatWithDocument } = require('../services/sarvamService');

async function sendMessage(req, res) {
  try {
    const { documentId } = req.params;
    const { content } = req.body;
    const { user } = req;

    if (!content) {
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
    const userMsgResult = await pool.query(
      'INSERT INTO chat_messages (document_id, user_id, role, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [documentId, user.id, 'user', content]
    );

    // Get chat history
    const historyResult = await pool.query(
      'SELECT role, content FROM chat_messages WHERE document_id = $1 ORDER BY created_at DESC LIMIT 10',
      [documentId]
    );

    const chatHistory = historyResult.rows.reverse().slice(0, -1); // Exclude the message we just added

    // Generate response via Sarvam 105B
    setImmediate(async () => {
      try {
        const response = await chatWithDocument(doc.original_text, chatHistory, content);

        // Save assistant message
        await pool.query(
          'INSERT INTO chat_messages (document_id, user_id, role, content) VALUES ($1, $2, $3, $4)',
          [documentId, user.id, 'assistant', response]
        );
      } catch (error) {
        console.error('Chat error:', error);
      }
    });

    res.json({
      message: userMsgResult.rows[0],
      content: 'Generating response...',
    });
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
