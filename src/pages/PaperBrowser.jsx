import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getPapers } from '../api/papers.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { useStartTest } from '../hooks/useStartTest.js'
import { useAttemptsByPaper } from '../hooks/useAttemptsByPaper.js'
import InstructionsModal from '../components/InstructionsModal.jsx'
import TopBar from '../components/TopBar.jsx'

const EXAMS = ['All', 'JEE_MAINS', 'JEE_ADV', 'NEET']
const EXAM_LABELS = { JEE_MAINS: 'JEE Mains', JEE_ADV: 'JEE Advanced', NEET: 'NEET UG' }
const STUDENT_EXAM_MAP = { JEE: ['JEE_MAINS', 'JEE_ADV'], NEET: ['NEET'] }

export default function PaperBrowser() {
  const { auth } = useAuth()
  const isMobile = useIsMobile()
  const [papers, setPapers] = useState([])
  const [exam, setExam] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { instructionsFor, setInstructionsFor, error: startError, handleBeginTest } = useStartTest(auth?.student_id)
  const attemptsByPaper = useAttemptsByPaper(auth?.student_id)

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
      <TopBar isMobile={isMobile} />

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

        {(error || startError) && (
          <div style={{ background: '#A32D2D', color: '#FCEBEB', padding: '10px 12px', marginBottom: 16, fontSize: 13 }}>
            {error || startError}
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
            {papers.map((p, i) => {
              const attempt = attemptsByPaper[p.paper_id]
              const bestPct = attempt?.bestScore != null && attempt.bestMax
                ? Math.round((attempt.bestScore / attempt.bestMax) * 100)
                : null
              return (
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
                  {p.exam === 'JEE_ADV' && (
                    <span
                      title={p.marking_status === 'verified'
                        ? `Official section marking verified${p.marking_manifest_id ? `: ${p.marking_manifest_id}` : ''}`
                        : 'Section marking has not yet been verified against an official paper manifest'}
                      style={{
                        fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em',
                        border: `1px solid ${p.marking_status === 'verified' ? '#0F6E56' : '#9A6700'}`,
                        color: p.marking_status === 'verified' ? '#085041' : '#6E4B00',
                        background: p.marking_status === 'verified' ? '#E1F5EE' : '#FFF8C5',
                        padding: '2px 6px',
                      }}
                    >
                      {p.marking_status === 'verified' ? 'Marking verified' : 'Marking unverified'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#555' }}>
                  {p.total_questions && <span>{p.total_questions} Qs</span>}
                  {p.total_marks && <span>{p.total_marks} marks</span>}
                  {p.duration_mins && <span>{p.duration_mins} min</span>}
                </div>
                {attempt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700,
                        background: '#085041', color: '#E1F5EE', padding: '2px 7px',
                      }}
                    >
                      ✓ Attempted
                    </span>
                    <span style={{ fontSize: 12, color: '#666' }}>
                      {attempt.count} attempt{attempt.count !== 1 ? 's' : ''}
                      {bestPct != null && ` · Best ${bestPct}%`}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setInstructionsFor(p)}
                  style={{
                    marginTop: 4,
                    background: attempt ? '#fff' : '#0F6E56',
                    color: attempt ? '#0F6E56' : '#fff',
                    border: attempt ? '1.5px solid #0F6E56' : 'none',
                    padding: isMobile ? '12px 0' : '9px 0',
                    fontSize: isMobile ? 13 : 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {attempt ? 'Retake Test' : 'Start Test'}
                </button>
              </div>
              )
            })}
          </div>
        )}
      </div>

      {instructionsFor && (
        <InstructionsModal
          paper={instructionsFor}
          title={`${EXAM_LABELS[instructionsFor.exam] || instructionsFor.exam} ${instructionsFor.year}${instructionsFor.session ? ` · ${instructionsFor.session}` : ''}${instructionsFor.shift ? ` · ${instructionsFor.shift}` : ''}`}
          onClose={() => setInstructionsFor(null)}
          onBegin={handleBeginTest}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}
