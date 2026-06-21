import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getPapers, getPracticeFilters } from '../api/papers.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { useStartTest } from '../hooks/useStartTest.js'
import { useAttemptsByPaper } from '../hooks/useAttemptsByPaper.js'
import InstructionsModal from '../components/InstructionsModal.jsx'
import TopBar from '../components/TopBar.jsx'

const EXAM_LABELS = { JEE_MAINS: 'JEE Mains', JEE_ADV: 'JEE Advanced', NEET: 'NEET UG' }
const STUDENT_EXAM_MAP = { JEE: ['JEE_MAINS', 'JEE_ADV'], NEET: ['NEET'] }
const SECTIONS = [
  { key: 'mock', label: 'Full Mocks' },
  { key: 'subject', label: 'Subject Tests' },
  { key: 'topic', label: 'Topic Practice' },
]
const SECTION_KEYS = SECTIONS.map((s) => s.key)

function chipStyle(active, isMobile) {
  return {
    padding: isMobile ? '8px 14px' : '6px 14px',
    border: '1.5px solid #111',
    borderRight: 'none',
    background: active ? '#111' : '#fff',
    color: active ? '#fff' : '#111',
    fontSize: isMobile ? 12 : 11,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  }
}

function PaperCard({ p, name, subLabel, attempt, onStart, isMobile }) {
  const bestPct = attempt?.bestScore != null && attempt.bestMax
    ? Math.round((attempt.bestScore / attempt.bestMax) * 100)
    : null
  return (
    <div
      style={{
        padding: isMobile ? '16px' : '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        border: '1.5px solid #111',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{name}</div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#555' }}>
        {subLabel && <span>{subLabel}</span>}
        {p.total_questions && <span>{p.total_questions} Qs</span>}
        {p.total_marks && <span>{p.total_marks} marks</span>}
        {p.duration_mins && <span>{p.duration_mins} min</span>}
      </div>
      {attempt && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, background: '#085041', color: '#E1F5EE', padding: '2px 7px' }}>
            ✓ Attempted
          </span>
          <span style={{ fontSize: 12, color: '#666' }}>
            {attempt.count} attempt{attempt.count !== 1 ? 's' : ''}
            {bestPct != null && ` · Best ${bestPct}%`}
          </span>
        </div>
      )}
      <button
        onClick={onStart}
        style={{
          marginTop: 4,
          background: attempt ? '#fff' : '#0F6E56',
          color: attempt ? '#0F6E56' : '#fff',
          border: attempt ? '1.5px solid #0F6E56' : 'none',
          padding: isMobile ? '12px 0' : '9px 0',
          fontSize: isMobile ? 13 : 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {attempt ? 'Retake Test' : 'Start Test'}
      </button>
    </div>
  )
}

function PaperGrid({ papers, isMobile, children }) {
  if (papers.length === 0) {
    return <div style={{ color: '#666', fontSize: 14, padding: '32px 0' }}>Nothing here yet.</div>
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: -1 }}>
      {children}
    </div>
  )
}

function FullMocksSection({ exam, studentId, attemptsByPaper, onStart, isMobile, loading, setLoading, papers, setPapers }) {
  useEffect(() => {
    if (!exam) return
    setLoading(true)
    getPapers({ student_id: studentId, exam, paper_kind: 'generated_mock' })
      .then((rows) => setPapers([...rows].sort((a, b) => Number(a.shift) - Number(b.shift))))
      .finally(() => setLoading(false))
  }, [exam, studentId])

  if (loading) return <div style={{ color: '#666', fontSize: 14, padding: '32px 0' }}>Loading...</div>
  return (
    <PaperGrid papers={papers} isMobile={isMobile}>
      {papers.map((p) => (
        <PaperCard
          key={p.paper_id}
          p={p}
          name={`Full Mock #${p.shift}`}
          subLabel={EXAM_LABELS[p.exam] || p.exam}
          attempt={attemptsByPaper[p.paper_id]}
          onStart={() => onStart(p)}
          isMobile={isMobile}
        />
      ))}
    </PaperGrid>
  )
}

