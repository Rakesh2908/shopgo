import { apiGet, apiPost } from './client'
import type { AuthTokens, User } from '@/types'

export interface RegisterData {
  email: string
  password: string
  fullName: string
}

export interface LoginData {
  email: string
  password: string
}

/**
 * Register a new user.
 */
export async function register(data: RegisterData): Promise<User> {
  return apiPost<User>('/auth/register', data)
}

/**
 * Log in with email and password. Returns access token; refresh token is set via httpOnly cookie.
 */
export async function login(data: LoginData): Promise<AuthTokens> {
  return apiPost<AuthTokens>('/auth/login', data)
}

/**
 * Refresh the access token using the httpOnly refresh cookie.
 */
export async function refreshToken(): Promise<AuthTokens> {
  return apiPost<AuthTokens>('/auth/refresh')
}

/**
 * Log out and invalidate the refresh token.
 */
export async function logout(): Promise<void> {
  await apiPost<void>('/auth/logout')
}

/**
 * Get the currently authenticated user.
 */
export async function getMe(): Promise<User> {
  return apiGet<User>('/auth/me')
}
