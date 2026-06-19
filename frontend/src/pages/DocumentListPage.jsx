import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { documents } from '../services/api';
import '../styles/app.css';

const STATUS_LABELS = {
  completed: 'Completed',
  processing: 'Processing',
  pending: 'Pending',
  failed: 'Failed',
};

function StatusBadge({ status }) {
  const cls = STATUS_LABELS[status] ? status : 'pending';
  return <span className={`badge ${cls}`}>{STATUS_LABELS[status] || 'Pending'}</span>;
}

function StatCard({ label, value, tone }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className={`value ${tone || ''}`}>{value}</div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function DocumentListPage() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
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

  const stats = useMemo(() => ({
    total: docs.length,
    completed: docs.filter((d) => d.status === 'completed').length,
    processing: docs.filter((d) => d.status === 'processing').length,
    pending: docs.filter((d) => d.status === 'pending').length,
  }), [docs]);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const matchesSearch = d.filename.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || d.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [docs, search, filter]);

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-head">
        <h1>Dashboard</h1>
        <p>{user.email ? `Welcome back, ${user.email}` : 'Your digitized government records'}</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-row">
        <StatCard label="Total Documents" value={stats.total} tone="accent" />
        <StatCard label="Completed" value={stats.completed} tone="ok" />
        <StatCard label="Processing" value={stats.processing} tone="warn" />
        <StatCard label="Pending" value={stats.pending} />
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <input
            type="text"
            className="search"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filter-group">
            {['all', 'completed', 'processing', 'pending'].map((f) => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-accent" onClick={() => navigate('/upload')}>
          + Upload Document
        </button>
      </div>

      {/* Document Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <div className="spinner-lg" />
            <p>Loading documents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <p>{docs.length === 0 ? 'No documents yet' : 'No documents match your search'}</p>
            {docs.length === 0 && (
              <button className="btn btn-accent" onClick={() => navigate('/upload')}>
                Upload your first document
              </button>
            )}
          </div>
        ) : (
          <table className="doc-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th className="right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} onClick={() => navigate(`/documents/${doc.id}`)}>
                  <td>
                    <span className="doc-name">
                      <span className="doc-icon">📄</span>
                      {doc.filename}
                    </span>
                  </td>
                  <td><StatusBadge status={doc.status} /></td>
                  <td className="doc-date">{formatDate(doc.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="doc-view">View →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
