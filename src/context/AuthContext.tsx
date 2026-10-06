import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import { tokens } from '../lib/tokens'
import type { LoginRequires2fa, Role, TokenPair, User } from '../types/api'
import { AuthContext, type AuthValue, type RegisterInput } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore the session on reload: /users/me goes through the client, so an
  // expired access token is refreshed transparently before giving up.
  useEffect(() => {
    let cancelled = false
    async function restore() {
      if (!tokens.getRefresh()) {
        setLoading(false)
        return
      }
      try {
        const me = await api<User>('/users/me')
        if (!cancelled) setUser(me)
      } catch {
        tokens.clear()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    return api<LoginRequires2fa>('/users/login', {
      method: 'POST',
      form: new URLSearchParams({ username: email, password }),
      retry: false,
    })
  }, [])

  const verify2fa = useCallback(async (email: string, code: string) => {
    const pair = await api<TokenPair>('/users/verify-2fa', {
      method: 'POST',
      json: { email, code },
      retry: false,
    })
    tokens.set(pair)
    const me = await api<User>('/users/me')
    setUser(me)
  }, [])

  const demoLogin = useCallback(async (role: Role) => {
    const pair = await api<TokenPair>('/users/demo-login', {
      method: 'POST',
      json: { role },
      retry: false,
    })
    tokens.set(pair)
    const me = await api<User>('/users/me')
    setUser(me)
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    return api<User>('/users/', { method: 'POST', json: input })
  }, [])

  const verifyEmail = useCallback(async (email: string, code: string) => {
    await api('/users/verify-email', { method: 'POST', json: { email, code }, retry: false })
  }, [])

  const resendVerification = useCallback(async (email: string) => {
    await api('/users/resend-verification', { method: 'POST', json: { email }, retry: false })
  }, [])

  const resend2fa = useCallback(async (email: string) => {
    await api('/users/resend-2fa', { method: 'POST', json: { email }, retry: false })
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    await api('/users/forgot-password', { method: 'POST', json: { email }, retry: false })
  }, [])

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await api('/users/reset-password', {
      method: 'POST',
      json: { email, code, new_password: newPassword },
      retry: false,
    })
  }, [])

  const logout = useCallback(async () => {
    const refresh_token = tokens.getRefresh()
    tokens.clear()
    setUser(null)
    if (!refresh_token) return
    // Best effort: the session is already gone locally either way.
    try {
      await api('/users/logout', {
        method: 'POST',
        json: { refresh_token },
        retry: false,
      })
    } catch {
      // Revoked or expired server-side: nothing else to do.
    }
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      login,
      verify2fa,
      demoLogin,
      register,
      verifyEmail,
      resendVerification,
      resend2fa,
      forgotPassword,
      resetPassword,
      logout,
    }),
    [
      user,
      loading,
      login,
      verify2fa,
      demoLogin,
      register,
      verifyEmail,
      resendVerification,
      resend2fa,
      forgotPassword,
      resetPassword,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
