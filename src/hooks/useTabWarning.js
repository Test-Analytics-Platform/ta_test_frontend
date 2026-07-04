import { useEffect, useRef, useCallback } from 'react'

const MAX_WARNINGS = 3

/**
 * Detects tab switches via the Page Visibility API and calls:
 *   onWarn(warningNumber)  — 1st and 2nd switch (show a dismissible banner)
 *   onTerminate()          — 3rd switch (auto-submit the test)
 *
 * active: pass false to disable the listener (e.g. before test loads or after submit).
 */
export function useTabWarning({ onWarn, onTerminate, active }) {
  const warningCountRef = useRef(0)
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  const handleVisibilityChange = useCallback(() => {
    if (!activeRef.current) return
    if (document.visibilityState !== 'hidden') return

    warningCountRef.current += 1
    const count = warningCountRef.current

    if (count >= MAX_WARNINGS) {
      onTerminate()
    } else {
      onWarn(count)
    }
  }, [onWarn, onTerminate])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [handleVisibilityChange])
}
