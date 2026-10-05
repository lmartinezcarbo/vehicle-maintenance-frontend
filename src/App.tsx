import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/auth-context'

/** Replaced screen by screen in the next steps of F23. */
function Placeholder({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">Coming up in the next step of F23.</p>
    </main>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Loading…
      </main>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      {/* Auth (F23) */}
      <Route path="/login" element={<Placeholder title="Sign in" />} />
      <Route path="/register" element={<Placeholder title="Create account" />} />
      <Route path="/verify-email" element={<Placeholder title="Verify your email" />} />
      <Route path="/2fa" element={<Placeholder title="Two-factor code" />} />
      <Route path="/forgot-password" element={<Placeholder title="Forgot password" />} />
      <Route path="/reset-password" element={<Placeholder title="Reset password" />} />

      {/* App (F24–F25) */}
      <Route
        path="/app/*"
        element={
          <RequireAuth>
            <Placeholder title="Dashboard" />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
