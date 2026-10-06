import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth-context'
import { roleBadgeCx } from '../lib/ui'

const navCx = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition ${
    isActive ? 'text-blue-600' : 'text-neutral-600 hover:text-neutral-900'
  }`

const signOutCx =
  'rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50'

/** Shell for everything under /app: top bar, role badge, sign out. */
export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function signOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-neutral-900">Vehicle Maintenance</span>
            <nav className="flex items-center gap-4">
              <NavLink to="/app" end className={navCx}>
                Dashboard
              </NavLink>
              <NavLink to="/app/vehicles" className={navCx}>
                Vehicles
              </NavLink>
              <NavLink to="/app/records" className={navCx}>
                Records
              </NavLink>
              <NavLink to="/app/parts" className={navCx}>
                Parts
              </NavLink>
              {user?.role === 'admin' ? (
                <NavLink to="/app/users" className={navCx}>
                  Users
                </NavLink>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user ? <span className={roleBadgeCx(user.role)}>{user.role}</span> : null}
            <span className="hidden text-sm text-neutral-600 sm:inline">{user?.name}</span>
            <button type="button" onClick={() => void signOut()} className={signOutCx}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
