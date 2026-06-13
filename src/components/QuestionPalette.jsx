export default function QuestionPalette({ questions, responses, visited, currentIndex, onJump, compact = false }) {
  const sections = []
  const sectionMap = {}
  questions.forEach((q, idx) => {
    const sub = q.subject || 'General'
    if (!sectionMap[sub]) {
      sectionMap[sub] = { name: sub, items: [] }
      sections.push(sectionMap[sub])
    }
    sectionMap[sub].items.push({ q, idx })
  })

  const btnSize = compact ? 44 : 40

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Overall progress */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #e0e0e0',
          fontSize: 12,
          color: '#555',
          background: '#fafafa',
          flexShrink: 0,
        }}
      >
        {(() => {
          const answered = questions.filter((q) => responses[q.question_id]?.selected_option != null).length
          const flagged = questions.filter((q) => responses[q.question_id]?.is_flagged).length
          const remaining = questions.length - answered
          return (
            <div style={{ display: 'flex', gap: 14 }}>
              <span><b style={{ color: '#085041' }}>{answered}</b> answered</span>
              {flagged > 0 && <span><b style={{ color: '#854F0B' }}>{flagged}</b> flagged</span>}
              <span style={{ color: '#aaa' }}>{remaining} left</span>
            </div>
          )
        })()}
      </div>

      {/* Sections */}
      <div style={{ flex: 1 }}>
        {sections.map(({ name, items }) => {
          const answeredCount = items.filter(({ q }) => responses[q.question_id]?.selected_option != null).length
          return (
            <div key={name}>
              <div
                style={{
                  padding: '8px 14px',
                  background: '#f0f0f0',
                  borderTop: '1px solid #ddd',
                  borderBottom: '1px solid #ddd',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#333',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{name}</span>
                <span style={{ fontWeight: 600, color: answeredCount === items.length ? '#085041' : '#666' }}>
                  {answeredCount}/{items.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px' }}>
                {items.map(({ q, idx }) => {
                  const resp = responses[q.question_id] || {}
                  const isCurrent = idx === currentIndex
                  const isAnswered = resp.selected_option != null
                  const isFlagged = resp.is_flagged
                  const isVisited = visited?.has(idx)

                  let bg = '#fff', color = '#999', border = '1.5px solid #ccc'
                  if (isCurrent) {
                    bg = '#111'; color = '#fff'; border = '1.5px solid #111'
                  } else if (isFlagged) {
                    bg = '#854F0B'; color = '#fff'; border = '1.5px solid #854F0B'
                  } else if (isAnswered) {
                    bg = '#0F6E56'; color = '#fff'; border = '1.5px solid #0F6E56'
                  } else if (isVisited) {
                    border = '1.5px solid #A32D2D'; color = '#A32D2D'
                  }

                  return (
                    <button
                      key={q.question_id}
                      onClick={() => onJump(idx)}
                      title={`Q${q.question_number}${q.subject ? ` · ${q.subject}` : ''}`}
                      style={{
                        width: btnSize,
                        height: btnSize,
                        background: bg,
                        color,
                        border,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {q.question_number}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #ddd', flexShrink: 0, background: '#fafafa' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: 8 }}>
          Legend
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
          {[
            { bg: '#0F6E56', border: 'none', color: '#fff', label: 'Answered' },
            { bg: '#854F0B', border: 'none', color: '#fff', label: 'Marked' },
            { bg: '#fff', border: '1.5px solid #A32D2D', color: '#A32D2D', label: 'Not Answered' },
            { bg: '#fff', border: '1.5px solid #ccc', color: '#999', label: 'Not Visited' },
          ].map(({ bg, border, color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, background: bg, border, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#444' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
