import client from './client.js'

export async function getStudentMockAttempts(studentId) {
  const { data } = await client.get(`/mock-attempts/student/${studentId}`)
  return data
}
