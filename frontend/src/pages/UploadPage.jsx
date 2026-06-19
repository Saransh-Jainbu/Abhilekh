import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documents } from '../services/api';
import FileUploadZone from '../components/FileUploadZone';

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

export default function UploadPage() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleFileUpload = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', selectedLanguage);

      const response = await documents.upload(formData);
      navigate(`/documents/${response.data.id}`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <h2>Upload Document</h2>
      <p className="text-muted mb-3">
        Upload a PDF or image of a government document. Digitization (OCR + insights) starts automatically.
      </p>

      {/* Language selector */}
      <div style={{ marginBottom: '20px', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
          Language for Insights & Chat
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            width: '100%',
            maxWidth: '300px',
          }}
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
          Insights will be generated and chat will respond in your selected language.
        </p>
      </div>

      <FileUploadZone onFileUpload={handleFileUpload} disabled={uploading} />
      {uploading && (
        <div className="mt-3 text-center">
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p className="mt-2">Uploading...</p>
        </div>
      )}
    </div>
  );
}
