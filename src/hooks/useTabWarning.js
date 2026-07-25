import { useEffect, useRef, useCallback } from 'react'

const MAX_WARNINGS = 3
const STORAGE_PREFIX = 'pariksha_tab_warnings_'

function normalizeWarningCount(value) {
  const count = Number(value)
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
}

export function getPersistedTabWarningCount(sessionId) {
  if (!sessionId) return 0
  try {
    return normalizeWarningCount(sessionStorage.getItem(`${STORAGE_PREFIX}${sessionId}`))
  } catch {
    return 0
  }
}

function persistTabWarningCount(sessionId, count) {
  if (!sessionId) return
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${sessionId}`, String(normalizeWarningCount(count)))
  } catch {
    // The in-memory count still protects the current test when storage is unavailable.
  }
}

/**
 * Detects tab switches via the Page Visibility API and calls:
 *   onWarn(warningNumber)  — 1st and 2nd switch (show a dismissible banner)
 *   onTerminate()          — 3rd switch (auto-submit the test)
 *
 * active: pass false to disable the listener (e.g. before test loads or after submit).
 */
export function useTabWarning({ onWarn, onTerminate, active, sessionId, initialWarningCount = 0 }) {
  const warningCountRef = useRef(Math.max(
    normalizeWarningCount(initialWarningCount),
    getPersistedTabWarningCount(sessionId),
  ))
  const warningSessionRef = useRef(sessionId)
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const sessionChanged = warningSessionRef.current !== sessionId
    const restoredCount = Math.max(
      sessionChanged ? 0 : warningCountRef.current,
      normalizeWarningCount(initialWarningCount),
      getPersistedTabWarningCount(sessionId),
    )
    warningSessionRef.current = sessionId
    warningCountRef.current = restoredCount
    persistTabWarningCount(sessionId, restoredCount)
  }, [initialWarningCount, sessionId])

  const handleVisibilityChange = useCallback(() => {
    if (!activeRef.current) return
    if (document.visibilityState !== 'hidden') return

    warningCountRef.current += 1
    const count = warningCountRef.current
    persistTabWarningCount(sessionId, count)

    if (count >= MAX_WARNINGS) {
      onTerminate()
    } else {
      onWarn(count)
    }
  }, [onWarn, onTerminate, sessionId])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [handleVisibilityChange])
}
