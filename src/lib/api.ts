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
  /** Multipart body; the browser sets the boundary itself. */
  formData?: FormData
  /** Query string params; empty/undefined values are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>
  /** Set to false to opt out of the refresh-and-retry dance (login, 2FA). */
  retry?: boolean
}

/** Builds a query string, skipping empty values (GET list endpoints). */
export function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    sp.set(key, String(value))
  }
  return sp.toString()
}

async function toApiError(res: Response): Promise<ApiError> {
  let detail = res.statusText || `HTTP ${res.status}`
  try {
    const payload: unknown = await res.json()
    if (payload && typeof payload === 'object' && 'detail' in payload) {
      const d = (payload as { detail: unknown }).detail
      if (typeof d === 'string') detail = d
      else if (Array.isArray(d)) detail = d.map(String).join('; ')
    } else if (payload && typeof payload === 'object' && 'error' in payload) {
      // slowapi rate limits answer {"error": "..."} instead of {"detail": ...}
      const e = (payload as { error: unknown }).error
      if (typeof e === 'string') detail = e
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
  const { json, form, formData, query, retry = true, ...init } = options
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
  } else if (formData !== undefined) {
    body = formData
  }

  const qs = buildQuery(query ?? {})
  const res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ''}`, { ...init, headers, body })

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

/** Binary GET (vehicle photos): raw body with the auth header attached. */
export async function apiBlob(path: string): Promise<Blob> {
  const headers = new Headers()
  const access = tokens.getAccess()
  if (access) headers.set('Authorization', `Bearer ${access}`)
  const res = await fetch(`${BASE}${path}`, { headers })
  if (!res.ok) throw await toApiError(res)
  return res.blob()
}

export const API_BASE = BASE
