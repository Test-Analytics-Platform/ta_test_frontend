import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getAssignedTests, startCustomSession } from '../api/customTestSessions.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import TopBar from '../components/TopBar.jsx'

export default function AssignedTests() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(null)

  useEffect(() => {
    if (!auth?.student_id) return
    getAssignedTests(auth.student_id)
      .then(setTests)
      .catch(() => setError('Failed to load assigned tests'))
      .finally(() => setLoading(false))
  }, [auth?.student_id])

  async function handleStart(test) {
    if (test.session_id) {
      if (test.session_status === 'active') {
        navigate(`/test/${test.session_id}`, { state: { sessionType: 'custom' } })
      } else {
        navigate(`/result/${test.session_id}`, { state: { sessionType: 'custom' } })
      }
      return
    }
    setStarting(test.assignment_id)
    setError(null)
    try {
      const session = await startCustomSession(test.assignment_id, auth.student_id)
      navigate(`/test/${session.session_id}`, { state: { sessionType: 'custom' } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start test')
      setStarting(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <TopBar isMobile={isMobile} />

      <div style={{ padding: isMobile ? '16px' : '24px' }}>
        <div style={{ marginBottom: 16, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666' }}>
          Tests Assigned By Your Institute
        </div>

        {error && (
          <div style={{ background: '#A32D2D', color: '#FCEBEB', padding: '10px 12px', marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#666', fontSize: 14, padding: '32px 0' }}>Loading...</div>
        ) : tests.length === 0 ? (
          <div style={{ color: '#666', fontSize: 14, padding: '32px 0' }}>No tests assigned yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', border: '1.5px solid #111' }}>
            {tests.map((t, i) => {
              const isSubmitted = t.session_status === 'submitted' || t.session_status === 'timed_out'
              const isActive = t.session_status === 'active'
              return (
                <div
                  key={t.assignment_id}
                  style={{
                    borderBottom: i < tests.length - 1 ? '1.5px solid #111' : 'none',
                    borderRight: isMobile ? 'none' : '1.5px solid #111',
                    padding: isMobile ? '16px' : '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', background: '#E1F5EE', color: '#085041', border: '1px solid #0F6E56', padding: '2px 7px' }}>
                      {t.exam}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{t.title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#555' }}>
                    {t.duration_mins && <span>{t.duration_mins} min</span>}
                    {t.total_marks && <span>{t.total_marks} marks</span>}
                    {t.due_at && <span>Due {new Date(t.due_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>}
                  </div>
                  {isSubmitted && (
                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, background: '#085041', color: '#E1F5EE', padding: '2px 7px', alignSelf: 'flex-start' }}>
                      ✓ Completed
                    </span>
                  )}
                  <button
                    onClick={() => handleStart(t)}
                    disabled={starting === t.assignment_id}
                    style={{
                      marginTop: 4,
                      background: isSubmitted ? '#fff' : '#0F6E56',
                      color: isSubmitted ? '#0F6E56' : '#fff',
                      border: isSubmitted ? '1.5px solid #0F6E56' : 'none',
                      padding: isMobile ? '12px 0' : '9px 0',
                      fontSize: isMobile ? 13 : 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: starting === t.assignment_id ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {isSubmitted ? 'View Result' : isActive ? 'Resume Test' : starting === t.assignment_id ? 'Starting...' : 'Start Test'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
