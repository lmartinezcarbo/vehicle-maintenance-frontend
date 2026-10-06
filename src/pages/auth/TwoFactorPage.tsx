import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../../components/AuthShell'
import { Field } from '../../components/Field'
import { useAuth } from '../../context/auth-context'
import {
  apiErrorMessage,
  buttonCx,
  errorCx,
  linkCx,
  successCx,
} from '../../lib/ui'

export default function TwoFactorPage() {
  const { verify2fa, resend2fa } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { email: stateEmail } = (location.state ?? {}) as { email?: string }

  const [email, setEmail] = useState(stateEmail ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await verify2fa(email.trim(), code.trim())
      navigate('/app', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setError(null)
    setNotice(null)
    setResending(true)
    try {
      await resend2fa(email.trim())
      setNotice('We sent you a new code. It can take a minute to arrive.')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="Two-factor authentication"
      subtitle="Enter the one-time code we emailed you."
      footer={
        <>
          Not your account?{' '}
          <Link to="/login" className={linkCx}>
            Sign in with another one
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
        {notice ? (
          <div className={successCx} role="status">
            {notice}
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
          label="Authentication code"
          value={code}
          onChange={setCode}
          autoComplete="one-time-code"
          placeholder="e.g. 482913"
        />
        <button type="submit" disabled={busy} className={buttonCx}>
          {busy ? 'Verifying…' : 'Verify code'}
        </button>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={resending || !email.trim()}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </form>
    </AuthShell>
  )
}
