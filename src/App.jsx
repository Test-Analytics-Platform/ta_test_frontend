import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import AssignedTests from './pages/AssignedTests.jsx'
import TestInterface from './pages/TestInterface.jsx'
import TestResult from './pages/TestResult.jsx'
import TestHistory from './pages/TestHistory.jsx'
import ForcePasswordReset from './pages/ForcePasswordReset.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/reset-password"
            element={<ProtectedRoute><ForcePasswordReset /></ProtectedRoute>}
          />
          <Route
            path="/assigned"
            element={<ProtectedRoute><AssignedTests /></ProtectedRoute>}
          />
          <Route
            path="/test/:sessionId"
            element={<ProtectedRoute><TestInterface /></ProtectedRoute>}
          />
          <Route
            path="/result/:sessionId"
            element={<ProtectedRoute><TestResult /></ProtectedRoute>}
          />
          <Route
            path="/history"
            element={<ProtectedRoute><TestHistory /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/assigned" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
