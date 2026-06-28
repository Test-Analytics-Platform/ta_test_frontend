import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loginStudent } from '../api/sessions.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await loginStudent(studentId, password)
      login(data)
      navigate('/assigned')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400, border: '1.5px solid #111' }}>
        <div
          style={{
            borderBottom: '1.5px solid #111',
            padding: '14px 20px',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#666',
          }}
        >
          Pariksha — Student Login
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', display: 'block', marginBottom: 6 }}>
              Student ID
            </label>
            <input
              style={inputStyle}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. stu001abc"
              required
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <div>
            <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div style={{ background: '#A32D2D', color: '#FCEBEB', padding: '10px 12px', fontSize: 13 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#111',
              color: '#fff',
              border: 'none',
              padding: '14px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
