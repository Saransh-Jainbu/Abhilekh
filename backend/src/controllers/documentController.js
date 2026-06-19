const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const documentService = require('../services/documentService');
const { processDocument } = require('../services/processService');

async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { user } = req;
    const filename = req.file.originalname;
    const filePath = req.file.path;
    const languageCode = req.body.language || 'en';

    console.log(`[Upload] Language received: ${languageCode}, req.body:`, req.body);

    // Create document record with language preference
    const doc = await documentService.createDocument(user.id, filename, filePath, languageCode);

    // Auto-start processing (OCR -> insights) in the background
    await documentService.updateDocumentStatus(doc.id, 'processing');
    await documentService.updateDocumentStage(doc.id, 'extracting');
    setImmediate(async () => {
      try {
        await processDocument(doc.id, user.id, languageCode);
      } catch (error) {
        console.error('Auto-processing error:', error);
      }
    });

    res.json({
      id: doc.id,
      filename: doc.filename,
      status: 'processing',
      created_at: doc.created_at,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}

async function listDocuments(req, res) {
  try {
    const { user } = req;
    const documents = await documentService.getDocuments(user.id);

    res.json({
      documents: documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        status: doc.status,
        extracted_at: doc.extracted_at,
        processed_at: doc.processed_at,
        created_at: doc.created_at,
      })),
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
}

async function getDocument(req, res) {
  try {
    const { id } = req.params;
    const { user } = req;

    const doc = await documentService.getDocument(user.id, id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const ext = path.extname(doc.filename).toLowerCase();
    res.json({
      id: doc.id,
      filename: doc.filename,
      status: doc.status,
      original_text: doc.original_text,
      original_pages: doc.original_pages || null,
      file_type: ext === '.pdf' ? 'pdf' : 'image',
      extracted_at: doc.extracted_at,
      processed_at: doc.processed_at,
      created_at: doc.created_at,
    });
  } catch (error) {
    console.error('Get error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
}

// Stream the original uploaded file (PDF or image) so the viewer can render it.
async function getFile(req, res) {
  try {
    const { id } = req.params;
    const { user } = req;

    const doc = await documentService.getDocument(user.id, id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    if (!doc.file_path || !fs.existsSync(doc.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    const ext = path.extname(doc.filename).toLowerCase();
    const mime = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
    }[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.filename)}"`);
    fs.createReadStream(doc.file_path).pipe(res);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
}

async function processDoc(req, res) {
  try {
    const { id } = req.params;
    const { user } = req;

    const doc = await documentService.getDocument(user.id, id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Trigger async processing with saved language preference
    setImmediate(async () => {
      try {
        await processDocument(id, user.id, doc.language_code || 'en');
      } catch (error) {
        console.error('Async processing error:', error);
      }
    });

    res.json({ message: 'Processing started', id: doc.id });
  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: 'Failed to start processing' });
  }
}

async function getStatus(req, res) {
  try {
    const { id } = req.params;
    const { user } = req;

    const doc = await documentService.getDocument(user.id, id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      status: doc.status,
      stage: doc.stage,
      id: doc.id,
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
}

async function getInsights(req, res) {
  try {
    const { id } = req.params;
    const { user } = req;

    const doc = await documentService.getDocument(user.id, id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const insight = await documentService.getInsight(id);

    res.json({
      insights: insight?.insights_text || null,
      generated_at: insight?.generated_at,
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to get insights' });
  }
}

async function translate(req, res) {
  try {
    const { id } = req.params;
    const { language } = req.body;
    const { user } = req;

    const doc = await documentService.getDocument(user.id, id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Trigger async translation. We store a flowing, archive-quality translation
    // as translated_text, plus per-page translations (when page structure exists)
    // so the side-by-side viewer can stay aligned with each page image.
    setImmediate(async () => {
      try {
        const { translatePages, translateText, joinPagesFlowing } = require('../services/sarvamService');
        const pages = Array.isArray(doc.original_pages) ? doc.original_pages : null;
        if (pages && pages.length) {
          const translatedPages = await translatePages(pages, language);
          // Flowing source keeps cross-page sentences intact for the archive view.
          const flowingSource = joinPagesFlowing(pages) || doc.original_text || '';
          const flowing = await translateText(flowingSource, language);
          await documentService.createTranslation(id, language, flowing, translatedPages);
        } else {
          const translated = await translateText(doc.original_text || '', language);
          await documentService.createTranslation(id, language, translated);
        }
      } catch (error) {
        console.error('Translation error:', error);
      }
    });

    res.json({ message: 'Translation started', language });
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({ error: 'Failed to translate' });
  }
}

async function getTranslations(req, res) {
  try {
    const { id } = req.params;
    const { user } = req;

    const doc = await documentService.getDocument(user.id, id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const translations = await documentService.getTranslations(id);

    res.json({
      translations: translations.map((t) => ({
        language: t.language,
        translated_text: t.translated_text,
        translated_pages: t.translated_pages || null,
        created_at: t.created_at,
      })),
    });
  } catch (error) {
    console.error('Get translations error:', error);
    res.status(500).json({ error: 'Failed to get translations' });
  }
}

async function deleteDoc(req, res) {
  try {
    const { id } = req.params;
    const { user } = req;

    const deleted = await documentService.deleteDocument(user.id, id);

    if (!deleted) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}

async function getChatHistory(req, res) {
  try {
    const { id } = req.params;
    const { user } = req;

    const doc = await documentService.getDocument(user.id, id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const messages = await documentService.getChatMessages(id);
    res.json({ messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
}

async function chat(req, res) {
  try {
    const { id } = req.params;
    const { user } = req;
    const { message, language = 'en' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const doc = await documentService.getDocument(user.id, id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get chat history
    const chatHistory = await documentService.getChatMessages(id);

    // Stream response via SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { chatWithDocument } = require('../services/sarvamService');
    try {
      const response = await chatWithDocument(doc.original_text || '', chatHistory, message, language);

      // Stream in chunks
      const chunkSize = 50;
      for (let i = 0; i < response.length; i += chunkSize) {
        const chunk = response.substring(i, i + chunkSize);
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      // Save message to history
      await documentService.saveChatMessage(id, user.id, 'user', message);
      await documentService.saveChatMessage(id, user.id, 'assistant', response);

      res.write('data: {"done": true}\n\n');
      res.end();
    } catch (error) {
      console.error('Chat error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
}

module.exports = {
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
};
