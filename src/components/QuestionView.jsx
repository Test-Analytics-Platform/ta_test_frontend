import { useRef } from 'react'
import katex from 'katex'

function renderMath(text) {
  if (!text) return ''
  // Replace \[ ... \] with block math and \( ... \) with inline math
  let html = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
      try {
        return `<div class="katex-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`
      } catch {
        return `<div>[math error]</div>`
      }
    })
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
      } catch {
        return `[math]`
      }
    })
  return html
}

export default function QuestionView({ question, questionNumber }) {
  const textRef = useRef(null)

  // dangerouslySetInnerHTML is safe here: content comes from our own DB parsed by Claude
  const renderedText = renderMath(question.question_text || '')

  return (
    <div>
      {/* Question text */}
      <div
        ref={textRef}
        style={{ fontSize: '1rem', lineHeight: 1.8, marginBottom: 20, color: '#111' }}
        dangerouslySetInnerHTML={{ __html: renderedText }}
      />

      {/* Question image */}
      {question.has_image && question.image_url && (
        <img
          src={question.image_url}
          alt={`Q${questionNumber} diagram`}
          style={{
            maxWidth: '100%',
            border: '1.5px solid #111',
            marginBottom: 20,
            display: 'block',
          }}
        />
      )}

      {/* Marks info */}
      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
        {question.marks_correct != null && (
          <span style={{ color: '#085041', marginRight: 12 }}>
            +{question.marks_correct} correct
          </span>
        )}
        {question.marks_wrong != null && (
          <span style={{ color: '#A32D2D' }}>
            {question.marks_wrong} wrong
          </span>
        )}
        {['adv_multi_2026', 'adv_multi_partial'].includes(question.scoring_rule) && (
          <span style={{ color: '#854F0B' }}>Partial credit applies for correct subsets</span>
        )}
        {question.scoring_rule === 'bonus_all' && (
          <span style={{ color: '#085041' }}>Bonus question: full marks awarded</span>
        )}
      </div>
    </div>
  )
}
