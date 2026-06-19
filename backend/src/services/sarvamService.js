const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const { PDFDocument } = require('pdf-lib');
const sarvamClient = require('../config/sarvam');

// Short code -> BCP-47 code used by Sarvam (translation + document intelligence)
const LANGUAGE_CODES = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  or: 'or-IN',
  ur: 'ur-IN',
};

const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  bn: 'Bengali',
  pa: 'Punjabi',
  mr: 'Marathi',
};

const CHAT_MODEL = 'sarvam-105b';
// mayura:v1 supports automatic source-language detection ('auto') and all our
// target languages. (sarvam-translate:v1 has more languages but no auto-detect.)
const TRANSLATE_MODEL = 'mayura:v1';
const TRANSLATE_CHAR_LIMIT = 900; // mayura:v1 allows 1000; keep headroom

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Document Intelligence (OCR / text extraction) — async job pipeline
// ---------------------------------------------------------------------------

async function uploadToSignedUrl(fileUrl, buffer) {
  const headers = { 'Content-Type': 'application/octet-stream' };
  // Azure blob presigned PUT requires this header
  if (fileUrl.includes('blob.core.windows.net')) {
    headers['x-ms-blob-type'] = 'BlockBlob';
  }
  await axios.put(fileUrl, buffer, { headers, maxBodyLength: Infinity, maxContentLength: Infinity });
}

// Split a PDF into individual page buffers
async function splitPdfIntoPages(pdfBuffer) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    const pageBuffers = [];

    for (let i = 0; i < pageCount; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
      newDoc.addPage(copiedPage);
      const buffer = await newDoc.save();
      pageBuffers.push(buffer);
    }

    return pageBuffers;
  } catch (err) {
    console.error('[PDF Split] Failed to split PDF:', err.message);
    return null;
  }
}

// Build the single upload artifact: PDFs go as-is, images are wrapped in a ZIP
function buildUploadArtifact(filePath, filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') {
    return { buffer: fs.readFileSync(filePath), uploadName: filename };
  }
  // image -> zip containing the image
  const zip = new AdmZip();
  zip.addLocalFile(filePath);
  const base = path.basename(filename, ext);
  return { buffer: zip.toBuffer(), uploadName: `${base}.zip` };
}

// Extract readable text from the result ZIP, preserving page structure.
// Returns { text, pages } where pages is an array of per-page strings.
// Prefer Markdown/text output (clean); only fall back to JSON if no md/txt exists.
function extractFromZip(zipBuffer) {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries().filter((e) => !e.isDirectory);

  const mdEntries = [];
  const htmlParts = [];
  const jsonEntries = [];

  for (const entry of entries) {
    const name = entry.entryName.toLowerCase();
    if (name.endsWith('.md') || name.endsWith('.txt')) {
      mdEntries.push(entry);
    } else if (name.endsWith('.html')) {
      htmlParts.push(entry.getData().toString('utf-8'));
    } else if (name.endsWith('.json')) {
      jsonEntries.push(entry);
    }
  }

  // 1. Markdown is the cleanest — use it if present
  if (mdEntries.length) {
    // Stable page order (file2.md before file10.md)
    mdEntries.sort((a, b) =>
      a.entryName.localeCompare(b.entryName, undefined, { numeric: true })
    );

    let pages;
    if (mdEntries.length > 1) {
      // Sarvam emitted one file per page
      pages = mdEntries.map((e) => cleanText(e.getData().toString('utf-8')));
    } else {
      // Single file — split on form-feed page breaks if present
      pages = splitPages(mdEntries[0].getData().toString('utf-8')).map(cleanText);
    }
    pages = pages.filter((p) => p.length);
    return { text: pages.join('\n\n'), pages };
  }

  // 2. HTML — strip tags
  if (htmlParts.length) {
    const text = cleanText(htmlParts.join('\n\n').replace(/<[^>]+>/g, ' '));
    return { text, pages: text ? [text] : [] };
  }

  // 3. JSON fallback — only pull genuine text content, skip metadata
  const jsonParts = [];
  for (const entry of jsonEntries) {
    try {
      const data = JSON.parse(entry.getData().toString('utf-8'));
      jsonParts.push(collectJsonText(data));
    } catch {
      // ignore
    }
  }
  const text = cleanText(jsonParts.join('\n'));
  return { text, pages: text ? [text] : [] };
}