function SubjectTestsSection({ exam, studentId, attemptsByPaper, onStart, isMobile }) {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!exam) return
    setLoading(true)
    getPapers({ student_id: studentId, exam, paper_kind: 'subject_test' })
      .then(setPapers)
      .finally(() => setLoading(false))
  }, [exam, studentId])

  if (loading) return <div style={{ color: '#666', fontSize: 14, padding: '32px 0' }}>Loading...</div>

  const bySubject = {}
  for (const p of papers) {
    (bySubject[p.filter_subject] ??= []).push(p)
  }
  for (const subject in bySubject) {
    // shift looks like "CHE1", "CHE10", "CHE2" — sort by the trailing number, not lexicographically
    bySubject[subject].sort((a, b) => parseInt(a.shift.match(/\d+$/)) - parseInt(b.shift.match(/\d+$/)))
  }

  if (Object.keys(bySubject).length === 0) {
    return <div style={{ color: '#666', fontSize: 14, padding: '32px 0' }}>Nothing here yet.</div>
  }

  return (
    <div>
      {Object.entries(bySubject).map(([subject, subjectPapers]) => (
        <div key={subject} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            {subject}
          </div>
          <PaperGrid papers={subjectPapers} isMobile={isMobile}>
            {subjectPapers.map((p, i) => (
              <PaperCard
                key={p.paper_id}
                p={p}
                name={`${subject} Test #${i + 1}`}
                attempt={attemptsByPaper[p.paper_id]}
                onStart={() => onStart(p)}
                isMobile={isMobile}
              />
            ))}
          </PaperGrid>
        </div>
      ))}
    </div>
  )
}

