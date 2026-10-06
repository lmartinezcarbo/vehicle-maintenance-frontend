import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import {
  useDeleteMaintenanceRecord,
  useMaintenanceRecord,
  useMarkRecordReady,
} from '../../hooks/useRecords'
import { useVehicle } from '../../hooks/useVehicles'
import { RecordExpensesSection } from './RecordExpensesSection'
import { RecordPartsSection } from './RecordPartsSection'
import {
  apiErrorMessage,
  buttonDangerCx,
  buttonPrimaryCx,
  buttonSecondaryCx,
  errorCx,
  formatMoney,
  infoCx,
  panelCx,
  statusCx,
  statusLabel,
} from '../../lib/ui'

export default function RecordDetailPage() {
  const { id } = useParams()
  const recordId = Number(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  const recordQuery = useMaintenanceRecord(recordId)
  const record = recordQuery.data
  const vehicleQuery = useVehicle(record?.vehicle_id ?? Number.NaN)

  const markReady = useMarkRecordReady()
  const remove = useDeleteMaintenanceRecord()
  const [error, setError] = useState<string | null>(null)

  if (recordQuery.isPending) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10 text-sm text-neutral-500">Loading…</main>
    )
  }
  if (recordQuery.isError || !record) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-6 py-10">
        <Link to="/app/records" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Records
        </Link>
        <div className={errorCx} role="alert">
          {apiErrorMessage(recordQuery.error)}
        </div>
      </main>
    )
  }

  // Lifecycle mirror: only mechanics/admins write; records freeze as soon
  // as they leave `in_progress`; `completed` arrives via the Stripe webhook.
  const staff = user?.role === 'mechanic' || user?.role === 'admin'
  const canEdit = staff && record.status === 'in_progress'
  const canDelete =
    staff &&
    (record.status === 'in_progress' || (user?.role === 'admin' && record.status === 'ready'))
  const canMarkReady = staff && record.status === 'in_progress'

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/app/records" className="text-sm text-neutral-500 hover:text-neutral-700">
            ← Records
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900">{record.service_type}</h1>
            <span className={statusCx(record.status)}>{statusLabel(record.status)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canMarkReady ? (
            <button
              type="button"
              disabled={markReady.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    'Mark this record as ready? The owner will receive a "Your vehicle is ready" email.',
                  )
                ) {
                  return
                }
                markReady.mutate(recordId, {
                  onError: (err) => setError(apiErrorMessage(err)),
                })
              }}
              className={buttonPrimaryCx}
            >
              {markReady.isPending ? 'Saving…' : 'Mark as ready'}
            </button>
          ) : null}
          {canEdit ? (
            <Link to={`/app/records/${record.id}/edit`} className={buttonSecondaryCx}>
              Edit
            </Link>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => {
                if (!window.confirm('Delete this record? This cannot be undone.')) return
                remove.mutate(recordId, {
                  onSuccess: () => navigate('/app/records'),
                  onError: (err) => setError(apiErrorMessage(err)),
                })
              }}
              className={buttonDangerCx}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className={errorCx} role="alert">
          {error}
        </div>
      ) : null}

      {record.status === 'ready' ? (
        <div className={infoCx} role="status">
          Waiting for payment: the record is completed automatically once Stripe confirms it.
        </div>
      ) : record.status === 'completed' ? (
        <div className={infoCx} role="status">
          Completed after the payment was confirmed.
        </div>
      ) : null}

      <section className={panelCx}>
        <h2 className="text-sm font-medium text-neutral-500">Details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Vehicle</dt>
            <dd>
              <Link
                to={`/app/vehicles/${record.vehicle_id}`}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {vehicleQuery.data
                  ? `#${record.vehicle_id} — ${vehicleQuery.data.make} ${vehicleQuery.data.model}`
                  : `#${record.vehicle_id}`}
              </Link>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Service date</dt>
            <dd className="text-neutral-800">{record.service_date.slice(0, 10)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Mileage</dt>
            <dd className="tabular-nums text-neutral-800">{record.mileage.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Labor cost</dt>
            <dd className="tabular-nums text-neutral-800">{formatMoney(record.labor_cost)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Total cost</dt>
            <dd className="font-medium tabular-nums text-neutral-900">
              {formatMoney(record.total_cost)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Description</dt>
            <dd className="max-w-md text-right text-neutral-800">{record.description}</dd>
          </div>
          {record.notes ? (
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Notes</dt>
              <dd className="max-w-md text-right text-neutral-800">{record.notes}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Created</dt>
            <dd className="text-neutral-800">
              {new Date(record.created_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecordPartsSection recordId={record.id} editable={canEdit} />
        <RecordExpensesSection
          recordId={record.id}
          vehicleId={record.vehicle_id}
          editable={canEdit}
        />
      </div>
    </main>
  )
}
