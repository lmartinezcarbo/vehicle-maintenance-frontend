import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/auth-context'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import TwoFactorPage from './pages/auth/TwoFactorPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
      Loading…
    </main>
  )
}

/** Authed users skip the auth screens. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (user) return <Navigate to="/app" replace />
  return <>{children}</>
}

/** Everything under /app requires a session. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

/** Temporary home until F24 builds the real dashboard. */
function DashboardPlaceholder() {
  const { user } = useAuth()
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900">Welcome, {user?.name}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        You're signed in as <span className="font-medium">{user?.role}</span>. The dashboard lands
        in F24.
      </p>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      {/* Auth: F23 */}
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route
        path="/verify-email"
        element={
          <GuestOnly>
            <VerifyEmailPage />
          </GuestOnly>
        }
      />
      <Route
        path="/2fa"
        element={
          <GuestOnly>
            <TwoFactorPage />
          </GuestOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestOnly>
            <ForgotPasswordPage />
          </GuestOnly>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestOnly>
            <ResetPasswordPage />
          </GuestOnly>
        }
      />

      {/* App: F24–F25 */}
      <Route
        path="/app/*"
        element={
          <RequireAuth>
            <DashboardPlaceholder />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
