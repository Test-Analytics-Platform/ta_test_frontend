// Normalizes NTA-paper sessions (Pariksha PYQ/practice) and custom-test sessions
// (teacher-assigned tests) behind one interface so TestInterface.jsx doesn't need
// to know which backend pipeline it's talking to. Both produce the same session/
// question/option shape; only the underlying paper_id vs test_id differs.
import { getSession, saveResponse, toggleFlag, submitSession, getSessionResponses } from './sessions.js'
import { getPaperQuestions, getPaperDetail } from './papers.js'
import {
  getCustomSession,
  saveCustomResponse,
  toggleCustomFlag,
  submitCustomSession,
  getCustomSessionResponses,
  getCustomSessionQuestions,
} from './customTestSessions.js'

export function makeSessionAdapter(sessionType) {
  if (sessionType === 'custom') {
    return {
      getSession: getCustomSession,
      getSessionResponses: getCustomSessionResponses,
      saveResponse: saveCustomResponse,
      toggleFlag: toggleCustomFlag,
      submitSession: submitCustomSession,
      getQuestions: (session) => getCustomSessionQuestions(session.session_id),
      getPaperLabel: (session) => session.title ?? 'Custom Test',
    }
  }
  return {
    getSession,
    getSessionResponses,
    saveResponse,
    toggleFlag,
    submitSession,
    getQuestions: (session) => getPaperQuestions(session.paper_id),
    getPaperDetail: (session) => getPaperDetail(session.paper_id),
    getPaperLabel: (_session, paper) => paper,
  }
}
