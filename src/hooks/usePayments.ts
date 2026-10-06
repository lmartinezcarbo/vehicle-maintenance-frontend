import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { api } from '../lib/api'
import { lastPayment } from '../lib/lastPayment'
import { queryKeys } from '../lib/queryKeys'
import type { Payment, PaymentCreate } from '../types/api'

/**
 * Creates the Stripe Checkout session (201, or 200 idempotent when one is
 * already pending) and remembers the payment id: the browser leaves for
 * `checkout_url` immediately and the return page polls GET /payments/{id}.
 */
export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PaymentCreate) =>
      api<Payment>('/payments/', { method: 'POST', json: input }),
    onSuccess: (payment) => {
      lastPayment.save(payment.id)
      void qc.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

/**
 * Reads one payment — never with `checkout_url` (the server only hands it
 * out on creation). With `poll` it keeps asking while the status is
 * `pending` (the webhook travels asynchronously), stopping after a minute
 * so an abandoned tab doesn't poll forever.
 */
export function usePayment(id: number | null, options: { poll?: boolean } = {}) {
  const deadline = useRef<number | null>(null)
  return useQuery<Payment>({
    queryKey: queryKeys.payment(id ?? -1),
    queryFn: () => {
      // Set on the first fetch, not during render (purity).
      deadline.current ??= Date.now() + 60_000
      return api<Payment>(`/payments/${id}`)
    },
    enabled: id !== null && Number.isFinite(id),
    refetchInterval: (query) =>
      options.poll &&
      query.state.data?.status === 'pending' &&
      deadline.current !== null &&
      Date.now() < deadline.current
        ? 2_000
        : false,
  })
}
