import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../../components/AuthShell'
import { Field } from '../../components/Field'
import { useAuth } from '../../context/auth-context'
import { apiErrorMessage, buttonCx, errorCx, linkCx } from '../../lib/ui'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await forgotPassword(email.trim())
      navigate('/reset-password', { state: { email: email.trim() } })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset code."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className={linkCx}>
            Back to sign in
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
        <button type="submit" disabled={busy} className={buttonCx}>
          {busy ? 'Sending…' : 'Send reset code'}
        </button>
      </form>
    </AuthShell>
  )
}
