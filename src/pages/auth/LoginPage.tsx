import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../../components/AuthShell'
import { Field } from '../../components/Field'
import { useAuth } from '../../context/auth-context'
import { api } from '../../lib/api'
import type { DemoAvailability, Role } from '../../types/api'
import { apiErrorMessage, buttonCx, errorCx, linkCx, successCx } from '../../lib/ui'

const DEMO_LABELS: Record<Role, string> = {
  customer: 'customer',
  mechanic: 'mechanic',
  admin: 'admin',
}

export default function LoginPage() {
  const { login, demoLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as { email?: string; verified?: boolean; reset?: boolean }

  const [email, setEmail] = useState(state.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [demoRoles, setDemoRoles] = useState<Role[]>([])
  const [demoBusy, setDemoBusy] = useState<Role | null>(null)

  // The demo shortcut only exists while the backend runs with DEMO_MODE on;
  // a real deployment answers { enabled: false } and we show nothing.
  useEffect(() => {
    let cancelled = false
    api<DemoAvailability>('/users/demo', { retry: false })
      .then((res) => {
        if (!cancelled && res.enabled) setDemoRoles(res.roles)
      })
      .catch(() => {
        // No demo endpoint (older backend) or offline: just hide the panel.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const banner = state.verified
    ? 'Email verified. Sign in to continue.'
    : state.reset
      ? 'Password updated. Sign in with your new password.'
      : null

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email.trim(), password)
      // 2FA is mandatory: the password step only unlocks the email code.
      navigate('/2fa', { state: { email: email.trim() } })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function enterAsDemo(role: Role) {
    setError(null)
    setDemoBusy(role)
    try {
      await demoLogin(role)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setDemoBusy(null)
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. We'll email you a one-time code."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className={linkCx}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <div className={errorCx} role="alert">
            {error}
          </div>
        ) : null}
        {banner ? (
          <div className={successCx} role="status">
            {banner}
          </div>
        ) : null}
        <Field
          label="Email"
          type="email"
          inputMode="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <div className="text-right">
          <Link to="/forgot-password" className={linkCx}>
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={busy} className={buttonCx}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {demoRoles.length > 0 ? (
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <p className="text-sm text-neutral-500">
            Just exploring? Skip the email and enter as a demo user:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {demoRoles.map((role) => (
              <button
                key={role}
                type="button"
                disabled={demoBusy !== null}
                onClick={() => enterAsDemo(role)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
              >
                {demoBusy === role ? 'Entering…' : `Enter as ${DEMO_LABELS[role]}`}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </AuthShell>
  )
}
