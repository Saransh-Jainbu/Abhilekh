import { useState, useEffect } from 'react';
import { documents } from '../services/api';

const LANGUAGES = {
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
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTranslations();
  }, [documentId]);

  const fetchTranslations = async () => {
    try {
      const response = await documents.getTranslations(documentId);
      const transMap = {};
      response.data.translations?.forEach((t) => {
        transMap[t.language] = t.translated_text;
      });
      setTranslations(transMap);
    } catch (error) {
      console.error('Failed to fetch translations:', error);
    }
  };

  const handleTranslate = async () => {
    if (translations[selectedLanguage]) return;

    setLoading(true);
    try {
      await documents.translate(documentId, selectedLanguage);
      await fetchTranslations();
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: '16px' }}>Translate</h3>
      <div className="mt-2">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name} {translations[code] ? '✓' : ''}
            </option>
          ))}
        </select>
        <button
          onClick={handleTranslate}
          disabled={loading || !!translations[selectedLanguage]}
          style={{ width: '100%', marginTop: '8px' }}
        >
          {loading ? 'Translating...' : translations[selectedLanguage] ? 'Done' : 'Translate'}
        </button>

        {translations[selectedLanguage] && (
          <div className="mt-2" style={{ fontSize: '13px', maxHeight: '150px', overflowY: 'auto' }}>
            <p style={{ color: '#666', marginBottom: '8px' }}>
              {LANGUAGES[selectedLanguage]} version:
            </p>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '12px' }}>
              {translations[selectedLanguage]}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
