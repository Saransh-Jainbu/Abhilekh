export default function DocumentCard({ document, onClick }) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <h3>{document.filename}</h3>
      <p className="text-muted mt-1">
        Status: <strong>{document.status}</strong>
      </p>
      {document.created_at && (
        <p className="text-muted mt-1">
          Uploaded: {new Date(document.created_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
