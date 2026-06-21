import { useEffect, useState } from 'react'
import { getStudentSessions } from '../api/sessions.js'

// paper_id -> { count, bestScore, bestMax } for completed (submitted/timed_out) attempts only —
// an active (in-progress) session doesn't count as "attempted" here.
export function useAttemptsByPaper(studentId) {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    if (!studentId) return
    getStudentSessions(studentId).then(setSessions).catch(() => {})
  }, [studentId])

  const attemptsByPaper = {}
  for (const s of sessions) {
    if (s.status !== 'submitted' && s.status !== 'timed_out') continue
    const cur = attemptsByPaper[s.paper_id] ?? { count: 0, bestScore: null, bestMax: null }
    cur.count += 1
    if (s.score_total != null && (cur.bestScore == null || s.score_total > cur.bestScore)) {
      cur.bestScore = s.score_total
      cur.bestMax = s.score_max
    }
    attemptsByPaper[s.paper_id] = cur
  }

  return attemptsByPaper
}
