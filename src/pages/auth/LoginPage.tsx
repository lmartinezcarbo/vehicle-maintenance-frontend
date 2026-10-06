import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../../components/AuthShell'
import { Field } from '../../components/Field'
import { useAuth } from '../../context/auth-context'
import { apiErrorMessage, buttonCx, errorCx, linkCx, successCx } from '../../lib/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as { email?: string; verified?: boolean; reset?: boolean }

  const [email, setEmail] = useState(state.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
    </AuthShell>
  )
}
