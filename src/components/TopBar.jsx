import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Shared top bar for PaperBrowser ("Past Papers") and PracticeTests — keeps
// nav consistent between the two entry points into Pariksha.
export default function TopBar({ isMobile }) {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navBtnStyle = (active) => ({
    background: active ? '#111' : 'none',
    color: active ? '#fff' : '#111',
    border: '1.5px solid #111',
    padding: isMobile ? '6px 10px' : '4px 12px',
    fontSize: isMobile ? 12 : 11,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    fontFamily: 'inherit',
  })

  return (
    <div style={{ padding: isMobile ? '12px 16px' : '12px 24px', borderBottom: '1.5px solid #111' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span style={{ fontSize: isMobile ? 16 : 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Pariksha</span>
          {!isMobile && (
            <span style={{ fontSize: 11, color: '#888', marginLeft: 10, letterSpacing: '0.04em' }}>
              NTA Previous Year Questions
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 6 : 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/papers')} style={navBtnStyle(location.pathname === '/papers')}>
            {isMobile ? 'Papers' : 'Past Papers'}
          </button>
          <button onClick={() => navigate('/practice')} style={navBtnStyle(location.pathname === '/practice')}>
            {isMobile ? 'Practice' : 'Practice Tests'}
          </button>
          <button onClick={() => navigate('/history')} style={navBtnStyle(location.pathname === '/history')}>
            {isMobile ? 'Tests' : 'My Tests'}
          </button>
          {!isMobile && <span style={{ fontSize: 12, color: '#666' }}>{auth?.name}</span>}
          <button onClick={logout} style={{ ...navBtnStyle(false), background: 'none' }}>
            Logout
          </button>
        </div>
      </div>
      {isMobile && auth?.name && (
        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{auth.name}</div>
      )}
    </div>
  )
}
