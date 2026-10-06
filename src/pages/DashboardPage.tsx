import { useAuth } from '../context/auth-context'

/** Temporary home until F24 builds the real dashboard. */
export default function DashboardPage() {
  const { user } = useAuth()
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900">Welcome, {user?.name}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        You're signed in as <span className="font-medium">{user?.role}</span>. The dashboard
        lands in F24.
      </p>
    </main>
  )
}