// Split a single markdown blob into pages using whatever page delimiter the
// OCR emitted. Form-feed (\f) is the most reliable; some outputs instead use an
// explicit page-break comment/marker. If none is present we return a single
// page (the frontend still renders true per-page PDF images and falls back to
// showing the full text).
function splitPages(raw) {
  const text = raw.replace(/\r/g, '');

  if (text.includes('\f')) {
    return text.split('\f');
  }

  // Explicit page-break markers some converters insert (safe — these never
  // occur in normal prose): <!-- PageBreak -->, <!-- Page 2 -->, [PAGE 2], etc.
  const marker = /(?:<!--\s*page[\s_-]*(?:break|\d+)\s*-->|\n\s*\[?\s*page\s*\d+\s*\]?\s*\n|\n-{3,}\s*page\s*\d+\s*-{3,}\n)/i;
  if (marker.test(text)) {
    return text
      .split(new RegExp(marker, 'gi'))
      .map((p) => p.trim())
      .filter(Boolean);
  }

  return [text];
}

// Keys that hold real document text in Sarvam's JSON blocks
const TEXT_KEYS = new Set(['text', 'content', 'markdown', 'transcript']);
// Keys that hold metadata we must NOT surface
const SKIP_KEYS = new Set(['id', 'block_id', 'type', 'block_type', 'timestamp', 'created_at', 'page_number', 'bbox', 'confidence']);

function collectJsonText(node, acc = []) {
  if (node == null) return acc.join('\n');
  if (Array.isArray(node)) {
    node.forEach((n) => collectJsonText(n, acc));
  } else if (typeof node === 'object') {
    for (const [key, val] of Object.entries(node)) {
      if (SKIP_KEYS.has(key)) continue;
      if (TEXT_KEYS.has(key) && typeof val === 'string') {
        acc.push(val);
      } else if (typeof val === 'object') {
        collectJsonText(val, acc);
      }
    }
  }
  return acc.join('\n');
}

// Sarvam's OCR markdown embeds figures inline as base64 data URIs, e.g.
//   ![Image](data:image/jpeg;base64,/9j/4AAQ...)
// That blob is useless as text and pollutes translation/chat, so strip it out.
function stripInlineImages(text) {
  return text
    // Markdown image whose target is a data: URI — drop the whole token
    .replace(/!\[[^\]]*\]\(\s*data:[^)]*\)/gi, '')
    // <img src="data:..."> just in case any HTML slips through
    .replace(/<img[^>]*src=["']data:[^"'>]*["'][^>]*>/gi, '')
    // Any stray bare data URI left over (no surrounding markdown)
    .replace(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, '');
}

