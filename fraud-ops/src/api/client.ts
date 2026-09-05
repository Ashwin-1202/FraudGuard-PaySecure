import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError('The backend did not respond in time.'))
    }
    if (error.response) {
      const detail = error.response.data?.detail || error.response.data?.message
      return Promise.reject(
        new ApiError(detail || `Request failed with status ${error.response.status}`, error.response.status)
      )
    }
    if (error.request) {
      return Promise.reject(
        new ApiError('Unable to reach the fraud detection backend. Check that it is running on port 8000.')
      )
    }
    return Promise.reject(new ApiError(error.message || 'Unexpected error contacting the backend.'))
  }
)
