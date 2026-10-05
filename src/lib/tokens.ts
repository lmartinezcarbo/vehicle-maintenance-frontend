// JWT pair in localStorage: the backend hands the tokens in the body, so a
// cookie would mean changing the auth flow (decision: keep the API as is).
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
