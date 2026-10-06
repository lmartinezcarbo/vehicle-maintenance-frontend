import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { useUpdateUserRole, useUsers } from '../../hooks/useUsers'
import {
  apiErrorMessage,
  buttonPrimaryCx,
  buttonSecondaryCx,
  errorCx,
  infoCx,
  inputCx,
  labelCx,
  panelCx,
  tdCx,
  thCx,
} from '../../lib/ui'
import type { Role } from '../../types/api'

const PAGE_SIZE = 10

/** GET /users/ only lists everybody for admins: guard before the panel. */
export default function UsersPage() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/app" replace />
  return <UsersPanel meId={user.id} />
}

function UsersPanel({ meId }: { meId: number }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [searchBy, setSearchBy] = useState<'name' | 'email'>('email')
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const changeRole = useUpdateUserRole()
  const query = useUsers({
    limit: PAGE_SIZE,
    offset,
    search: submitted || undefined,
    search_by: submitted ? searchBy : undefined,
  })
  const users = query.data ?? []

  function search(e: FormEvent) {
    e.preventDefault()
    setSubmitted(input.trim())
    setOffset(0)
  }

  function clear() {
    setInput('')
    setSubmitted('')
    setOffset(0)
  }

  function setRole(id: number, role: Role, name: string) {
    if (!window.confirm(`Change ${name}'s role to ${role}?`)) return
    setError(null)
    changeRole.mutate(
      { id, role },
      { onError: (err) => setError(apiErrorMessage(err)) },
    )
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Users</h1>
        <Link to="/app/parts" className={buttonSecondaryCx}>
          Parts catalog
        </Link>
      </div>

      <form onSubmit={search} className={`${panelCx} flex flex-wrap items-end gap-3`}>
        <div className="min-w-44 flex-1">
          <label htmlFor="user-search" className={labelCx}>
            Search
          </label>
          <input
            id="user-search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. demo@example.com"
            className={inputCx}
          />
        </div>
        <div>
          <label htmlFor="user-field" className={labelCx}>
            Field
          </label>
          <select
            id="user-field"
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value as 'name' | 'email')}
            className={inputCx}
          >
            <option value="email">Email</option>
            <option value="name">Name</option>
          </select>
        </div>
        <button type="submit" className={buttonPrimaryCx}>
          Search
        </button>
        {submitted ? (
          <button type="button" onClick={clear} className={buttonSecondaryCx}>
            Clear
          </button>
        ) : null}
      </form>

      <div className={infoCx} role="note">
        Changing a role is limited to 5 changes per minute, and you cannot
        remove your own admin role.
      </div>

      {query.isError ? (
        <div className={errorCx} role="alert">
          {apiErrorMessage(query.error)}
        </div>
      ) : null}
      {error ? (
        <div className={errorCx} role="alert">
          {error}
        </div>
      ) : null}

      <div className={`${panelCx} overflow-x-auto p-0`}>
        <table className="w-full">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className={thCx}>#</th>
              <th className={thCx}>Name</th>
              <th className={thCx}>Email</th>
              <th className={thCx}>Role</th>
              <th className={thCx}>Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((listed) => (
              <tr key={listed.id} className="hover:bg-neutral-50">
                <td className={`${tdCx} tabular-nums text-neutral-400`}>{listed.id}</td>
                <td className={`${tdCx} font-medium text-neutral-800`}>{listed.name}</td>
                <td className={tdCx}>{listed.email}</td>
                <td className={tdCx}>
                  {listed.id === meId ? (
                    <span className="text-neutral-500">{listed.role} (you)</span>
                  ) : (
                    <select
                      aria-label={`Role of ${listed.name}`}
                      value={listed.role}
                      disabled={changeRole.isPending}
                      onChange={(e) =>
                        setRole(listed.id, e.target.value as Role, listed.name)
                      }
                      className={`${inputCx} w-32 py-1`}
                    >
                      <option value="customer">customer</option>
                      <option value="mechanic">mechanic</option>
                      <option value="admin">admin</option>
                    </select>
                  )}
                </td>
                <td className={tdCx}>{new Date(listed.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!query.isPending && users.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-neutral-500">
            {query.isError
              ? 'The list could not be loaded.'
              : submitted
                ? 'No users match your search.'
                : 'No users yet.'}
          </p>
        ) : null}
        {query.isPending ? (
          <p className="px-6 py-10 text-center text-sm text-neutral-500">Loading…</p>
        ) : null}
      </div>

      {offset > 0 || users.length === PAGE_SIZE ? (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            className={buttonSecondaryCx}
          >
            Previous
          </button>
          <span>
            {offset + 1}–{offset + users.length}
          </span>
          <button
            type="button"
            disabled={users.length < PAGE_SIZE}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            className={buttonSecondaryCx}
          >
            Next
          </button>
        </div>
      ) : null}
    </main>
  )
}
