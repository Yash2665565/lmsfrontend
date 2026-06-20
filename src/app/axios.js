import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    // Never redirect on the login endpoint itself — that causes a reload
    // loop that wipes the network log before the request is even visible.
    const url = err.config?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/')
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Use React Router navigation (soft redirect) instead of a hard reload
      // so in-flight requests aren't cancelled and the network log is preserved.
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    return Promise.reject(err)
  }
)

export default api
