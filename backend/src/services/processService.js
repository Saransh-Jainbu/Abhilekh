const documentService = require('./documentService');
const { extractText, generateInsights, translatePages, translateText, joinPagesFlowing } = require('./sarvamService');

async function processDocument(documentId, userId, languageCode = 'en') {
  try {
    const doc = await documentService.getDocument(userId, documentId);
    if (!doc) throw new Error('Document not found');

    await documentService.updateDocumentStatus(documentId, 'processing');

    // Stage 1: Extract text via Sarvam Document Intelligence (page-aware)
    await documentService.updateDocumentStage(documentId, 'extracting');
    console.log(`[${documentId}] Extracting text...`);
    const { text: extractedText, pages: extractedPages } = await extractText(doc.file_path, doc.filename);
    await documentService.updateDocumentText(documentId, extractedText, extractedPages);

    // Stage 2: Translate to chosen language. We produce TWO views from the same
    // source: (a) per-page, so the side-by-side reader can align each page with
    // its image; (b) a flowing, archive-quality translation of the whole document
    // where cross-page sentences stay intact instead of being chopped at page
    // boundaries. (OCR output may be in any language.)
    await documentService.updateDocumentStage(documentId, 'translating');
    let insightSourceText = extractedText;
    console.log(`[${documentId}] Translating ${extractedPages.length} page(s) to ${languageCode}...`);
    try {
      const translatedPages = await translatePages(extractedPages, languageCode);
      // Flowing source: stitch pages so a sentence broken across a page break is
      // translated as one continuous unit, reading as prose rather than blocks.
      const flowingSource = joinPagesFlowing(extractedPages) || extractedText;
      const translatedText = await translateText(flowingSource, languageCode);
      await documentService.createTranslation(documentId, languageCode, translatedText, translatedPages);
      insightSourceText = translatedText;
    } catch (err) {
      console.warn(`[${documentId}] Translation failed, using raw text for insights:`, err.message);
    }

    // Stage 3: Generate insights from (translated) text
    await documentService.updateDocumentStage(documentId, 'analyzing');
    console.log(`[${documentId}] Generating insights from ${languageCode} text...`);
    const insights = await generateInsights(insightSourceText, languageCode);
    await documentService.createInsight(documentId, insights);

    await documentService.updateDocumentStage(documentId, 'completed');
    await documentService.updateDocumentStatus(documentId, 'completed');
    console.log(`[${documentId}] Processing completed successfully`);

  } catch (error) {
    console.error(`[${documentId}] Processing error:`, error);
    await documentService.updateDocumentStage(documentId, 'failed');
    await documentService.updateDocumentStatus(documentId, 'failed');
    throw error;
  }
}

module.exports = {
  processDocument,
};
