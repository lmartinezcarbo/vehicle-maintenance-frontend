import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { usePayment } from '../../hooks/usePayments'
import { lastPayment } from '../../lib/lastPayment'
import {
  apiErrorMessage,
  buttonPrimaryCx,
  buttonSecondaryCx,
  errorCx,
  formatMoney,
  infoCx,
  panelCx,
  paymentStatusCx,
} from '../../lib/ui'

/**
 * Where STRIPE_SUCCESS_URL / STRIPE_CANCEL_URL point (static URLs, so the
 * payment id comes from localStorage). The record only completes when the
 * webhook confirms it, hence the polling on the success side.
 */
export default function PaymentReturnPage({ kind }: { kind: 'success' | 'cancel' }) {
  const paymentId = lastPayment.read()
  const qc = useQueryClient()
  const payment = usePayment(paymentId, { poll: kind === 'success' })
  const data = payment.data
  const paid = data?.status === 'paid'

  // Webhook done: the record behind the link must show its new status.
  useEffect(() => {
    if (paid && data) {
      void qc.invalidateQueries({ queryKey: ['record', data.maintenance_record_id] })
      void qc.invalidateQueries({ queryKey: ['records'] })
    }
  }, [paid, data, qc])

  const recordTo = data ? `/app/records/${data.maintenance_record_id}` : '/app/records'

  let verdict: ReactNode = null
  if (data) {
    if (kind === 'success') {
      verdict =
        data.status === 'paid' ? (
          <div className={infoCx} role="status">
            Payment confirmed. The record is completed automatically.
          </div>
        ) : data.status === 'pending' ? (
          <div className={infoCx} role="status">
            Waiting for Stripe to confirm the payment — the webhook can take a
            few seconds. If it stays pending, open the record in a while: the
            status updates by itself.
          </div>
        ) : (
          <div className={errorCx} role="alert">
            The payment ended as <strong>{data.status}</strong>. You can retry
            from the record.
          </div>
        )
    } else {
      verdict =
        data.status === 'paid' ? (
          <div className={infoCx} role="status">
            Good news: the payment was confirmed anyway.
          </div>
        ) : (
          <div className={infoCx} role="status">
            You left the checkout — the payment stays{' '}
            <strong>{data.status}</strong>. Nothing was charged; you can retry
            from the record whenever you want.
          </div>
        )
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <div>
        <Link to="/app/records" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Records
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {kind === 'success' ? 'Payment' : 'Checkout cancelled'}
        </h1>
      </div>

      {paymentId === null ? (
        <div className={infoCx} role="status">
          No recent checkout was found in this browser. The record shows the
          real status of any payment.
        </div>
      ) : payment.isPending ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : payment.isError || !data ? (
        <div className={errorCx} role="alert">
          {apiErrorMessage(payment.error)}
        </div>
      ) : (
        <section className={`${panelCx} space-y-4`}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Record</dt>
              <dd>
                <Link
                  to={recordTo}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  #{data.maintenance_record_id}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Amount</dt>
              <dd className="tabular-nums text-neutral-800">
                {formatMoney(data.amount)} {data.currency.toUpperCase()}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Status</dt>
              <dd>
                <span className={paymentStatusCx(data.status)}>{data.status}</span>
              </dd>
            </div>
          </dl>

          {verdict}

          <div className="flex gap-3">
            <Link to={recordTo} className={buttonPrimaryCx}>
              Open the record
            </Link>
            <Link to="/app/records" className={buttonSecondaryCx}>
              Back to records
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
