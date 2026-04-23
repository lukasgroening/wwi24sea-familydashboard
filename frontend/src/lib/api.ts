import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      // Optional: Ein Redirect ist hier meist nicht mehr nötig, da der AuthGuard 
      // reaktiv auf den nun leeren Store (token = null) reagiert.
    }
    return Promise.reject(err)
  }
)

export default api
