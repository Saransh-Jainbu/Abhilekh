const STEPS = [
  { key: 'uploaded', label: 'Uploaded', desc: 'Document received' },
  { key: 'extracting', label: 'Extracting Text', desc: 'Sarvam Document Intelligence (OCR)' },
  { key: 'translating', label: 'Translating', desc: 'Sarvam Translate — preparing your language' },
  { key: 'analyzing', label: 'Generating Insights', desc: 'Sarvam-105B' },
  { key: 'completed', label: 'Ready', desc: 'Digitization complete' },
];

// Map current stage to an index in STEPS
const STAGE_INDEX = {
  extracting: 1,
  translating: 2,
  analyzing: 3,
  completed: 4,
};

export default function ProgressStepper({ stage }) {
  const currentIndex = STAGE_INDEX[stage] ?? 1;

  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, textAlign: 'center', margin: '0 0 4px 0' }}>
        Digitizing your document
      </h3>
      <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', margin: '0 0 32px 0' }}>
        This usually takes under a minute. You can watch the progress below.
      </p>

      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <div key={step.key} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {/* Icon + connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: isDone ? '#1e7e34' : isActive ? '#000' : '#f0f0f0',
                  color: isDone || isActive ? '#fff' : '#bbb',
                  fontSize: '14px',
                  fontWeight: 600,
                }}>
                  {isDone ? '✓' : isActive ? <Spinner /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: '2px', height: '36px', background: isDone ? '#1e7e34' : '#f0f0f0' }} />
                )}
              </div>

              {/* Label */}
              <div style={{ paddingTop: '4px', opacity: isPending ? 0.5 : 1 }}>
                <div style={{ fontSize: '15px', fontWeight: isActive ? 600 : 500 }}>{step.label}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: '14px',
      height: '14px',
      border: '2px solid rgba(255,255,255,0.35)',
      borderTop: '2px solid #fff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  );
}
