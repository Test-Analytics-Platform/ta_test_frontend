import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = localStorage.getItem('ta_test_auth')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback((tokenData) => {
    localStorage.setItem('ta_test_auth', JSON.stringify(tokenData))
    setAuth(tokenData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ta_test_auth')
    setAuth(null)
  }, [])

  // Listen for token refresh and forced logout events dispatched by the axios interceptor
  useEffect(() => {
    function onTokensUpdated(e) {
      setAuth(e.detail)
    }
    function onLogout() {
      setAuth(null)
    }
    window.addEventListener('ta:tokens-updated', onTokensUpdated)
    window.addEventListener('ta:logout', onLogout)
    return () => {
      window.removeEventListener('ta:tokens-updated', onTokensUpdated)
      window.removeEventListener('ta:logout', onLogout)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
