import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Timer from '../components/Timer.jsx'
import QuestionPalette from '../components/QuestionPalette.jsx'
import QuestionView from '../components/QuestionView.jsx'
import OptionButton from '../components/OptionButton.jsx'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { makeSessionAdapter } from '../api/sessionAdapter.js'

const EXAM_LABELS = { JEE_MAINS: 'JEE Mains', JEE_ADV: 'JEE Advanced', NEET: 'NEET UG' }
const SAVE_DEBOUNCE_MS = 400
const LEAVE_TEST_MESSAGE = 'Your test is in progress. Saved answers remain, but the timer keeps running. Leave this test screen?'

function getStoredReturnTo(sessionId) {
  try {
    return sessionStorage.getItem(`pariksha_return_to_${sessionId}`)
  } catch {
    return null
  }
}

export default function TestInterface() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()

  const sessionType = location.state?.sessionType
    || (sessionStorage.getItem(`pariksha_session_type_${sessionId}`)) || 'nta'
  const adapterRef = useRef(makeSessionAdapter(sessionType))

  useEffect(() => {
    try { sessionStorage.setItem(`pariksha_session_type_${sessionId}`, sessionType) } catch { /* ignore */ }
  }, [sessionId, sessionType])

  const [session, setSession] = useState(null)
  const [paper, setPaper] = useState(null)
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const [visited, setVisited] = useState(new Set([0]))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const saveTimerRef = useRef(null)
  const pendingSaveRef = useRef(null)
  const questionStartRef = useRef(Date.now())
  const timeSpentRef = useRef({})
  const responsesRef = useRef({})
  const expiringRef = useRef(false)
  const allowHistoryLeaveRef = useRef(false)
  const flushCurrentQuestionRef = useRef(null)
  const returnToRef = useRef(location.state?.returnTo || getStoredReturnTo(sessionId) || '/assigned')

  useEffect(() => {
    responsesRef.current = responses
  }, [responses])

  useEffect(() => {
    async function init() {
      const adapter = adapterRef.current
      try {
        const [sess, existingResponses] = await Promise.all([
          adapter.getSession(sessionId),
          adapter.getSessionResponses(sessionId),
        ])
        if (sess.status !== 'active') {
          navigate(`/result/${sessionId}`, { replace: true, state: { sessionType } })
          return
        }
        setSession(sess)

        const qs = await adapter.getQuestions(sess)
        const paperDet = adapter.getPaperDetail ? await adapter.getPaperDetail(sess) : null
        setQuestions(qs)
        setPaper(paperDet)

        const map = {}
        const spentMs = {}
        existingResponses.forEach((r) => {
          map[r.question_id] = { selected_option: r.selected_option, is_flagged: r.is_flagged }
          if (r.time_spent_secs != null) {
            spentMs[r.question_id] = Math.max(0, Number(r.time_spent_secs) || 0) * 1000
          }
        })
        timeSpentRef.current = spentMs
        setResponses(map)
      } catch {
        setError('Failed to load the test. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [sessionId, navigate])

  useEffect(() => {
    if (questions.length === 0) return
    questionStartRef.current = Date.now()
    setVisited((prev) => new Set(prev).add(currentIndex))
  }, [currentIndex, questions.length])

  useEffect(() => {
    function onBeforeUnload(e) {
      if (allowHistoryLeaveRef.current) return
      e.preventDefault()
      e.returnValue = LEAVE_TEST_MESSAGE
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // Close palette when switching to desktop
  useEffect(() => {
    if (!isMobile) setPaletteOpen(false)
  }, [isMobile])

  const getTimeSpentSecs = useCallback((questionId) => {
    const spentMs = timeSpentRef.current[questionId] || 0
    return spentMs > 0 ? Math.ceil(spentMs / 1000) : 0
  }, [])

  const captureCurrentQuestionTime = useCallback(() => {
    const questionId = questions[currentIndex]?.question_id
    const now = Date.now()
    if (questionId) {
      const elapsedMs = Math.max(0, now - questionStartRef.current)
      if (elapsedMs > 0) {
        timeSpentRef.current[questionId] = (timeSpentRef.current[questionId] || 0) + elapsedMs
      }
    }
    questionStartRef.current = now
    return questionId
  }, [currentIndex, questions])

  const saveQuestionResponse = useCallback(
    async (questionId, selectedOption) => {
      const spent = getTimeSpentSecs(questionId)
      await adapterRef.current.saveResponse(sessionId, questionId, selectedOption, spent)
    },
    [getTimeSpentSecs, sessionId],
  )

  const flushPendingSave = useCallback(async () => {
    clearTimeout(saveTimerRef.current)
    const pending = pendingSaveRef.current
    pendingSaveRef.current = null
    if (pending) {
      await saveQuestionResponse(pending.questionId, pending.selectedOption)
    }
    return pending
  }, [saveQuestionResponse])

  const flushCurrentQuestion = useCallback(async () => {
    const questionId = captureCurrentQuestionTime()
    const pending = pendingSaveRef.current
    await flushPendingSave()
    if (questionId && pending?.questionId !== questionId) {
      const selectedOption = responsesRef.current[questionId]?.selected_option ?? null
      await saveQuestionResponse(questionId, selectedOption)
    }
  }, [captureCurrentQuestionTime, flushPendingSave, saveQuestionResponse])

  useEffect(() => {
    flushCurrentQuestionRef.current = flushCurrentQuestion
  }, [flushCurrentQuestion])

  useEffect(() => {
    if (!session || questions.length === 0) return

    window.history.pushState({ parikshaTestGuard: sessionId }, '', window.location.href)

    function onPopState() {
      if (allowHistoryLeaveRef.current || expiringRef.current) return

      const shouldLeave = window.confirm(LEAVE_TEST_MESSAGE)
      if (!shouldLeave) {
        window.history.pushState({ parikshaTestGuard: sessionId }, '', window.location.href)
        return
      }

      allowHistoryLeaveRef.current = true
      Promise.resolve(flushCurrentQuestionRef.current?.())
        .catch(() => {})
        .finally(() => {
          window.history.back()
          window.setTimeout(() => {
            if (window.location.pathname.startsWith('/test/')) {
              navigate(returnToRef.current, { replace: true })
            }
          }, 100)
        })
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [navigate, questions.length, session, sessionId])

  const persistResponse = useCallback(
    (questionId, selectedOption) => {
      clearTimeout(saveTimerRef.current)
      pendingSaveRef.current = { questionId, selectedOption }
      saveTimerRef.current = setTimeout(async () => {
        const pending = pendingSaveRef.current
        if (!pending || pending.questionId !== questionId) return
        try {
          await saveQuestionResponse(pending.questionId, pending.selectedOption)
          if (pendingSaveRef.current === pending) {
            pendingSaveRef.current = null
          }
        } catch {
          // silent
        }
      }, SAVE_DEBOUNCE_MS)
    },
    [saveQuestionResponse],
  )

  const handleSelectOption = useCallback(
    (questionId, optionLabel, isMulti = false) => {
      captureCurrentQuestionTime()
      setResponses((prev) => {
        const current = prev[questionId] || {}
        let newOption
        if (isMulti) {
          const parts = current.selected_option ? new Set(current.selected_option.split(',')) : new Set()
          if (parts.has(optionLabel)) parts.delete(optionLabel)
          else parts.add(optionLabel)
          newOption = parts.size > 0 ? [...parts].sort().join(',') : null
        } else {
          newOption = current.selected_option === optionLabel ? null : optionLabel
        }
        persistResponse(questionId, newOption)
        return { ...prev, [questionId]: { ...current, selected_option: newOption } }
      })
    },
    [captureCurrentQuestionTime, persistResponse],
  )

  const handleClearResponse = useCallback(() => {
    const q = questions[currentIndex]
    if (!q) return
    captureCurrentQuestionTime()
    setResponses((prev) => ({
      ...prev,
      [q.question_id]: { ...(prev[q.question_id] || {}), selected_option: null },
    }))
    persistResponse(q.question_id, null)
  }, [captureCurrentQuestionTime, currentIndex, questions, persistResponse])

  const handleToggleFlag = useCallback(
    async (questionId) => {
      const current = responses[questionId] || {}
      const newFlagged = !current.is_flagged
      setResponses((prev) => ({ ...prev, [questionId]: { ...current, is_flagged: newFlagged } }))
      try {
        await adapterRef.current.toggleFlag(sessionId, questionId)
      } catch {
        setResponses((prev) => ({ ...prev, [questionId]: { ...current, is_flagged: !newFlagged } }))
      }
    },
    [responses, sessionId],
  )

  const goTo = useCallback((idx) => {
    const nextIndex = Math.max(0, Math.min(idx, questions.length - 1))
    if (nextIndex !== currentIndex) {
      void flushCurrentQuestion().catch(() => {})
      setCurrentIndex(nextIndex)
    }
    setPaletteOpen(false)
  }, [currentIndex, flushCurrentQuestion, questions.length])

  const handleMarkAndNext = useCallback(async () => {
    const q = questions[currentIndex]
    if (q) await handleToggleFlag(q.question_id)
    goTo(currentIndex + 1)
  }, [currentIndex, questions, handleToggleFlag, goTo])

  const handleSaveAndNext = useCallback(() => {
    goTo(currentIndex + 1)
  }, [currentIndex, goTo])

  const handleSubmit = useCallback(async () => {
    const answeredCount = Object.values(responses).filter((r) => r.selected_option != null).length
    const unanswered = questions.length - answeredCount
    const msg = unanswered > 0
      ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`
      : 'Submit the test? This cannot be undone.'
    if (!window.confirm(msg)) return
    setSubmitting(true)
    try {
      await flushCurrentQuestion()
      await adapterRef.current.submitSession(sessionId)
      allowHistoryLeaveRef.current = true
      try {
        sessionStorage.removeItem(`pariksha_return_to_${sessionId}`)
      } catch {
        // ignore
      }
      navigate(`/result/${sessionId}`, { replace: true, state: { sessionType } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Submit failed. Please try again.')
      setSubmitting(false)
    }
  }, [flushCurrentQuestion, sessionId, navigate, responses, questions.length, sessionType])

  const handleExpire = useCallback(() => {
    if (expiringRef.current) return
    expiringRef.current = true
    setSubmitting(true)
    alert('Time is up! Your test is being submitted.')
    flushCurrentQuestion()
      .catch(() => {})
      .then(() => adapterRef.current.submitSession(sessionId))
      .then(() => {
        allowHistoryLeaveRef.current = true
        try {
          sessionStorage.removeItem(`pariksha_return_to_${sessionId}`)
        } catch {
          // ignore
        }
        navigate(`/result/${sessionId}`, { replace: true, state: { sessionType } })
      })
      .catch(() => {
        allowHistoryLeaveRef.current = true
        navigate(`/result/${sessionId}`, { replace: true, state: { sessionType } })
      })
  }, [flushCurrentQuestion, sessionId, navigate, sessionType])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#666', fontSize: 14 }}>
        Loading test...
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ color: '#A32D2D', fontSize: 14, textAlign: 'center', padding: '0 24px' }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ border: '1.5px solid #111', padding: '8px 20px', cursor: 'pointer', background: '#fff', fontSize: 13 }}>
          Retry
        </button>
      </div>
    )
  }
  if (!session || questions.length === 0) {
    return <div style={{ padding: 40, color: '#666' }}>No questions found for this paper.</div>
  }

  const currentQ = questions[currentIndex]
  const currentResp = responses[currentQ?.question_id] || {}
  const isMulti = currentQ?.question_type === 'mcq_multi'
  const isInteger = currentQ?.question_type === 'integer' || currentQ?.question_type === 'numerical'
  const selectedSet = isMulti && currentResp.selected_option
    ? new Set(currentResp.selected_option.split(','))
    : null

  const paperLabel = sessionType === 'custom'
    ? (session?.title ?? '')
    : [
        EXAM_LABELS[paper?.exam] || paper?.exam,
        paper?.year,
        paper?.session,
        paper?.shift,
      ].filter(Boolean).join(' · ')

  const answeredCount = Object.values(responses).filter((r) => r.selected_option != null).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#fff', overflow: 'hidden' }}>
      {/* ── Top bar ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 12px' : '0 20px',
          height: isMobile ? 48 : 52,
          borderBottom: '1.5px solid #111',
          flexShrink: 0,
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, minWidth: 0 }}>
          <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, letterSpacing: '-0.01em', flexShrink: 0 }}>
            Pariksha
          </span>
          {!isMobile && paperLabel && (
            <span style={{ fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {paperLabel}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexShrink: 0 }}>
          <Timer
            startedAt={session.started_at}
            timeLimitMins={session.time_limit_mins}
            onExpire={handleExpire}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: '#111',
              color: '#fff',
              border: 'none',
              padding: isMobile ? '6px 10px' : '7px 18px',
              fontSize: isMobile ? 10 : 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              flexShrink: 0,
              fontFamily: 'inherit',
            }}
          >
            {submitting ? '...' : isMobile ? 'Submit' : 'Submit Test'}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Desktop: left sidebar */}
        {!isMobile && (
          <aside style={{ width: 240, flexShrink: 0, borderRight: '1.5px solid #111', overflowY: 'auto' }}>
            <QuestionPalette
              questions={questions}
              responses={responses}
              visited={visited}
              currentIndex={currentIndex}
              onJump={goTo}
            />
          </aside>
        )}

        {/* Question content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Question number strip */}
          <div
            style={{
              padding: isMobile ? '8px 14px' : '8px 24px',
              borderBottom: '1px solid #e8e8e8',
              background: '#fafafa',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 11, color: '#666' }}>
              Q <b style={{ color: '#111' }}>{currentIndex + 1}</b>/{questions.length}
            </span>
            {currentQ?.subject && (
              <span
                style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: '#E1F5EE', color: '#085041', border: '1px solid #0F6E56', padding: '2px 7px',
                }}
              >
                {currentQ.subject}
              </span>
            )}
            {isMulti && (
              <span style={{ fontSize: 10, background: '#854F0B', color: '#fff', padding: '2px 7px', textTransform: 'uppercase' }}>
                Multi-correct
              </span>
            )}
            {isInteger && (
              <span style={{ fontSize: 10, background: '#111', color: '#fff', padding: '2px 7px', textTransform: 'uppercase' }}>
                Integer
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: currentResp.is_flagged ? '#854F0B' : '#bbb' }}>
              {currentResp.is_flagged ? '⚑ Flagged' : ''}
            </span>
          </div>

          {/* Scrollable question + options */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div style={{ padding: isMobile ? '16px' : '20px 32px' }}>
              <QuestionView question={currentQ} questionNumber={currentQ.question_number} />

              {!isInteger && currentQ.options?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {currentQ.options.map((opt) => {
                    const isSelected = isMulti
                      ? selectedSet?.has(opt.option_label)
                      : currentResp.selected_option === opt.option_label
                    return (
                      <OptionButton
                        key={opt.option_id}
                        label={opt.option_label}
                        text={opt.option_text}
                        hasImage={opt.has_image}
                        imageUrl={opt.image_url}
                        state={isSelected ? 'selected' : 'default'}
                        onClick={() => handleSelectOption(currentQ.question_id, opt.option_label, isMulti)}
                      />
                    )
                  })}
                  {isMulti && (
                    <p style={{ fontSize: 11, color: '#854F0B', marginTop: 4 }}>
                      Select one or more correct options
                    </p>
                  )}
                </div>
              )}

              {isInteger && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', display: 'block', marginBottom: 6 }}>
                    Your Answer (integer)
                  </label>
                  <input
                    type="number"
                    value={currentResp.selected_option || ''}
                    onChange={(e) => handleSelectOption(currentQ.question_id, e.target.value || null)}
                    style={{
                      border: '1.5px solid #111',
                      padding: '12px 14px',
                      fontSize: '1.1rem',
                      width: isMobile ? '100%' : 200,
                      outline: 'none',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter answer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Desktop bottom nav ── */}
          {!isMobile && (
            <div
              style={{
                flexShrink: 0,
                borderTop: '1.5px solid #111',
                padding: '10px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                background: '#fafafa',
              }}
            >
              <button onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0} style={navBtn({ disabled: currentIndex === 0 })}>
                ← Previous
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleClearResponse} disabled={!currentResp.selected_option} style={navBtn({ disabled: !currentResp.selected_option, variant: 'ghost' })}>
                  Clear Response
                </button>
                <button onClick={handleMarkAndNext} style={navBtn({ variant: 'review' })}>
                  {currentResp.is_flagged ? 'Unmark & Next' : 'Mark & Next'}
                </button>
                <button onClick={handleSaveAndNext} disabled={currentIndex === questions.length - 1} style={navBtn({ disabled: currentIndex === questions.length - 1, variant: 'primary' })}>
                  Save & Next →
                </button>
              </div>
            </div>
          )}

          {/* ── Mobile bottom nav ── */}
          {isMobile && (
            <div
              style={{
                flexShrink: 0,
                borderTop: '1.5px solid #111',
                background: '#fafafa',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {/* Row 1: Prev | Open Palette | Next */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', borderBottom: '1px solid #e0e0e0' }}>
                <button
                  onClick={() => goTo(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  style={mobileNavBtn({ disabled: currentIndex === 0, border: 'none', borderRight: '1px solid #e0e0e0' })}
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPaletteOpen(true)}
                  style={mobileNavBtn({ border: 'none', borderRight: '1px solid #e0e0e0', color: '#0F6E56', fontWeight: 700 })}
                >
                  {answeredCount}/{questions.length} ▲
                </button>
                <button
                  onClick={() => goTo(currentIndex + 1)}
                  disabled={currentIndex === questions.length - 1}
                  style={mobileNavBtn({ disabled: currentIndex === questions.length - 1, border: 'none' })}
                >
                  Next →
                </button>
              </div>
              {/* Row 2: Clear | Mark for Review */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <button
                  onClick={handleClearResponse}
                  disabled={!currentResp.selected_option}
                  style={mobileNavBtn({ disabled: !currentResp.selected_option, border: 'none', borderRight: '1px solid #e0e0e0', variant: 'ghost', smaller: true })}
                >
                  Clear
                </button>
                <button
                  onClick={handleMarkAndNext}
                  style={mobileNavBtn({ border: 'none', variant: 'review', smaller: true })}
                >
                  {currentResp.is_flagged ? '⚑ Unmark' : '⚑ Mark'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile palette drawer (full-screen overlay) ── */}
      {isMobile && paletteOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              height: 52,
              borderBottom: '1.5px solid #111',
              background: '#111',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Question Map</span>
            <button
              onClick={() => setPaletteOpen(false)}
              style={{
                background: 'none', border: '1.5px solid #555', color: '#fff',
                padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}
            >
              Close ✕
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <QuestionPalette
              questions={questions}
              responses={responses}
              visited={visited}
              currentIndex={currentIndex}
              onJump={goTo}
              compact={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function navBtn({ disabled = false, variant = 'default' } = {}) {
  const base = {
    padding: '7px 16px',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    border: '1.5px solid #111',
    fontFamily: 'inherit',
  }
  if (variant === 'primary') return { ...base, background: '#0F6E56', color: '#fff', border: '1.5px solid #0F6E56' }
  if (variant === 'review') return { ...base, background: '#854F0B', color: '#fff', border: '1.5px solid #854F0B' }
  if (variant === 'ghost') return { ...base, background: '#fff', color: '#111' }
  return { ...base, background: '#fff', color: '#111' }
}

function mobileNavBtn({ disabled = false, variant = 'default', border, borderRight, color, fontWeight, smaller = false } = {}) {
  const height = smaller ? 44 : 52
  const base = {
    height,
    fontSize: smaller ? 11 : 13,
    fontWeight: fontWeight ?? 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    background: '#fafafa',
    color: color ?? '#111',
    border: border ?? '1.5px solid #111',
    borderRight: borderRight ?? undefined,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  }
  if (variant === 'review') return { ...base, background: '#854F0B', color: '#fff' }
  if (variant === 'ghost') return { ...base, background: '#f5f5f5' }
  return base
}
