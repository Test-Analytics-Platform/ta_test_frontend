import client from './client.js'

export async function getAssignedTests(studentId) {
  const { data } = await client.get(`/custom-test-sessions/student/${studentId}/assigned`)
  return data
}

export async function startCustomSession(assignmentId, studentId) {
  const { data } = await client.post('/custom-test-sessions', {
    assignment_id: assignmentId,
    student_id: studentId,
  })
  return data
}

export async function getCustomSession(sessionId) {
  const { data } = await client.get(`/custom-test-sessions/${sessionId}`)
  return data
}

export async function submitCustomSession(sessionId, { terminatedBy } = {}) {
  const { data } = await client.post(`/custom-test-sessions/${sessionId}/submit`, {
    terminated_by: terminatedBy ?? null,
  })
  return data
}

export async function warnCustomTabSwitch(sessionId, warningCount) {
  const body = warningCount == null ? undefined : { warning_count: warningCount }
  const { data } = await client.post(`/custom-test-sessions/${sessionId}/warn`, body)
  return data
}

export async function getCustomStudentSessions(studentId) {
  const { data } = await client.get(`/custom-test-sessions/student/${studentId}`)
  return data
}

export async function saveCustomResponse(sessionId, questionId, selectedOption, timeSpentSecs) {
  const { data } = await client.put(
    `/custom-test-sessions/${sessionId}/${questionId}`,
    { selected_option: selectedOption, time_spent_secs: timeSpentSecs },
  )
  return data
}

export async function toggleCustomFlag(sessionId, questionId) {
  const { data } = await client.put(`/custom-test-sessions/${sessionId}/${questionId}/flag`)
  return data
}

export async function getCustomSessionResponses(sessionId) {
  const { data } = await client.get(`/custom-test-sessions/${sessionId}/responses`)
  return data
}

export async function getCustomSessionReview(sessionId) {
  const { data } = await client.get(`/custom-test-sessions/${sessionId}/review`)
  return data
}

export async function getCustomSessionQuestions(sessionId) {
  const { data } = await client.get(`/custom-test-sessions/${sessionId}/questions`)
  return data
}
