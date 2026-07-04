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

// Module-level: collapses concurrent 401s into one refresh call
let refreshPromise = null

function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem('ta_test_auth') || 'null')
  } catch {
    return null
  }
}

function persistNewTokens(data) {
  try {
    const current = getStoredAuth() || {}
    const next = { ...current, access_token: data.access_token, refresh_token: data.refresh_token }
    localStorage.setItem('ta_test_auth', JSON.stringify(next))
    // Notify AuthContext without a circular import
    window.dispatchEvent(new CustomEvent('ta:tokens-updated', { detail: next }))
  } catch {
    // ignore
  }
}

function triggerLogout() {
  localStorage.removeItem('ta_test_auth')
  window.dispatchEvent(new CustomEvent('ta:logout'))
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retried) {
      return Promise.reject(error)
    }
    original._retried = true

    const stored = getStoredAuth()
    if (!stored?.refresh_token) {
      triggerLogout()
      return Promise.reject(error)
    }

    if (!refreshPromise) {
      refreshPromise = axios
        .post(`${API_BASE}/auth/refresh`, { refresh_token: stored.refresh_token })
        .then((res) => {
          persistNewTokens(res.data)
          return res.data.access_token
        })
        .catch((err) => {
          triggerLogout()
          return Promise.reject(err)
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const newAccessToken = await refreshPromise
    original.headers['Authorization'] = `Bearer ${newAccessToken}`
    return client(original)
  },
)

export default client
