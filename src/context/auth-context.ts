import { createContext, useContext } from 'react'
import type { LoginRequires2fa, User } from '../types/api'

export interface RegisterInput {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface AuthValue {
  user: User | null
  /** True while the stored session is being restored (profile fetch). */
  loading: boolean
  login: (email: string, password: string) => Promise<LoginRequires2fa>
  verify2fa: (email: string, code: string) => Promise<void>
  register: (input: RegisterInput) => Promise<User>
  verifyEmail: (email: string, code: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
  resend2fa: (email: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
}

/** Lives in its own module so the provider file only exports a component. */
export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
