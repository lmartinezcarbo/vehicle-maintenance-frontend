/**
 * The Stripe success/cancel URLs are static (they come from the server's
 * STRIPE_*_URL env), so they carry no payment id. We remember the last
 * checkout we started to poll its status on the way back.
 */
const KEY = 'vmapi.last_payment_id'

export const lastPayment = {
  save(id: number): void {
    localStorage.setItem(KEY, String(id))
  },
  read(): number | null {
    const raw = localStorage.getItem(KEY)
    const id = raw ? Number(raw) : Number.NaN
    return Number.isFinite(id) ? id : null
  },
  clear(): void {
    localStorage.removeItem(KEY)
  },
}
