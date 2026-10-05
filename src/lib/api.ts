import { tokens } from './tokens'
import type { TokenPair } from '../types/api'

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON body; sets Content-Type automatically. */
  json?: unknown
  /** Form body for the OAuth2 login endpoint. */
  form?: URLSearchParams
  /** Set to false to opt out of the refresh-and-retry dance (login, 2FA). */
  retry?: boolean
}

async function toApiError(res: Response): Promise<ApiError> {
  let detail = res.statusText || `HTTP ${res.status}`
  try {
    const payload: unknown = await res.json()
    if (payload && typeof payload === 'object' && 'detail' in payload) {
      const d = (payload as { detail: unknown }).detail
      if (typeof d === 'string') detail = d
      else if (Array.isArray(d)) detail = d.map(String).join('; ')
    }
  } catch {
    // Non-JSON error body: keep the status text.
  }
  return new ApiError(res.status, detail)
}

/** Refresh once at a time; concurrent 401s share the same promise. */
let inFlightRefresh: Promise<boolean> | null = null

export function tryRefresh(): Promise<boolean> {
  inFlightRefresh ??= (async () => {
    const refresh_token = tokens.getRefresh()
    if (!refresh_token) return false
    try {
      const res = await fetch(`${BASE}/users/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      })
      if (!res.ok) {
        tokens.clear()
        return false
      }
      const pair = (await res.json()) as TokenPair
      tokens.set(pair)
      return true
    } catch {
      tokens.clear()
      return false
    }
  })().finally(() => {
    inFlightRefresh = null
  })
  return inFlightRefresh
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, form, retry = true, ...init } = options
  const headers = new Headers(init.headers)
  const access = tokens.getAccess()
  if (access) headers.set('Authorization', `Bearer ${access}`)

  let body: BodyInit | undefined
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  } else if (form !== undefined) {
    headers.set('Content-Type', 'application/x-www-form-urlencoded')
    body = form.toString()
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers, body })

  if (res.ok) {
    if (res.status === 204) return undefined as T
    const text = await res.text()
    return (text ? JSON.parse(text) : undefined) as T
  }

  // Expired access token: refresh once and replay the original request.
  if (res.status === 401 && retry && tokens.getRefresh() && !path.startsWith('/users/refresh')) {
    const refreshed = await tryRefresh()
    if (refreshed) return api<T>(path, { ...options, retry: false })
  }

  throw await toApiError(res)
}

export const API_BASE = BASE
