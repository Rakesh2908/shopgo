import axios from 'axios'
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios'

import type { ApiResponse, AuthTokens } from '@/types'

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const apiBaseUrl = `${import.meta.env.VITE_API_URL ?? ''}`.replace(/\/$/, '') + '/api/v1'

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
})

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
})

let refreshPromise: Promise<string> | null = null
/** When true, do not attempt refresh; reject 401s immediately (avoids storm after refresh fails). */
let isLoggingOut = false

function unwrapApiResponse<T>(payload: ApiResponse<T>): T {
  if (payload.success) return payload.data
  throw new Error(payload.error?.message ?? 'Request failed')
}

function setAuthorizationHeader(config: AxiosRequestConfig, accessToken: string) {
  const headers = (config.headers ?? {}) as Record<string, string>
  headers.Authorization = `Bearer ${accessToken}`
  config.headers = headers
}

async function getAuthStore() {
  return (await import('@/store/authStore')) as typeof import('@/store/authStore')
}

/** Returns true if this request is auth refresh or logout (no point retrying on 401). */
function isAuthEndpoint(config: InternalAxiosRequestConfig): boolean {
  const url = config.url ?? ''
  return url.includes('/auth/refresh') || url.includes('/auth/logout')
}

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await refreshClient.post<ApiResponse<AuthTokens>>('/auth/refresh')
      const tokens = unwrapApiResponse(res.data)
      if (!tokens.accessToken) throw new Error('Missing access token')
      const authStore = await getAuthStore()
      authStore.default.getState().setAccessToken(tokens.accessToken)
      return tokens.accessToken
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/** Run logout and redirect once; idempotent so many 401 handlers can call it safely. */
function performLogoutAndRedirect(): void {
  if (isLoggingOut) return
  isLoggingOut = true
  void getAuthStore().then((m) => m.default.getState().logout())
  window.location.assign('/login')
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const authStore = await getAuthStore()
  const accessToken = authStore.default.getState().accessToken
  if (accessToken) {
    setAuthorizationHeader(config, accessToken)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as AxiosError<ApiResponse<unknown>>
    const status = axiosError.response?.status
    const originalRequest = axiosError.config as RetryableRequestConfig | undefined

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }
    // Do not retry auth endpoints; refresh/logout 401 means session is invalid.
    if (isAuthEndpoint(originalRequest)) {
      return Promise.reject(error)
    }
    if (isLoggingOut) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const newToken = await refreshAccessToken()
      setAuthorizationHeader(originalRequest, newToken)
      return await api(originalRequest)
    } catch {
      performLogoutAndRedirect()
      return Promise.reject(error)
    }
  },
)

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<ApiResponse<T>>(url, config)
  return unwrapApiResponse(res.data)
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.post<ApiResponse<T>>(url, body, config)
  return unwrapApiResponse(res.data)
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.patch<ApiResponse<T>>(url, body, config)
  return unwrapApiResponse(res.data)
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete<ApiResponse<T>>(url, config)
  return unwrapApiResponse(res.data)
}

/** Resets the "logging out" guard so 401 responses can trigger refresh again after login. */
export function resetAuthFailureState(): void {
  isLoggingOut = false
}

export default api

