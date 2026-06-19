import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documents } from '../services/api';
import ChatPanel from '../components/ChatPanel';
import TranslationPanel from '../components/TranslationPanel';
import ProgressStepper from '../components/ProgressStepper';
import PageReader from '../components/PageReader';
import '../styles/app.css';

export default function DocumentViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [insights, setInsights] = useState(null);
  const [stage, setStage] = useState(null);
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('reader');
  const pollRef = useRef(null);

  useEffect(() => {
    fetchDocument();
    fetchInsights();
    pollRef.current = setInterval(pollStatus, 2500);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await documents.get(id);
      setDoc(res.data);
      setStatus(res.data.status);
      setStage(res.data.stage);
    } catch (e) {
      console.error('Failed to fetch document:', e);
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await documents.getInsights(id);
      setInsights(res.data.insights);
    } catch (e) {
      console.error('Failed to fetch insights:', e);
    }
  };

  const pollStatus = async () => {
    try {
      const res = await documents.getStatus(id);
      setStatus(res.data.status);
      setStage(res.data.stage);
      if (res.data.status === 'completed' || res.data.status === 'failed') {
        clearInterval(pollRef.current);
        fetchDocument();
        fetchInsights();
      }
    } catch (e) {
      console.error('Status poll failed:', e);
    }
  };

  const handleRetry = async () => {
    try {
      await documents.process(id);
      setStatus('processing');
      setStage('extracting');
      pollRef.current = setInterval(pollStatus, 2500);
    } catch (e) {
      console.error('Retry failed:', e);
    }
  };

  if (!doc) {
    return (
      <div className="viewer">
        <div className="reader-empty">
          <div className="spinner-lg" />
          Loading document…
        </div>
      </div>
    );
  }

  const isProcessing = status === 'processing' || stage === 'extracting' || stage === 'analyzing';
  const isFailed = status === 'failed' || stage === 'failed';
  const isDone = status === 'completed';

  const tabs = [
    { id: 'reader', label: 'Side-by-side' },
    { id: 'extracted', label: 'Extracted Text' },
    { id: 'translate', label: 'Translation' },
    { id: 'chat', label: 'Chat' },
  ];

  return (
    <div className="viewer">
      {/* Header */}
      <div className="viewer-head">
        <button className="viewer-back" onClick={() => navigate('/documents')}>
          ← Back to dashboard
        </button>
        <h1 className="viewer-title">
          <span className="doc-icon">📄</span> {doc.filename}
        </h1>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="viewer-card pad">
          <ProgressStepper stage={stage} />
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="viewer-card pad center">
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--err)' }}>Processing failed</h3>
          <p style={{ color: 'var(--ink-soft)', marginBottom: '20px' }}>
            Something went wrong while digitizing this document.
          </p>
          <button className="btn btn-accent" onClick={handleRetry}>Retry</button>
        </div>
      )}

      {/* Completed state */}
      {isDone && (
        <div className="viewer-grid">
          {/* Main panel */}
          <div className="viewer-card">
            <div className="viewer-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`viewer-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="viewer-tab-body">
              {activeTab === 'reader' && (
                <PageReader
                  documentId={id}
                  fileType={doc.file_type}
                  originalPages={doc.original_pages}
                  originalText={doc.original_text}
                />
              )}
              {activeTab === 'extracted' && (
                <pre className="extracted-text">{doc.original_text || 'No text extracted.'}</pre>
              )}
              {activeTab === 'translate' && <TranslationPanel documentId={id} />}
              {activeTab === 'chat' && <ChatPanel documentId={id} />}
            </div>
          </div>

          {/* Sidebar */}
          <div className="viewer-side">
            <div className="viewer-card pad">
              <h3 className="side-title">💡 Insights</h3>
              <p className="side-insight">{insights || 'No insights generated.'}</p>
              <p className="side-meta">Generated by Sarvam-105B</p>
            </div>

            <div className="viewer-card pad">
              <h3 className="side-title">Document Info</h3>
              <InfoRow label="Status" value="Completed" />
              <InfoRow label="Pages" value={Array.isArray(doc.original_pages) ? doc.original_pages.length : '—'} />
              <InfoRow label="Characters" value={(doc.original_text || '').length.toLocaleString()} />
              <InfoRow label="Uploaded" value={new Date(doc.created_at).toLocaleDateString('en-IN')} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <span className="info-val">{value}</span>
    </div>
  );
}
