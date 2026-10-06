import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../../components/AuthShell'
import { Field } from '../../components/Field'
import { useAuth } from '../../context/auth-context'
import { apiErrorMessage, buttonCx, errorCx, linkCx } from '../../lib/ui'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmation,
      })
      navigate('/verify-email', { state: { email: email.trim() } })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track your vehicles and their maintenance in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className={linkCx}>
            Sign in
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
        <Field label="Full name" value={name} onChange={setName} autoComplete="name" />
        <Field
          label="Email"
          type="email"
          inputMode="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <div>
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-neutral-500">At least 8 characters.</p>
        </div>
        <Field
          label="Confirm password"
          type="password"
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
        />
        <button type="submit" disabled={busy} className={buttonCx}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