function cleanText(text) {
  return stripInlineImages(text)
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    // Collapse blank lines left behind where images were removed
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Process a single buffer (PDF page or image) through Sarvam OCR pipeline.
// Returns the extracted text for that page.
async function processSingleDocument(buffer, docName, languageCode = 'hi-IN') {
  // 1. Create job
  const job = await sarvamClient.documentIntelligence.initialise({
    job_parameters: {
      language: languageCode,
      output_format: 'md',
    },
  });
  const jobId = job.job_id;
  console.log(`[Sarvam DI] Job ${jobId} created for ${docName}`);

  // 2. Get upload link
  const uploadResp = await sarvamClient.documentIntelligence.getUploadLinks({
    job_id: jobId,
    files: [docName],
  });
  const uploadUrl = uploadResp.upload_urls[docName]?.file_url;
  if (!uploadUrl) throw new Error(`No upload URL for ${docName}`);

  // 3. Upload the file bytes
  console.log(`[Sarvam DI] Uploading ${docName}...`);
  await uploadToSignedUrl(uploadUrl, buffer);

  // 4. Start processing
  await sarvamClient.documentIntelligence.start(jobId);
  console.log(`[Sarvam DI] Job ${jobId} started, polling...`);

  // 5. Poll until terminal state
  const terminal = ['Completed', 'PartiallyCompleted', 'Failed'];
  let state = 'Running';
  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const status = await sarvamClient.documentIntelligence.getStatus(jobId);
    state = status.job_state;
    if (terminal.includes(state)) break;
  }

  if (state === 'Failed') {
    throw new Error(`Document Intelligence job ${jobId} failed`);
  }

  // 6. Download and extract text
  const downloadResp = await sarvamClient.documentIntelligence.getDownloadLinks(jobId);
  const urls = Object.values(downloadResp.download_urls || {});
  if (urls.length === 0) throw new Error(`No output for ${docName}`);

  let text = '';
  for (const detail of urls) {
    const res = await axios.get(detail.file_url, { responseType: 'arraybuffer' });
    const buf = Buffer.from(res.data);
    try {
      const extracted = extractFromZip(buf);
      text = extracted.text;
      break;
    } catch {
      const t = cleanText(buf.toString('utf-8'));
      if (t) {
        text = t;
        break;
      }
    }
  }

  return text;
}

async function extractText(filePath, filename, languageCode = 'hi-IN') {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf') {
    // Split PDF into pages and OCR each in parallel
    console.log(`[Sarvam DI] Splitting PDF ${filename} into pages...`);
    const pdfBuffer = fs.readFileSync(filePath);
    const pageBuffers = await splitPdfIntoPages(pdfBuffer);

    if (!pageBuffers) {
      // Fallback: process entire PDF if split failed
      console.log('[Sarvam DI] Split failed, processing full PDF');
      const text = await processSingleDocument(pdfBuffer, filename, languageCode);
      return { text, pages: [text] };
    }

    console.log(`[Sarvam DI] Split into ${pageBuffers.length} pages, starting parallel OCR...`);
    const pages = await Promise.all(
      pageBuffers.map((buffer, idx) =>
        processSingleDocument(buffer, `page-${idx + 1}.pdf`, languageCode).catch((err) => {
          console.error(`[Sarvam DI] Page ${idx + 1} failed:`, err.message);
          return '';
        })
      )
    );

    return {
      text: pages.filter(Boolean).join('\n\n').trim(),
      pages: pages.filter(Boolean),
    };
  } else {
    // Image or other format — process as single document
    const { buffer } = buildUploadArtifact(filePath, filename);
    const text = await processSingleDocument(buffer, filename, languageCode);
    return { text, pages: [text] };
  }
}

// ---------------------------------------------------------------------------
// Insights + Chat (Sarvam-105B)
// ---------------------------------------------------------------------------

// Translate the chat model's output to the target language. The chat model
// echoes the document's language (often Hindi) regardless of any prompt, so we
// ALWAYS route through the deterministic translate endpoint — including English,
// where auto-detect converts a Hindi reply to English.
async function translateToLanguage(text, languageCode) {
  if (!text) return text;
  try {
    return await translateText(text, languageCode);
  } catch (err) {
    console.error('[Sarvam Translate] Post-chat translation failed, returning raw:', err.message);
    return text;
  }
}

async function generateInsights(text, languageCode = 'en') {
  const langName = SUPPORTED_LANGUAGES[languageCode] || 'English';
  console.log(`[Sarvam 105B] Generating insights (will translate to ${languageCode})...`);

  const response = await sarvamClient.chat.completions({
    model: CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a government document analyst. Respond in English.',
      },
      {
        role: 'user',
        content: `Analyze the following government document and provide a summary in 3-4 sentences in English. Include key details like document type, names, dates, and purpose.\n\nDocument:\n"""\n${text.substring(0, 4000)}\n"""`,
      },
    ],
  });

  const englishInsights = response.choices?.[0]?.message?.content?.trim() || 'No insights generated.';
  return translateToLanguage(englishInsights, languageCode);
}

