/** Shared Tailwind classes for the auth screens (one light theme, hand-rolled). */

export const pageCx =
  'min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12'

export const cardCx = 'w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-sm'

export const titleCx = 'text-xl font-semibold text-neutral-900'

export const subtitleCx = 'mt-1 text-sm text-neutral-500'

export const labelCx = 'block text-sm font-medium text-neutral-700'

export const inputCx =
  'mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

export const buttonCx =
  'w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'

export const linkCx = 'font-medium text-blue-600 hover:text-blue-500'

export const errorCx = 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'

export const successCx =
  'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'

/** FastAPI hands errors as { detail: string }; fall back to a generic copy. */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  return 'Something went wrong. Please try again.'
}

/** Tone-coded pill for the role shown in the header. */
export function roleBadgeCx(role: string): string {
  const tone =
    role === 'admin'
      ? 'bg-violet-100 text-violet-700'
      : role === 'mechanic'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-blue-100 text-blue-700'
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone}`
}

/** Content panel (page width, unlike the fixed auth card). */
export const panelCx = 'rounded-xl border border-neutral-200 bg-white p-6 shadow-sm'

export const buttonPrimaryCx =
  'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'

export const buttonSecondaryCx =
  'rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50'

export const buttonDangerCx =
  'rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'

export const thCx = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-500'

export const tdCx = 'px-3 py-2 text-sm text-neutral-700'

/** Verified pill used in lists and detail views. */
export function verifiedCx(verified: boolean): string {
  return verified
    ? 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700'
    : 'inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700'
}

/** Record status pill: in_progress → ready → completed. */
export function statusCx(status: string): string {
  const tone =
    status === 'completed'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'ready'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-amber-100 text-amber-700'
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone}`
}

export function statusLabel(status: string): string {
  return status === 'in_progress'
    ? 'In progress'
    : status === 'ready'
      ? 'Ready'
      : 'Completed'
}

/** The API serializes Decimals as strings ("89.99"). */
export function formatMoney(value: string | number): string {
  return `$${Number(value).toFixed(2)}`
}

export const infoCx =
  'rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700'
