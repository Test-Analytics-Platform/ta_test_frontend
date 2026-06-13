import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const client = axios.create({ baseURL: API_BASE })

client.interceptors.request.use((config) => {
  const stored = localStorage.getItem('ta_test_auth')
  if (stored) {
    try {
      const { access_token } = JSON.parse(stored)
      if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`
      }
    } catch {
      // ignore
    }
  }
  return config
})

export default client