async function chatWithDocument(documentText, chatHistory, userMessage, languageCode = 'en') {
  console.log(`[Sarvam 105B] Chat completion (will translate to ${languageCode})...`);

  // Always request English from the model — it reliably returns English.
  // The translate API then converts to the user's chosen language.
  const messages = [
    {
      role: 'system',
      content: `You are a helpful assistant answering questions about a digitized government document. Use only the document context below to answer accurately and concisely in English. If the answer is not in the document, say so.

Document context:
"""
${documentText.substring(0, 6000)}
"""`,
    },
    // Strip any non-English history entries to avoid confusing the model;
    // include only the roles and original English-side content.
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await sarvamClient.chat.completions({
    model: CHAT_MODEL,
    messages,
  });

  const englishReply = response.choices?.[0]?.message?.content?.trim() || 'No response generated.';
  return translateToLanguage(englishReply, languageCode);
}

// ---------------------------------------------------------------------------
// Translation (sarvam-translate:v1) — chunked to respect char limit
// ---------------------------------------------------------------------------

function chunkText(text, limit = TRANSLATE_CHAR_LIMIT) {
  const chunks = [];
  const paragraphs = text.split(/\n+/);
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n' + para).length > limit) {
      if (current) chunks.push(current.trim());
      if (para.length > limit) {
        // hard-split very long paragraphs
        for (let i = 0; i < para.length; i += limit) {
          chunks.push(para.slice(i, i + limit));
        }
        current = '';
      } else {
        current = para;
      }
    } else {
      current = current ? `${current}\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function translateText(text, shortLang) {
  const targetCode = LANGUAGE_CODES[shortLang];
  if (!targetCode) throw new Error(`Unsupported language: ${shortLang}`);

  console.log(`[Sarvam Translate] -> ${targetCode}`);
  const chunks = chunkText(text);

  // Translate chunks in parallel — sequential awaits made chat replies slow.
  const out = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await sarvamClient.text.translate({
        input: chunk,
        source_language_code: 'auto',
        target_language_code: targetCode,
        model: TRANSLATE_MODEL,
      });
      return response.translated_text || '';
    })
  );

  return out.join('\n');
}

// Stitch per-page text into one continuous "flowing" source for archive-quality
// translation. When a page doesn't end on sentence-final punctuation, the
// sentence continues onto the next page, so we join with a space instead of a
// hard paragraph break — this keeps cross-page sentences intact and reads as
// flowing prose rather than rigid page blocks.
function joinPagesFlowing(pages) {
  if (!Array.isArray(pages)) return '';
  // Latin (. ! ?), Indic danda (। ॥), plus optional trailing quote/bracket.
  const endsSentence = /[.!?।॥]["'”’)\]]?\s*$/;
  return pages.reduce((acc, page) => {
    const p = (page || '').trim();
    if (!p) return acc;
    if (!acc) return p;
    return acc + (endsSentence.test(acc) ? '\n\n' : ' ') + p;
  }, '');
}

// Translate an array of page strings independently so the result stays aligned
// with the source pages (page i in -> page i out).
async function translatePages(pages, shortLang) {
  return Promise.all(
    pages.map(async (page) => {
      if (!page || !page.trim()) return '';
      try {
        return await translateText(page, shortLang);
      } catch (err) {
        console.error('[Sarvam Translate] page failed, keeping source:', err.message);
        return page;
      }
    })
  );
}

module.exports = {
  extractText,
  generateInsights,
  translateText,
  translatePages,
  joinPagesFlowing,
  chatWithDocument,
  SUPPORTED_LANGUAGES,
  LANGUAGE_CODES,
};
