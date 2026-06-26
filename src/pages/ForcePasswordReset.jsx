import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { changeStudentPassword } from '../api/auth.js'

export default function ForcePasswordReset() {
  const { auth, login } = useAuth()
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await changeStudentPassword(oldPassword, newPassword)
      login({ ...auth, must_reset_password: false })
      navigate('/papers', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1.5px solid #111',
    fontSize: '1rem',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 400, border: '1.5px solid #111' }}>
        <div style={{ borderBottom: '1.5px solid #111', padding: '14px 20px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666' }}>
          Set a New Password
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
            Your institute issued a temporary password. Set a new one before continuing.
          </p>
          <div>
            <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', display: 'block', marginBottom: 6 }}>
              Current (Temporary) Password
            </label>
            <input style={inputStyle} type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', display: 'block', marginBottom: 6 }}>
              New Password
            </label>
            <input style={inputStyle} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', display: 'block', marginBottom: 6 }}>
              Confirm New Password
            </label>
            <input style={inputStyle} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          {error && (
            <div style={{ background: '#A32D2D', color: '#FCEBEB', padding: '10px 12px', fontSize: 13 }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ background: '#111', color: '#fff', border: 'none', padding: '14px', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}
          >
            {loading ? 'Saving...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
