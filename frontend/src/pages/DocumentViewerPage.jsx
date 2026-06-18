import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documents } from '../services/api';
import InsightsPanel from '../components/InsightsPanel';
import ChatPanel from '../components/ChatPanel';
import TranslationPanel from '../components/TranslationPanel';

export default function DocumentViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [insights, setInsights] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('original');

  useEffect(() => {
    fetchDocument();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchDocument = async () => {
    try {
      const response = await documents.get(id);
      setDoc(response.data);
    } catch (error) {
      console.error('Failed to fetch document:', error);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await documents.getStatus(id);
      if (response.data.status === 'completed' && !insights) {
        fetchDocument();
        fetchInsights();
      }
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await documents.getInsights(id);
      setInsights(response.data.insights);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  const handleProcess = async () => {
    try {
      setProcessing(true);
      await documents.process(id);
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Processing failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!doc) {
    return (
      <div className="container text-center">
        <div className="spinner" style={{ margin: '20px auto' }}></div>
        <p>Loading document...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2>{doc.filename}</h2>
          <p className="text-muted">Status: {doc.status}</p>
        </div>
        <div>
          {doc.status === 'pending' && (
            <button onClick={handleProcess} disabled={processing}>
              {processing ? 'Processing...' : 'Process Document'}
            </button>
          )}
          <button onClick={() => navigate('/documents')} style={{ marginLeft: '10px' }}>
            Back
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', minHeight: '60vh' }}>
        {/* Main content */}
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button
              onClick={() => setActiveTab('original')}
              style={{
                background: activeTab === 'original' ? '#000' : '#f0f0f0',
                color: activeTab === 'original' ? '#fff' : '#000',
              }}
            >
              Original
            </button>
            <button
              onClick={() => setActiveTab('extracted')}
              style={{
                background: activeTab === 'extracted' ? '#000' : '#f0f0f0',
                color: activeTab === 'extracted' ? '#fff' : '#000',
              }}
            >
              Extracted Text
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                background: activeTab === 'chat' ? '#000' : '#f0f0f0',
                color: activeTab === 'chat' ? '#fff' : '#000',
              }}
            >
              Chat
            </button>
          </div>

          <div className="card p-3">
            {activeTab === 'original' && (
              <div>
                <p className="text-muted">Original document (PDF/Image)</p>
                <p style={{ color: '#999' }}>Document preview would appear here</p>
              </div>
            )}
            {activeTab === 'extracted' && (
              <div>
                <p className="text-muted mb-2">Extracted Text</p>
                {doc.original_text ? (
                  <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {doc.original_text}
                  </pre>
                ) : (
                  <p className="text-muted">No text extracted yet</p>
                )}
              </div>
            )}
            {activeTab === 'chat' && (
              <ChatPanel documentId={id} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <InsightsPanel insights={insights} />
          <TranslationPanel documentId={id} />
        </div>
      </div>
    </div>
  );
}
