import katex from 'katex'

function renderMath(text) {
  if (!text) return ''
  return text
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
      } catch {
        return '[math]'
      }
    })
}

// state: 'default' | 'selected' | 'correct' | 'wrong'
export default function OptionButton({ label, text, hasImage, imageUrl, state = 'default', onClick }) {
  const styles = {
    default: { background: '#fff', color: '#111', border: '1.5px solid #111' },
    selected: { background: '#0F6E56', color: '#fff', border: '1.5px solid #0F6E56' },
    correct: { background: '#085041', color: '#fff', border: '1.5px solid #085041' },
    wrong: { background: '#A32D2D', color: '#fff', border: '1.5px solid #A32D2D' },
  }

  const { background, color, border } = styles[state] || styles.default
  const renderedText = renderMath(text || '')

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        width: '100%',
        padding: '12px 14px',
        background,
        color,
        border,
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left',
        fontSize: '0.95rem',
        lineHeight: 1.6,
        marginBottom: 8,
      }}
    >
      <span style={{ fontWeight: 700, minWidth: 20, flexShrink: 0 }}>{label}.</span>
      <span dangerouslySetInnerHTML={{ __html: renderedText }} />
      {hasImage && imageUrl && (
        <img
          src={imageUrl}
          alt={`Option ${label}`}
          style={{ maxWidth: 200, marginLeft: 'auto', border: '1px solid rgba(255,255,255,0.3)' }}
        />
      )}
    </button>
  )
}
