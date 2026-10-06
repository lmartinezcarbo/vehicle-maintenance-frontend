import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { useAuth } from './context/auth-context'
import DashboardPage from './pages/DashboardPage'
import VehicleDetailPage from './pages/vehicles/VehicleDetailPage'
import VehicleFormPage from './pages/vehicles/VehicleFormPage'
import VehiclesPage from './pages/vehicles/VehiclesPage'
import RecordDetailPage from './pages/records/RecordDetailPage'
import RecordFormPage from './pages/records/RecordFormPage'
import RecordsPage from './pages/records/RecordsPage'
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
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="vehicles">
          <Route index element={<VehiclesPage />} />
          <Route path="new" element={<VehicleFormPage mode="create" />} />
          <Route path=":id" element={<VehicleDetailPage />} />
          <Route path=":id/edit" element={<VehicleFormPage mode="edit" />} />
        </Route>
        <Route path="records">
          <Route index element={<RecordsPage />} />
          <Route path="new" element={<RecordFormPage mode="create" />} />
          <Route path=":id" element={<RecordDetailPage />} />
          <Route path=":id/edit" element={<RecordFormPage mode="edit" />} />
        </Route>
      </Route>
      <Route path="/app/*" element={<Navigate to="/app" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
