import client from './client.js'

// Unified assigned-tests list across all test types (custom + pyq/mock/subject/topic).
// Each item carries a `type` discriminator and a `target_id` (test_id for custom,
// paper_id for paper types) so the caller can branch its start flow.
export async function getAssignedTests(studentId) {
  const { data } = await client.get(`/assignments/student/${studentId}`)
  return data
}
