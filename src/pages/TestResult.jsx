import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getSession } from '../api/sessions.js'
import { getPaperDetail } from '../api/papers.js'
import { getCustomSession, getCustomSessionReview } from '../api/customTestSessions.js'
import { getSessionReview } from '../api/sessions.js'
import QuestionView from '../components/QuestionView.jsx'
import OptionButton from '../components/OptionButton.jsx'
import { useIsMobile } from '../hooks/useIsMobile.js'

const EXAM_LABELS = { JEE_MAINS: 'JEE Mains', JEE_ADV: 'JEE Advanced', NEET: 'NEET UG' }

export default function TestResult() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const sessionType = location.state?.sessionType
    || sessionStorage.getItem(`pariksha_session_type_${sessionId}`) || 'nta'
  const terminatedByState = location.state?.terminatedBy
  const [session, setSession] = useState(null)
  const [paper, setPaper] = useState(null)
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedQ, setExpandedQ] = useState(null)

  useEffect(() => {
    async function load() {
      const isCustom = sessionType === 'custom'
      const [sess, review] = await Promise.all([
        isCustom ? getCustomSession(sessionId) : getSession(sessionId),
        isCustom ? getCustomSessionReview(sessionId) : getSessionReview(sessionId),
      ])
      setSession(sess)
      const p = isCustom ? null : await getPaperDetail(sess.paper_id)
      setQuestions(review)
      setPaper(p)
      const map = {}
      review.forEach((q) => {
        map[q.question_id] = {
          selected_option: q.selected_option,
          is_correct: q.is_correct,
          is_flagged: q.is_flagged,
          marks_awarded: q.marks_awarded,
        }
      })
      setResponses(map)
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [sessionId, sessionType])

  if (loading) return <div style={{ padding: 40, color: '#666', fontSize: 14 }}>Loading results...</div>
  if (!session) return null

  const terminatedBy = session.terminated_by || terminatedByState
  const correct = Object.values(responses).filter((r) => r.is_correct === true).length
  const wrong = Object.values(responses).filter((r) => r.is_correct === false).length
  const skipped = questions.length - correct - wrong
  const scorePct = session.score_max ? Math.round((session.score_total / session.score_max) * 100) : null

  const paperLabel = paper
    ? [EXAM_LABELS[paper.exam] || paper.exam, paper.year, paper.session, paper.shift].filter(Boolean).join(' · ')
    : session?.title ?? null

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px 16px' : '12px 24px',
          borderBottom: '1.5px solid #111',
        }}
      >
        <div>
          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600 }}>Result</div>
          {paperLabel && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{paperLabel}</div>}
        </div>
        <button
          onClick={() => navigate('/assigned')}
          style={{
            border: '1.5px solid #111', background: '#fff',
            padding: isMobile ? '8px 12px' : '5px 14px',
            fontSize: isMobile ? 12 : 11,
            textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ← Assigned
        </button>
      </div>

      {terminatedBy === 'tab_switch' && (
        <div
          style={{
            background: '#A32D2D',
            color: '#fff',
            padding: isMobile ? '12px 16px' : '14px 24px',
            fontSize: 13,
            lineHeight: 1.5,
            borderBottom: '1.5px solid #111',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
            Test Terminated
          </div>
          This test was automatically submitted after 3 tab-switch violations were detected. Your answers up to that point have been saved and scored below.
        </div>
      )}

      {terminatedBy === 'time_limit' && (
        <div
          style={{
            background: '#854F0B',
            color: '#fff',
            padding: isMobile ? '12px 16px' : '14px 24px',
            fontSize: 13,
            lineHeight: 1.5,
            borderBottom: '1.5px solid #111',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
            Time Expired
          </div>
          This test was automatically submitted when the time limit ended. All answers saved before expiry have been scored below.
        </div>
      )}

      <div style={{ padding: isMobile ? '16px' : '24px' }}>
        {/* Score summary — 2x2 on mobile, 1x4 on desktop */}
        <div style={{ marginBottom: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666' }}>
          Score Summary
        </div>
        <div
          style={{
            border: '1.5px solid #111',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            marginBottom: 28,
          }}
        >
          {[
            {
              label: 'Score',
              value: session.score_total != null ? session.score_total.toFixed(1) : '—',
              sub: session.score_max != null ? `/ ${session.score_max.toFixed(0)}` : null,
              accent: scorePct != null ? (scorePct >= 60 ? '#085041' : scorePct >= 40 ? '#854F0B' : '#A32D2D') : undefined,
            },
            { label: 'Correct', value: correct, color: '#085041' },
            { label: 'Wrong', value: wrong, color: '#A32D2D' },
            { label: 'Skipped', value: skipped, color: '#666' },
          ].map((s, i) => {
            const isLastRow = isMobile && i >= 2
            const isRightCol = isMobile && i % 2 === 1
            return (
              <div
                key={s.label}
                style={{
                  padding: isMobile ? '14px 16px' : '16px 24px',
                  borderRight: !isRightCol ? '1.5px solid #111' : 'none',
                  borderTop: isLastRow ? '1.5px solid #111' : 'none',
                }}
              >
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 500, letterSpacing: '-0.02em', color: s.color }}>
                  {s.value}
                  {s.sub && <span style={{ fontSize: 13, color: '#888', fontWeight: 400 }}> {s.sub}</span>}
                </div>
                {s.accent && scorePct != null && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: s.accent, marginTop: 2 }}>{scorePct}%</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Question review */}
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginBottom: 12 }}>
          Question Review ({questions.length} questions)
        </div>
        <div>
          {questions.map((q, idx) => {
            const resp = responses[q.question_id]
            const isCorrect = resp?.is_correct === true
            const isWrong = resp?.is_correct === false
            const isSkipped = !resp || resp.selected_option == null
            const borderColor = isCorrect ? '#085041' : isWrong ? '#A32D2D' : '#ccc'
            const isExpanded = expandedQ === q.question_id

            return (
              <div key={q.question_id} style={{ border: `1.5px solid ${borderColor}`, marginBottom: -1 }}>
                <div
                  onClick={() => setExpandedQ(isExpanded ? null : q.question_id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
                    padding: isMobile ? '12px 14px' : '10px 16px', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: isMobile ? 13 : 12, fontWeight: 600, minWidth: 28 }}>Q{q.question_number}</span>
                  <span style={{ fontSize: 11, color: '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.subject}
                  </span>
                  {isCorrect && (
                    <span style={{ fontSize: 10, background: '#085041', color: '#E1F5EE', padding: '2px 8px', textTransform: 'uppercase', flexShrink: 0 }}>
                      ✓
                    </span>
                  )}
                  {isWrong && (
                    <span style={{ fontSize: 10, background: '#A32D2D', color: '#FCEBEB', padding: '2px 8px', textTransform: 'uppercase', flexShrink: 0 }}>
                      ✗
                    </span>
                  )}
                  {isSkipped && (
                    <span style={{ fontSize: 10, background: '#ddd', color: '#555', padding: '2px 8px', textTransform: 'uppercase', flexShrink: 0 }}>
                      —
                    </span>
                  )}
                  {resp?.marks_awarded != null && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: resp.marks_awarded >= 0 ? '#085041' : '#A32D2D', minWidth: 32, textAlign: 'right', flexShrink: 0 }}>
                      {resp.marks_awarded > 0 ? '+' : ''}{resp.marks_awarded}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: '#999', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid #ddd' }}>
                    <QuestionView question={q} questionNumber={q.question_number} />
                    <div style={{ padding: isMobile ? '0 14px 16px' : '0 24px 20px' }}>
                      <div style={{ display: 'flex', gap: isMobile ? 8 : 16, marginBottom: 10, fontSize: 12, color: '#444', flexWrap: 'wrap' }}>
                        <span>Your answer: <strong>{q.selected_option || 'Skipped'}</strong></span>
                        <span>Correct: <strong>{q.correct_option || 'N/A'}</strong></span>
                      </div>
                      {q.options?.length > 0 && q.options.map((opt) => {
                        let state = 'default'
                        if (opt.is_correct) state = 'correct'
                        if (opt.is_selected && !opt.is_correct) state = 'wrong'
                        return (
                          <OptionButton
                            key={opt.option_id}
                            label={opt.option_label}
                            text={opt.option_text}
                            hasImage={opt.has_image}
                            imageUrl={opt.image_url}
                            state={state}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
