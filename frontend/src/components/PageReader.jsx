import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { documents } from '../services/api';
import '../styles/app.css';

// Version-matched worker, bundled by Vite (no CDN / network needed).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const LANGUAGES = {
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

export default function PageReader({ documentId, fileType, originalPages, originalText }) {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileError, setFileError] = useState(false);
  const [numPages, setNumPages] = useState(
    Array.isArray(originalPages) && originalPages.length ? originalPages.length : 1
  );
  const [page, setPage] = useState(1); // 1-indexed current page
  const [lang, setLang] = useState('original');
  const [translations, setTranslations] = useState({}); // { code: [pageStrings] }
  const [translating, setTranslating] = useState(false);
  const [colWidth, setColWidth] = useState(440);

  const leftColRef = useRef(null);
  const pollRef = useRef(null);

  // Load the original file as an object URL (auth header needs a fetch, not a raw src)
  useEffect(() => {
    let revoked;
    documents
      .getFileObjectUrl(documentId)
      .then((url) => {
        revoked = url;
        setFileUrl(url);
      })
      .catch((e) => {
        console.error('Failed to load file:', e);
        setFileError(true);
      });
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
      clearInterval(pollRef.current);
    };
  }, [documentId]);

  // Load any translations that already exist
  useEffect(() => {
    fetchTranslations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const fetchTranslations = useCallback(async () => {
    try {
      const res = await documents.getTranslations(documentId);
      const map = {};
      res.data.translations?.forEach((t) => {
        if (Array.isArray(t.translated_pages)) map[t.language] = t.translated_pages;
        else if (t.translated_text) map[t.language] = [t.translated_text];
      });
      setTranslations(map);
      return map;
    } catch (e) {
      console.error('Failed to fetch translations:', e);
      return {};
    }
  }, [documentId]);

  // Measure the left column so the PDF page renders at the right size
  useEffect(() => {
    const measure = () => {
      if (leftColRef.current) {
        setColWidth(Math.max(240, leftColRef.current.clientWidth - 32));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [fileUrl]);

  // Keep current page in range if the PDF reports a different count
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), numPages));
  }, [numPages]);

  const handleLangChange = async (e) => {
    const code = e.target.value;
    setLang(code);
    if (code === 'original' || translations[code]) return;

    // Kick off translation and poll until it lands
    setTranslating(true);
    try {
      await documents.translate(documentId, code);
      let tries = 0;
      pollRef.current = setInterval(async () => {
        tries += 1;
        const map = await fetchTranslations();
        if (map[code] || tries > 30) {
          clearInterval(pollRef.current);
          setTranslating(false);
        }
      }, 2000);
    } catch (err) {
      console.error('Translation failed:', err);
      setTranslating(false);
    }
  };

  // Per-page text source for the selected language
  const pagesForLang = lang === 'original' ? originalPages : translations[lang];
  // We have genuine per-page text only when the array covers every PDF page.
  const hasPerPage = Array.isArray(pagesForLang) && pagesForLang.length >= numPages && numPages > 1;

  const currentText = hasPerPage ? pagesForLang[page - 1] || '' : null;
  const textTag = lang === 'original' ? 'Extracted text' : `${LANGUAGES[lang]} translation`;

  const go = (delta) => setPage((p) => Math.min(Math.max(1, p + delta), numPages));

  return (
    <div className="reader">
      {/* Controls */}
      <div className="reader-bar">
        <div className="reader-bar-label">
          <span className="reader-pages">{numPages} page{numPages !== 1 ? 's' : ''}</span>
          <span className="reader-sub">Original on the left · text on the right</span>
        </div>
        <div className="reader-lang">
          <span>Show text as</span>
          <select className="chat-select" value={lang} onChange={handleLangChange} disabled={translating}>
            <option value="original">Original (extracted)</option>
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <option key={code} value={code}>
                {name} {translations[code] ? '✓' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {translating && (
        <div className="reader-translating">
          <span className="typing"><span /><span /><span /></span>
          Translating to {LANGUAGES[lang]} via Sarvam…
        </div>
      )}

      {/* Side-by-side: one page at a time */}
      {fileError ? (
        <div className="reader-empty">Couldn’t load the original file.</div>
      ) : !fileUrl ? (
        <div className="reader-empty">
          <div className="spinner-lg" />
          Loading document…
        </div>
      ) : fileType === "pdf" ? (
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={<div className="reader-empty"><div className="spinner-lg" />Rendering PDF…</div>}
          error={<div className="reader-empty">Couldn’t render this PDF.</div>}
        >
          <div className="reader-row single">
            <div className="reader-left" ref={leftColRef}>
              <div className="page-tag">Page {page}</div>
              <div className="page-canvas">
                <Page
                  pageNumber={page}
                  width={colWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </div>
            </div>
            <div className="reader-right">
              {hasPerPage ? (
                <>
                  <div className="page-tag">{textTag} · page {page}</div>
                  <p className="page-text">
                    {currentText || <span className="muted">— no text —</span>}
                  </p>
                </>
              ) : (
                <div className="reader-no-split">
                  <div className="reader-no-split-icon">📄</div>
                  <p className="reader-no-split-title">Text not segmented per page</p>
                  <p className="reader-no-split-body">
                    The OCR returned a single text block for this PDF. Switch to the {" "}
                    <strong>Extracted Text</strong> tab above to read the full content.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Document>
      ) : (
        // Single image document
        <div className="reader-row single">
          <div className="reader-left" ref={leftColRef}>
            <div className="page-tag">Original</div>
            <div className="page-canvas">
              <img src={fileUrl} alt="Document" className="page-img" />
            </div>
          </div>
          <div className="reader-right">
            <div className="page-tag">{textTag}</div>
            <p className="page-text">{currentText || <span className="muted">— no text —</span>}</p>
          </div>
        </div>
      )}

      {/* Pager */}
      {numPages > 1 && (
        <div className="reader-nav">
          <button className="pager-btn" onClick={() => go(-1)} disabled={page <= 1}>
            ← Prev
          </button>
          <span className="pager-status">
            Page <strong>{page}</strong> of {numPages}
          </span>
          <button className="pager-btn" onClick={() => go(1)} disabled={page >= numPages}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
