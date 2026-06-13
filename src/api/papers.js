import client from './client.js'

export async function getPapers(params = {}) {
  const { data } = await client.get('/nta-papers', { params })
  return data
}

export async function getPaperDetail(paperId) {
  const { data } = await client.get(`/nta-papers/${paperId}`)
  return data
}

export async function getPaperQuestions(paperId) {
  const { data } = await client.get(`/nta-papers/${paperId}/questions`)
  return data
}
