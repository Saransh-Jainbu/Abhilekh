const path = require('path');
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

    // Create document record
    const doc = await documentService.createDocument(user.id, filename, filePath);

    res.json({
      id: doc.id,
      filename: doc.filename,
      status: doc.status,
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

    res.json({
      id: doc.id,
      filename: doc.filename,
      status: doc.status,
      original_text: doc.original_text,
      extracted_at: doc.extracted_at,
      processed_at: doc.processed_at,
      created_at: doc.created_at,
    });
  } catch (error) {
    console.error('Get error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
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

    // Trigger async processing
    setImmediate(async () => {
      try {
        await processDocument(id, user.id);
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

    // Trigger async translation
    setImmediate(async () => {
      try {
        const { translateText } = require('../services/sarvamService');
        const translated = await translateText(doc.original_text || '', language);
        await documentService.createTranslation(id, language, translated);
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

module.exports = {
  uploadDocument,
  listDocuments,
  getDocument,
  processDoc,
  getStatus,
  getInsights,
  translate,
  getTranslations,
  deleteDoc,
};
