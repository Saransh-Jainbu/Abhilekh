import { useState, useEffect, useRef } from 'react';
import { documents } from '../services/api';

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

export default function TranslationPanel({ documentId }) {
  const [translations, setTranslations] = useState({});
  const [selected, setSelected] = useState('en');
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchTranslations();
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const fetchTranslations = async () => {
    try {
      const res = await documents.getTranslations(documentId);
      const map = {};
      res.data.translations?.forEach((t) => { map[t.language] = t.translated_text; });
      setTranslations(map);
      return map;
    } catch (e) {
      console.error('Failed to fetch translations:', e);
      return {};
    }
  };

  const handleTranslate = async () => {
    if (translations[selected]) return;
    setLoading(true);
    try {
      await documents.translate(documentId, selected);
      // Poll until the translation lands (backend processes async)
      let tries = 0;
      pollRef.current = setInterval(async () => {
        tries += 1;
        const map = await fetchTranslations();
        if (map[selected] || tries > 30) {
          clearInterval(pollRef.current);
          setLoading(false);
        }
      }, 2000);
    } catch (e) {
      console.error('Translation failed:', e);
      setLoading(false);
    }
  };

  const result = translations[selected];

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', color: '#888' }}>Translate to</span>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name} {translations[code] ? '✓' : ''}
            </option>
          ))}
        </select>
        <button
          onClick={handleTranslate}
          disabled={loading || !!result}
          style={{
            padding: '8px 18px',
            background: result ? '#f0f0f0' : '#000',
            color: result ? '#888' : '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: loading || result ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Translating…' : result ? 'Translated ✓' : 'Translate'}
        </button>
      </div>

      {/* Result */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ fontSize: '14px' }}>Translating to {LANGUAGES[selected]} via Sarvam Translate…</p>
        </div>
      )}

      {!loading && result && (
        <div style={{ background: '#fafafa', borderRadius: '10px', padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {LANGUAGES[selected]} Translation
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '14px', lineHeight: 1.8, fontFamily: 'inherit', margin: 0, maxHeight: '55vh', overflowY: 'auto' }}>
            {result}
          </pre>
        </div>
      )}

      {!loading && !result && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '14px' }}>
          Select a language and click Translate to see the document in {LANGUAGES[selected]}.
        </div>
      )}
    </div>
  );
}
