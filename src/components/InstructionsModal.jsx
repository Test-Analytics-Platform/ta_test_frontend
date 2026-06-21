import { useState } from 'react'

const MARKING_SCHEME = {
  JEE_MAINS: [
    { type: 'MCQ (Single Correct)', count: 75, correct: '+4', wrong: '−1', note: 'Multiple choice, one answer' },
    { type: 'Numerical Value', count: 25, correct: '+4', wrong: '0', note: 'Enter integer answer' },
  ],
  JEE_ADV: [
    { type: 'Single Correct', correct: '+3', wrong: '−1', note: 'Varies by section' },
    { type: 'Multi-Correct', correct: '+4 (partial)', wrong: '−2', note: 'One or more options correct' },
    { type: 'Integer Type', correct: '+3', wrong: '0', note: 'Non-negative integer' },
  ],
  NEET: [
    { type: 'MCQ (Single Correct)', count: 200, correct: '+4', wrong: '−1', note: 'Biology · Physics · Chemistry' },
  ],
}

const INSTRUCTIONS = [
  'Read every question carefully before selecting your answer.',
  'Use the question palette to jump to any question.',
  '"Save & Next" records your answer. "Mark for Review" flags the question for later.',
  '"Clear Response" removes your selected answer for the current question.',
  'You can revisit and change any answer before submitting.',
  'Unattempted questions are awarded 0 marks.',
  'The timer starts the moment you click Begin Test and cannot be paused.',
  'Do NOT close, refresh, or navigate away during the test — your session will remain active.',
  'Click "Submit Test" when you are done. Submission is final.',
]

// `title` is caller-supplied so real papers can show "JEE Mains 2024 · Jan · S1"
// while generated practice tests can show something like "Full Mock #3" instead
// of their synthetic year/session/shift sentinel values.
export default function InstructionsModal({ paper, title, onClose, onBegin, isMobile }) {
  const [agreed, setAgreed] = useState(false)
  const [starting, setStarting] = useState(false)

  async function handleBegin() {
    if (!agreed) return
    setStarting(true)
    await onBegin()
    setStarting(false)
  }

  // Marking-scheme breakdown only makes sense for a real, complete official paper —
  // a subject/topic practice test or generated mock doesn't follow the exact same
  // per-question-type counts, so we skip it and rely on the generic stats row below.
  const scheme = paper.paper_kind === 'official_pyq' || !paper.paper_kind
    ? MARKING_SCHEME[paper.exam] || []
    : []

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? 0 : 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          border: isMobile ? 'none' : '2px solid #111',
          borderTop: '2px solid #111',
          width: '100%',
          maxWidth: isMobile ? '100%' : 640,
          maxHeight: isMobile ? '92vh' : '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: isMobile ? '12px 12px 0 0' : 0,
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1.5px solid #111',
            background: '#111',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aaa', marginBottom: 2 }}>
              General Instructions
            </div>
            <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600 }}>
              {title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#fff', fontSize: 24,
              cursor: 'pointer', lineHeight: 1, padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: isMobile ? '16px' : '20px', overflowY: 'auto', flex: 1 }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: '1.5px solid #111' }}>
            {[
              { label: 'Questions', value: paper.total_questions },
              { label: 'Total Marks', value: paper.total_marks },
              { label: 'Duration', value: paper.duration_mins ? `${paper.duration_mins} min` : '—' },
            ].map(({ label, value }, i) => (
              <div key={label} style={{ flex: 1, padding: isMobile ? '10px 8px' : '12px 16px', borderRight: i < 2 ? '1.5px solid #111' : 'none', textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600 }}>{value ?? '—'}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginTop: 2 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Marking scheme */}
          {scheme.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #eee' }}>
                Marking Scheme
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 12 : 13 }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ textAlign: 'left', padding: '6px 10px', border: '1px solid #ddd', fontWeight: 500 }}>Type</th>
                      <th style={{ textAlign: 'center', padding: '6px 10px', border: '1px solid #ddd', fontWeight: 500, color: '#085041' }}>✓</th>
                      <th style={{ textAlign: 'center', padding: '6px 10px', border: '1px solid #ddd', fontWeight: 500, color: '#A32D2D' }}>✗</th>
                      {!isMobile && <th style={{ textAlign: 'left', padding: '6px 10px', border: '1px solid #ddd', fontWeight: 500, color: '#666' }}>Note</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {scheme.map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: '6px 10px', border: '1px solid #ddd' }}>{row.type}</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #ddd', textAlign: 'center', color: '#085041', fontWeight: 600 }}>{row.correct}</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #ddd', textAlign: 'center', color: '#A32D2D', fontWeight: 600 }}>{row.wrong}</td>
                        {!isMobile && <td style={{ padding: '6px 10px', border: '1px solid #ddd', color: '#666', fontSize: 11 }}>{row.note}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #eee' }}>
              Instructions
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
              {INSTRUCTIONS.map((inst, i) => (
                <li key={i} style={{ fontSize: isMobile ? 12 : 13, color: '#222', marginBottom: 4 }}>
                  {inst}
                </li>
              ))}
            </ol>
          </div>

          {/* Agreement */}
          <label
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px', border: `1.5px solid ${agreed ? '#0F6E56' : '#111'}`,
              background: agreed ? '#E1F5EE' : '#fff', cursor: 'pointer', marginBottom: 16, fontSize: 13, fontWeight: 500,
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 2, accentColor: '#0F6E56', width: 18, height: 18, flexShrink: 0 }}
            />
            I have read all the instructions and am ready to begin.
          </label>

          <button
            onClick={handleBegin}
            disabled={!agreed || starting}
            style={{
              width: '100%',
              padding: '15px 0',
              background: agreed ? '#0F6E56' : '#ccc',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: agreed && !starting ? 'pointer' : 'not-allowed',
            }}
          >
            {starting ? 'Starting...' : 'Begin Test →'}
          </button>
        </div>
      </div>
    </div>
  )
}
