const fs = require('fs');
const documentService = require('./documentService');
const { extractText, generateInsights, translateText, SUPPORTED_LANGUAGES } = require('./sarvamService');

async function processDocument(documentId, userId) {
  try {
    // Get document
    const doc = await documentService.getDocument(userId, documentId);
    if (!doc) {
      throw new Error('Document not found');
    }

    // Update status to processing
    await documentService.updateDocumentStatus(documentId, 'processing');

    // Read file
    const fileContent = fs.readFileSync(doc.file_path, 'base64');
    const mimeType = doc.filename.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

    // Step 1: Extract text via Sarvam Vision
    console.log(`[${documentId}] Extracting text via Sarvam Vision...`);
    const extractedText = await extractText(fileContent, mimeType);
    await documentService.updateDocumentText(documentId, extractedText);

    // Step 2: Generate insights via Sarvam 105B
    console.log(`[${documentId}] Generating insights via Sarvam 105B...`);
    const insights = await generateInsights(extractedText);
    await documentService.createInsight(documentId, insights);

    // Step 3: Translate to all supported languages
    console.log(`[${documentId}] Starting translations...`);
    const translations = Object.keys(SUPPORTED_LANGUAGES);

    for (const language of translations) {
      try {
        console.log(`[${documentId}] Translating to ${language}...`);
        const translated = await translateText(extractedText, language);
        await documentService.createTranslation(documentId, language, translated);
      } catch (error) {
        console.error(`[${documentId}] Translation to ${language} failed:`, error.message);
        // Continue with other languages
      }
    }

    // Update status to completed
    await documentService.updateDocumentStatus(documentId, 'completed');
    console.log(`[${documentId}] Processing completed successfully`);

  } catch (error) {
    console.error(`[${documentId}] Processing error:`, error);
    await documentService.updateDocumentStatus(documentId, 'failed');
    throw error;
  }
}

module.exports = {
  processDocument,
};
