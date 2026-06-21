import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startSession } from '../api/sessions.js'

// Shared begin-test flow for any paper kind (real PYQ, subject/topic practice, generated mock).
// The backend only blocks a new session if the student already has an ACTIVE one on the
// same paper_id — a completed/timed-out session never blocks a fresh attempt.
export function useStartTest(studentId) {
  const navigate = useNavigate()
  const [instructionsFor, setInstructionsFor] = useState(null)
  const [error, setError] = useState(null)

  async function handleBeginTest() {
    if (!instructionsFor) return
    setError(null)
    try {
      const session = await startSession(instructionsFor.paper_id, studentId)
      navigate(`/test/${session.session_id}`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to start test'
      if (msg.startsWith('Active session already exists:')) {
        const sid = msg.split(': ')[1]
        navigate(`/test/${sid}`)
      } else {
        setInstructionsFor(null)
        setError(msg)
      }
    }
  }

  return { instructionsFor, setInstructionsFor, error, setError, handleBeginTest }
}
