import { useEffect, useState } from 'react'

export default function Timer({ startedAt, timeLimitMins, onExpire }) {
  const [secsLeft, setSecsLeft] = useState(null)

  useEffect(() => {
    if (!startedAt || !timeLimitMins) return

    const endMs = new Date(startedAt).getTime() + timeLimitMins * 60 * 1000

    function tick() {
      const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000))
      setSecsLeft(remaining)
      if (remaining === 0 && onExpire) onExpire()
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt, timeLimitMins, onExpire])

  if (secsLeft === null) return null

  const h = Math.floor(secsLeft / 3600)
  const m = Math.floor((secsLeft % 3600) / 60)
  const s = secsLeft % 60
  const label = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  const isCritical = secsLeft < 10 * 60
  const isWarning = secsLeft < 30 * 60 && !isCritical

  const bg = isCritical ? '#A32D2D' : isWarning ? '#854F0B' : '#111'
  const color = '#fff'

  return (
    <div
      style={{
        background: bg,
        color,
        fontFamily: 'monospace',
        fontSize: '1.1rem',
        fontWeight: 600,
        padding: '4px 14px',
        border: '1.5px solid #111',
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </div>
  )
}
