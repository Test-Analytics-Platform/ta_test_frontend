import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getPapers } from '../api/papers.js'
import { startSession } from '../api/sessions.js'
import { useIsMobile } from '../hooks/useIsMobile.js'

const EXAMS = ['All', 'JEE_MAINS', 'JEE_ADV', 'NEET']
const EXAM_LABELS = { JEE_MAINS: 'JEE Mains', JEE_ADV: 'JEE Advanced', NEET: 'NEET UG' }
const STUDENT_EXAM_MAP = { JEE: ['JEE_MAINS', 'JEE_ADV'], NEET: ['NEET'] }

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

function InstructionsModal({ paper, onClose, onBegin, isMobile }) {
  const [agreed, setAgreed] = useState(false)
  const [starting, setStarting] = useState(false)

  async function handleBegin() {
    if (!agreed) return
    setStarting(true)
    await onBegin()
    setStarting(false)
  }

  const scheme = MARKING_SCHEME[paper.exam] || []

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
              {EXAM_LABELS[paper.exam] || paper.exam} {paper.year}
              {paper.session ? ` · ${paper.session}` : ''}
              {paper.shift ? ` · ${paper.shift}` : ''}
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

export default function PaperBrowser() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [papers, setPapers] = useState([])
  const [exam, setExam] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [instructionsFor, setInstructionsFor] = useState(null)

  const allowedExams = STUDENT_EXAM_MAP[auth?.exam] || EXAMS.filter((e) => e !== 'All')
  const visibleTabs = ['All', ...allowedExams]

  useEffect(() => {
    if (exam !== 'All' && !allowedExams.includes(exam)) setExam('All')
  }, [allowedExams, exam])

  useEffect(() => {
    setLoading(true)
    const params = {
      ...(auth?.student_id ? { student_id: auth.student_id } : {}),
      ...(exam !== 'All' ? { exam } : {}),
    }
    getPapers(params)
      .then(setPapers)
      .catch(() => setError('Failed to load papers'))
      .finally(() => setLoading(false))
  }, [auth?.student_id, exam])

  async function handleBeginTest() {
    if (!instructionsFor) return
    setError(null)
    try {
      const session = await startSession(instructionsFor.paper_id, auth.student_id)
      navigate(`/test/${session.session_id}`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to start test'
      if (msg.startsWith('Active session already exists:')) {
        const sid = msg.split(': ')[1]
        navigate(`/test/${sid}`)
      } else {
        setInstructionsFor(null)
        setError(msg)
      }
    }
  }

  const tabStyle = (active) => ({
    padding: isMobile ? '8px 14px' : '6px 14px',
    border: '1.5px solid #111',
    borderRight: 'none',
    background: active ? '#111' : '#fff',
    color: active ? '#fff' : '#111',
    fontSize: isMobile ? 12 : 11,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Top bar */}
      <div
        style={{
          padding: isMobile ? '12px 16px' : '12px 24px',
          borderBottom: '1.5px solid #111',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: isMobile ? 16 : 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Pariksha</span>
            {!isMobile && (
              <span style={{ fontSize: 11, color: '#888', marginLeft: 10, letterSpacing: '0.04em' }}>
                NTA Previous Year Questions
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: isMobile ? 8 : 12, alignItems: 'center' }}>
            <button
              onClick={() => navigate('/history')}
              style={{
                background: 'none',
                border: '1.5px solid #111',
                padding: isMobile ? '6px 10px' : '4px 12px',
                fontSize: isMobile ? 12 : 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {isMobile ? 'Tests' : 'My Tests'}
            </button>
            {!isMobile && <span style={{ fontSize: 12, color: '#666' }}>{auth?.name}</span>}
            <button
              onClick={logout}
              style={{
                background: 'none',
                border: '1.5px solid #111',
                padding: isMobile ? '6px 10px' : '4px 12px',
                fontSize: isMobile ? 12 : 11,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Logout
            </button>
          </div>
        </div>
        {isMobile && auth?.name && (
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{auth.name}</div>
        )}
      </div>

      <div style={{ padding: isMobile ? '16px' : '24px' }}>
        <div style={{ marginBottom: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666' }}>
          Select a Past Paper to Practice
        </div>

        {/* Exam filter tabs — scrollable on mobile */}
        <div style={{ overflowX: 'auto', marginBottom: 20, WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', borderRight: '1.5px solid #111', width: 'max-content' }}>
            {visibleTabs.map((e) => (
              <button key={e} style={tabStyle(exam === e)} onClick={() => setExam(e)}>
                {e === 'All' ? 'All Exams' : EXAM_LABELS[e] || e}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#A32D2D', color: '#FCEBEB', padding: '10px 12px', marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#666', fontSize: 14, padding: '32px 0' }}>Loading papers...</div>
        ) : papers.length === 0 ? (
          <div style={{ color: '#666', fontSize: 14, padding: '32px 0' }}>No papers found.</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
              border: '1.5px solid #111',
            }}
          >
            {papers.map((p, i) => (
              <div
                key={p.paper_id}
                style={{
                  borderBottom: i < papers.length - 1 ? '1.5px solid #111' : 'none',
                  borderRight: isMobile ? 'none' : '1.5px solid #111',
                  padding: isMobile ? '16px' : '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
                      background: '#E1F5EE', color: '#085041', border: '1px solid #0F6E56', padding: '2px 7px',
                    }}
                  >
                    {EXAM_LABELS[p.exam] || p.exam}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>{p.year}</span>
                  {(p.session || p.shift) && (
                    <span style={{ fontSize: 13, color: '#666' }}>{[p.session, p.shift].filter(Boolean).join(' · ')}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#555' }}>
                  {p.total_questions && <span>{p.total_questions} Qs</span>}
                  {p.total_marks && <span>{p.total_marks} marks</span>}
                  {p.duration_mins && <span>{p.duration_mins} min</span>}
                </div>
                <button
                  onClick={() => setInstructionsFor(p)}
                  style={{
                    marginTop: 4,
                    background: '#0F6E56',
                    color: '#fff',
                    border: 'none',
                    padding: isMobile ? '12px 0' : '9px 0',
                    fontSize: isMobile ? 13 : 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Start Test
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {instructionsFor && (
        <InstructionsModal
          paper={instructionsFor}
          onClose={() => setInstructionsFor(null)}
          onBegin={handleBeginTest}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}
