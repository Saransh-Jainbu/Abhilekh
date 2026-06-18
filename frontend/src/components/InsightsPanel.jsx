export default function InsightsPanel({ insights }) {
  return (
    <div className="card mb-3">
      <h3 style={{ fontSize: '16px' }}>Document Insights</h3>
      {insights ? (
        <div className="mt-2">
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
            {insights}
          </p>
        </div>
      ) : (
        <p className="text-muted mt-2" style={{ fontSize: '14px' }}>
          Process the document to generate insights
        </p>
      )}
    </div>
  );
}
