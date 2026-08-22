import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getStudentSessions } from '../api/sessions.js'
import { getCustomStudentSessions } from '../api/customTestSessions.js'
import { getStudentMockAttempts } from '../api/mockAttempts.js'
import { useIsMobile } from '../hooks/useIsMobile.js'

const STATUS_STYLES = {
  submitted: { background: '#085041', color: '#E1F5EE' },
  active: { background: '#0F6E56', color: '#fff' },
  timed_out: { background: '#A32D2D', color: '#FCEBEB' },
}

export default function TestHistory() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth?.student_id) return
    Promise.all([
      getStudentSessions(auth.student_id),
      getCustomStudentSessions(auth.student_id),
      getStudentMockAttempts(auth.student_id),
    ])
      .then(([nta, custom, legacyMocks]) => {
        const customRows = custom.map((s) => ({
          session_id: s.session_id,
          kind: 'custom',
          title: s.title,
          started_at: s.started_at,
          status: s.status,
          score_total: s.score_total,
          score_max: s.score_max,
        }))
        const ntaRows = nta.map((s) => ({ ...s, kind: 'nta' }))
        const legacyRows = (legacyMocks.attempts ?? []).map((a) => ({
          session_id: `legacy-${a.mock_attempt_id}`,
          kind: 'legacy_mock',
          title: a.event_name ?? 'Mock Test',
          started_at: a.event_date ?? a.taken_at,
          status: 'submitted',
          score_total: a.total_score,
          score_max: a.max_score,
          read_only: true,
        }))
        const merged = [...ntaRows, ...customRows, ...legacyRows].sort(
          (a, b) => new Date(b.started_at ?? 0) - new Date(a.started_at ?? 0)
        )
        setSessions(merged)
      })
      .finally(() => setLoading(false))
  }, [auth?.student_id])

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
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
          <div style={{ fontSize: 13, fontWeight: 600 }}>Test History</div>
          {isMobile && auth?.name && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{auth.name}</div>}
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

      <div style={{ padding: isMobile ? '16px' : '24px' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginBottom: 12 }}>
          {isMobile ? 'Past Attempts' : `Past Attempts — ${auth?.name}`}
        </div>

        {loading ? (
          <div style={{ color: '#666', padding: '32px 0' }}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div style={{ color: '#666', padding: '32px 0' }}>No tests attempted yet.</div>
        ) : (
          <div style={{ border: '1.5px solid #111' }}>
            {sessions.map((s, i) => {
              const pct = s.score_max ? ((s.score_total / s.score_max) * 100).toFixed(1) : null
              const statusStyle = STATUS_STYLES[s.status] || {}
              const isCompleted = s.status === 'submitted' || s.status === 'timed_out'
              return (
                <div
                  key={s.session_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 10 : 16,
                    padding: isMobile ? '14px 16px' : '14px 20px',
                    borderTop: i > 0 ? '1px solid #ddd' : 'none',
                    cursor: isCompleted && !s.read_only ? 'pointer' : 'default',
                    minHeight: 64,
                  }}
                  onClick={() => isCompleted && !s.read_only && navigate(`/result/${s.session_id}`, { state: { sessionType: s.kind === 'custom' ? 'custom' : 'nta' } })}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.kind === 'custom'
                        ? s.title
                        : s.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>
                      {new Date(s.started_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  {isCompleted && s.score_total != null && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 500, letterSpacing: '-0.02em' }}>
                        {s.score_total.toFixed(1)}
                        <span style={{ fontSize: 11, color: '#666', fontWeight: 400 }}> / {s.score_max?.toFixed(0)}</span>
                      </div>
                      {pct && <div style={{ fontSize: 11, color: '#085041', marginTop: 2 }}>{pct}%</div>}
                    </div>
                  )}

                  {s.status === 'active' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/test/${s.session_id}`, { state: { sessionType: s.kind === 'custom' ? 'custom' : 'nta' } }) }}
                      style={{
                        border: '1.5px solid #0F6E56', background: '#0F6E56', color: '#fff',
                        padding: isMobile ? '8px 14px' : '5px 14px',
                        fontSize: isMobile ? 12 : 11, textTransform: 'uppercase',
                        letterSpacing: '0.08em', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
                      }}
                    >
                      Resume
                    </button>
                  )}

                  {s.read_only && (
                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#666' }}>
                      Imported result
                    </span>
                  )}

                  <span
                    style={{
                      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
                      padding: '3px 8px', flexShrink: 0, ...statusStyle,
                    }}
                  >
                    {s.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
