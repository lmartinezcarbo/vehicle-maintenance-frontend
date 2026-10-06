// JWT pair in localStorage.
//
// Trade-off, stated on purpose: localStorage is readable by any script on
// the page, so an XSS bug would leak both tokens. The alternative
// (httpOnly, SameSite cookies) is stronger but needs a backend/auth-flow
// change, so this demo keeps the API as is and relies on React's default
// escaping. A product handling real money would move the refresh token
// into an httpOnly cookie.
const ACCESS_KEY = 'vma.access'
const REFRESH_KEY = 'vma.refresh'

export const tokens = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY)
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  },
  set(pair: { access_token: string; refresh_token: string }): void {
    localStorage.setItem(ACCESS_KEY, pair.access_token)
    localStorage.setItem(REFRESH_KEY, pair.refresh_token)
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
