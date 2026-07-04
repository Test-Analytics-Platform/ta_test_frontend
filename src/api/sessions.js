import client from './client.js'

export async function startSession(paperId, studentId) {
  const { data } = await client.post('/test-sessions', {
    paper_id: paperId,
    student_id: studentId,
  })
  return data
}

export async function getSession(sessionId) {
  const { data } = await client.get(`/test-sessions/${sessionId}`)
  return data
}

export async function submitSession(sessionId, { terminatedBy } = {}) {
  const { data } = await client.post(`/test-sessions/${sessionId}/submit`, {
    terminated_by: terminatedBy ?? null,
  })
  return data
}

export async function warnTabSwitch(sessionId) {
  const { data } = await client.post(`/test-sessions/${sessionId}/warn`)
  return data
}

export async function getStudentSessions(studentId) {
  const { data } = await client.get(`/test-sessions/student/${studentId}`)
  return data
}

export async function saveResponse(sessionId, questionId, selectedOption, timeSpentSecs) {
  const { data } = await client.put(
    `/session-responses/${sessionId}/${questionId}`,
    { selected_option: selectedOption, time_spent_secs: timeSpentSecs },
  )
  return data
}

export async function toggleFlag(sessionId, questionId) {
  const { data } = await client.put(
    `/session-responses/${sessionId}/${questionId}/flag`,
  )
  return data
}

export async function getSessionResponses(sessionId) {
  const { data } = await client.get(`/session-responses/${sessionId}`)
  return data
}

export async function getSessionReview(sessionId) {
  const { data } = await client.get(`/test-sessions/${sessionId}/review`)
  return data
}

export async function loginStudent(studentId, password) {
  const { data } = await client.post('/auth/student-login', {
    student_id: studentId,
    password,
  })
  return data
}
