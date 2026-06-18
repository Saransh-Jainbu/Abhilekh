import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documents } from '../services/api';
import DocumentCard from '../components/DocumentCard';

export default function DocumentListPage() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documents.list();
      setDocs(response.data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container text-center">
        <div className="spinner" style={{ margin: '20px auto' }}></div>
        <p>Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Your Documents</h2>
        <button onClick={() => navigate('/upload')}>Upload New</button>
      </div>

      {docs.length === 0 ? (
        <div className="text-center p-3">
          <p className="text-muted mb-2">No documents yet</p>
          <button onClick={() => navigate('/upload')}>Upload your first document</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onClick={() => navigate(`/documents/${doc.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