function TopicPracticeSection({
  exam,
  studentId,
  attemptsByPaper,
  onStart,
  isMobile,
  initialSubject,
  initialTopic,
  initialSubtopic,
  onTopicParamsChange,
}) {
  const [tree, setTree] = useState({})
  const [subject, setSubject] = useState(initialSubject || null)
  const [topic, setTopic] = useState(initialTopic || null)
  const [subtopic, setSubtopic] = useState(initialSubtopic || null)
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!exam) return
    getPracticeFilters(exam).then((data) => setTree(data.subjects ?? {}))
  }, [exam])

  useEffect(() => {
    setSubject(initialSubject || null)
    setTopic(initialTopic || null)
    setSubtopic(initialSubtopic || null)
  }, [initialSubject, initialTopic, initialSubtopic])

  useEffect(() => {
    if (!subject || !topic) {
      setPapers([])
      return
    }
    setLoading(true)
    getPapers({
      student_id: studentId,
      exam,
      paper_kind: 'topic_test',
      filter_subject: subject,
      filter_topic: topic,
      ...(subtopic ? { filter_subtopic: subtopic } : {}),
    })
      .then((rows) => setPapers(subtopic ? rows : rows.filter((p) => !p.filter_subtopic)))
      .finally(() => setLoading(false))
  }, [exam, subject, topic, subtopic, studentId])

  const subjects = Object.keys(tree).sort()
  const topics = subject ? (tree[subject] ?? []) : []
  const subtopics = topic ? (topics.find((t) => t.topic === topic)?.sub_topics ?? []) : []

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 6 }}>Subject</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSubject(s)
                setTopic(null)
                setSubtopic(null)
                onTopicParamsChange({ subject: s, topic: null, subtopic: null })
              }}
              style={{ ...chipStyle(subject === s, isMobile), borderRight: '1.5px solid #111' }}
            >
              {s}
            </button>
          ))}
          {subjects.length === 0 && <span style={{ fontSize: 13, color: '#888' }}>No topics tagged for this exam yet.</span>}
        </div>
      </div>

      {subject && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 6 }}>Topic</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {topics.map((t) => (
              <button
                key={t.topic}
                onClick={() => {
                  setTopic(t.topic)
                  setSubtopic(null)
                  onTopicParamsChange({ subject, topic: t.topic, subtopic: null })
                }}
                style={{ ...chipStyle(topic === t.topic, isMobile), borderRight: '1.5px solid #111' }}
              >
                {t.topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {topic && subtopics.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 6 }}>
            Sub-topic (optional — narrows further)
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setSubtopic(null)
                onTopicParamsChange({ subject, topic, subtopic: null })
              }}
              style={{ ...chipStyle(!subtopic, isMobile), borderRight: '1.5px solid #111' }}
            >
              All of {topic}
            </button>
            {subtopics.map((st) => (
              <button
                key={st}
                onClick={() => {
                  setSubtopic(st)
                  onTopicParamsChange({ subject, topic, subtopic: st })
                }}
                style={{ ...chipStyle(subtopic === st, isMobile), borderRight: '1.5px solid #111' }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {topic && (
        loading ? (
          <div style={{ color: '#666', fontSize: 14, padding: '16px 0' }}>Loading...</div>
        ) : (
          <PaperGrid papers={papers} isMobile={isMobile}>
            {papers.map((p) => (
              <PaperCard
                key={p.paper_id}
                p={p}
                name={p.filter_subtopic || p.filter_topic}
                subLabel={p.filter_subtopic ? p.filter_topic : subject}
                attempt={attemptsByPaper[p.paper_id]}
                onStart={() => onStart(p)}
                isMobile={isMobile}
              />
            ))}
          </PaperGrid>
        )
      )}
    </div>
  )
}

export default function PracticeTests() {
  const { auth } = useAuth()
  const isMobile = useIsMobile()
  const allowedExams = STUDENT_EXAM_MAP[auth?.exam] || []
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedExam = searchParams.get('exam')
  const requestedSection = searchParams.get('section')
  const [exam, setExam] = useState(
    allowedExams.includes(requestedExam) ? requestedExam : allowedExams[0] ?? null,
  )
  const [section, setSection] = useState(
    SECTION_KEYS.includes(requestedSection) ? requestedSection : 'mock',
  )
  const [mockPapers, setMockPapers] = useState([])
  const [mockLoading, setMockLoading] = useState(true)

  const { instructionsFor, setInstructionsFor, error, handleBeginTest } = useStartTest(auth?.student_id)
  const attemptsByPaper = useAttemptsByPaper(auth?.student_id)

  const setPracticeParams = useCallback((updates) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!allowedExams.length) return
    if (!exam || !allowedExams.includes(exam)) {
      const fallback = allowedExams[0]
      setExam(fallback)
      setPracticeParams({ exam: fallback, subject: null, topic: null, subtopic: null })
    }
  }, [allowedExams, exam, setPracticeParams])

  const handleExamChange = useCallback((nextExam) => {
    setExam(nextExam)
    setPracticeParams({ exam: nextExam, subject: null, topic: null, subtopic: null })
  }, [setPracticeParams])

  const handleSectionChange = useCallback((nextSection) => {
    setSection(nextSection)
    setPracticeParams({
      section: nextSection,
      ...(nextSection === 'topic' ? {} : { subject: null, topic: null, subtopic: null }),
    })
  }, [setPracticeParams])

  const handleTopicParamsChange = useCallback((updates) => {
    setPracticeParams(updates)
  }, [setPracticeParams])

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <TopBar isMobile={isMobile} />

      <div style={{ padding: isMobile ? '16px' : '24px' }}>
        <div style={{ marginBottom: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666' }}>
          Practice From the Question Bank
        </div>

        {allowedExams.length > 1 && (
          <div style={{ overflowX: 'auto', marginBottom: 16, WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'flex', borderRight: '1.5px solid #111', width: 'max-content' }}>
              {allowedExams.map((e) => (
                <button key={e} style={chipStyle(exam === e, isMobile)} onClick={() => handleExamChange(e)}>
                  {EXAM_LABELS[e] || e}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto', marginBottom: 20, WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', borderRight: '1.5px solid #111', width: 'max-content' }}>
            {SECTIONS.map((s) => (
              <button key={s.key} style={chipStyle(section === s.key, isMobile)} onClick={() => handleSectionChange(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#A32D2D', color: '#FCEBEB', padding: '10px 12px', marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {!exam ? (
          <div style={{ color: '#666', fontSize: 14, padding: '32px 0' }}>No exam configured for this account.</div>
        ) : section === 'mock' ? (
          <FullMocksSection
            exam={exam}
            studentId={auth?.student_id}
            attemptsByPaper={attemptsByPaper}
            onStart={setInstructionsFor}
            isMobile={isMobile}
            loading={mockLoading}
            setLoading={setMockLoading}
            papers={mockPapers}
            setPapers={setMockPapers}
          />
        ) : section === 'subject' ? (
          <SubjectTestsSection
            exam={exam}
            studentId={auth?.student_id}
            attemptsByPaper={attemptsByPaper}
            onStart={setInstructionsFor}
            isMobile={isMobile}
          />
        ) : (
          <TopicPracticeSection
            exam={exam}
            studentId={auth?.student_id}
            attemptsByPaper={attemptsByPaper}
            onStart={setInstructionsFor}
            isMobile={isMobile}
            initialSubject={searchParams.get('subject')}
            initialTopic={searchParams.get('topic')}
            initialSubtopic={searchParams.get('subtopic')}
            onTopicParamsChange={handleTopicParamsChange}
          />
        )}
      </div>

      {instructionsFor && (
        <InstructionsModal
          paper={instructionsFor}
          title={
            instructionsFor.paper_kind === 'generated_mock'
              ? `Full Mock #${instructionsFor.shift}`
              : instructionsFor.filter_subtopic || instructionsFor.filter_topic || instructionsFor.filter_subject
          }
          onClose={() => setInstructionsFor(null)}
          onBegin={handleBeginTest}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}
