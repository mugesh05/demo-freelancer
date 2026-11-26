const TOKEN_KEY = 'skillrora_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function api(path, options = {}) {
  const token = getToken()
  const headers = { ...(options.headers || {}) }

  const isForm = options.body instanceof FormData
  if (!isForm && options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(path.startsWith('/') ? path : `/${path}`, {
    ...options,
    headers,
    body: !isForm && options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}
