import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { auth } = useAuth()
  const location = useLocation()
  if (!auth) return <Navigate to="/login" replace />
  if (auth.must_reset_password && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />
  }
  return children
}
