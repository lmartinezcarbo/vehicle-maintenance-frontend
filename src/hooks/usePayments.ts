import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
 * out on creation). Pass `refetchInterval` to poll after returning from
 * Stripe while the webhook is still travelling.
 */
export function usePayment(id: number | null, refetchInterval?: number) {
  return useQuery<Payment>({
    queryKey: queryKeys.payment(id ?? -1),
    queryFn: () => api<Payment>(`/payments/${id}`),
    enabled: id !== null && Number.isFinite(id),
    refetchInterval,
  })
}
