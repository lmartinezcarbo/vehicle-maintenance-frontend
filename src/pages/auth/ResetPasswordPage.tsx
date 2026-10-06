import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../../components/AuthShell'
import { Field } from '../../components/Field'
import { useAuth } from '../../context/auth-context'
import { apiErrorMessage, buttonCx, errorCx, linkCx } from '../../lib/ui'

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { email: stateEmail } = (location.state ?? {}) as { email?: string }

  const [email, setEmail] = useState(stateEmail ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await resetPassword(email.trim(), code.trim(), password)
      navigate('/login', { state: { email: email.trim(), reset: true } })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Paste the code from the email and choose a new password."
      footer={
        <>
          Need a new code?{' '}
          <Link to="/forgot-password" className={linkCx}>
            Request it again
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
        <Field
          label="Email"
          type="email"
          inputMode="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          label="Reset code"
          value={code}
          onChange={setCode}
          autoComplete="one-time-code"
          placeholder="e.g. 482913"
        />
        <div>
          <Field
            label="New password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-neutral-500">At least 8 characters.</p>
        </div>
        <Field
          label="Confirm new password"
          type="password"
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
        />
        <button type="submit" disabled={busy} className={buttonCx}>
          {busy ? 'Saving…' : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  )
}
