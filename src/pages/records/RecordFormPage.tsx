import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import {
  useCreateMaintenanceRecord,
  useMaintenanceRecord,
  useUpdateMaintenanceRecord,
} from '../../hooks/useRecords'
import { useVehicles } from '../../hooks/useVehicles'
import type { MaintenanceRecord } from '../../types/api'
import {
  apiErrorMessage,
  buttonPrimaryCx,
  buttonSecondaryCx,
  errorCx,
  infoCx,
  inputCx,
  labelCx,
  panelCx,
} from '../../lib/ui'

interface FormInitial {
  service_type: string
  description: string
  mileage: string
  service_date: string
  labor_cost: string
  notes: string
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function RecordFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { user } = useAuth()
  const { id } = useParams()
  const recordId = Number(id)
  const editing = mode === 'edit'
  const query = useMaintenanceRecord(recordId)
  const staff = user?.role === 'mechanic' || user?.role === 'admin'

  // Customers never write records (the API answers 403): don't offer the form.
  if (!staff) return <Navigate to="/app/records" replace />

  if (editing && query.isPending) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-neutral-500">Loading…</main>
    )
  }
  if (editing && (query.isError || !query.data)) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-10">
        <Link to="/app/records" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Records
        </Link>
        <div className={errorCx} role="alert">
          {apiErrorMessage(query.error)}
        </div>
      </main>
    )
  }

  const record: MaintenanceRecord | undefined = query.data
  if (editing && record && record.status !== 'in_progress') {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-10">
        <Link to={`/app/records/${record.id}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Record
        </Link>
        <div className={infoCx} role="status">
          Only records in progress can be edited. This one is{' '}
          {record.status === 'ready' ? 'ready (waiting for payment)' : 'completed'}.
        </div>
      </main>
    )
  }

  const initial: FormInitial = editing
    ? {
        service_type: record!.service_type,
        description: record!.description,
        mileage: String(record!.mileage),
        service_date: record!.service_date.slice(0, 10),
        labor_cost: String(Number(record!.labor_cost)),
        notes: record!.notes ?? '',
      }
    : {
        service_type: '',
        description: '',
        mileage: '',
        service_date: today(),
        labor_cost: '0',
        notes: '',
      }

  // key remounts the form once the record loads (state starts filled).
  return (
    <RecordForm
      key={editing ? record!.id : 'create'}
      mode={mode}
      recordId={recordId}
      initial={initial}
      vehicleId={record?.vehicle_id}
    />
  )
}

function RecordForm({
  mode,
  recordId,
  initial,
  vehicleId,
}: {
  mode: 'create' | 'edit'
  recordId: number
  initial: FormInitial
  vehicleId?: number
}) {
  const navigate = useNavigate()
  const vehiclesQuery = useVehicles({ limit: 100 })
  const vehicles = (vehiclesQuery.data ?? []).filter((vehicle) => vehicle.verified)

  const [vehicle, setVehicle] = useState(vehicleId ? String(vehicleId) : '')
  const [serviceType, setServiceType] = useState(initial.service_type)
  const [description, setDescription] = useState(initial.description)
  const [mileage, setMileage] = useState(initial.mileage)
  const [serviceDate, setServiceDate] = useState(initial.service_date)
  const [laborCost, setLaborCost] = useState(initial.labor_cost)
  const [notes, setNotes] = useState(initial.notes)
  const [error, setError] = useState<string | null>(null)

  const create = useCreateMaintenanceRecord()
  const update = useUpdateMaintenanceRecord()

  function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const mileageNum = Number(mileage)
    const laborNum = Number(laborCost)
    if (!serviceType.trim() || !description.trim()) {
      setError('Service type and description are required.')
      return
    }
    if (!Number.isInteger(mileageNum) || mileageNum < 0) {
      setError('Mileage must be a whole number (0 or more).')
      return
    }
    if (!serviceDate) {
      setError('Pick a service date.')
      return
    }
    if (!Number.isFinite(laborNum) || laborNum < 0) {
      setError('Labor cost must be 0 or more.')
      return
    }

    const common = {
      service_type: serviceType.trim(),
      description: description.trim(),
      mileage: mileageNum,
      service_date: serviceDate,
      labor_cost: laborNum,
      notes: notes.trim() ? notes.trim() : null,
    }

    if (mode === 'create') {
      if (!vehicle) {
        setError('Choose the vehicle for this record.')
        return
      }
      create.mutate(
        { vehicle_id: Number(vehicle), ...common },
        {
          onSuccess: (record) => navigate(`/app/records/${record.id}`),
          onError: (err) => setError(apiErrorMessage(err)),
        },
      )
      return
    }

    update.mutate(
      { id: recordId, input: common },
      {
        onSuccess: () => navigate(`/app/records/${recordId}`),
        onError: (err) => setError(apiErrorMessage(err)),
      },
    )
  }

  const cancelTo = mode === 'edit' ? `/app/records/${recordId}` : '/app/records'

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <div>
        <Link to={cancelTo} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← {mode === 'edit' ? 'Record' : 'Records'}
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {mode === 'edit' ? 'Edit record' : 'New maintenance record'}
        </h1>
      </div>

      <form onSubmit={submit} className={`${panelCx} space-y-4`}>
        {error ? (
          <div className={errorCx} role="alert">
            {error}
          </div>
        ) : null}

        {mode === 'create' ? (
          <div>
            <label htmlFor="r-vehicle" className={labelCx}>
              Vehicle
            </label>
            <select
              id="r-vehicle"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className={inputCx}
            >
              <option value="">
                {vehiclesQuery.isPending ? 'Loading vehicles…' : 'Choose a verified vehicle'}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  #{v.id} — {v.make} {v.model} ({v.year})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-neutral-500">
              Only verified vehicles can have maintenance records.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="r-type" className={labelCx}>
              Service type
            </label>
            <input
              id="r-type"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="Oil change"
              className={inputCx}
            />
          </div>
          <div>
            <label htmlFor="r-date" className={labelCx}>
              Service date
            </label>
            <input
              id="r-date"
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className={inputCx}
            />
          </div>
          <div>
            <label htmlFor="r-mileage" className={labelCx}>
              Mileage
            </label>
            <input
              id="r-mileage"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              inputMode="numeric"
              placeholder="45000"
              className={inputCx}
            />
          </div>
          <div>
            <label htmlFor="r-labor" className={labelCx}>
              Labor cost
            </label>
            <input
              id="r-labor"
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value)}
              inputMode="decimal"
              placeholder="45.00"
              className={inputCx}
            />
          </div>
        </div>

        <div>
          <label htmlFor="r-description" className={labelCx}>
            Description
          </label>
          <textarea
            id="r-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What was done"
            className={inputCx}
          />
        </div>

        <div>
          <label htmlFor="r-notes" className={labelCx}>
            Notes <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <textarea
            id="r-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputCx}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={create.isPending || update.isPending}
            className={buttonPrimaryCx}
          >
            {mode === 'edit'
              ? update.isPending
                ? 'Saving…'
                : 'Save changes'
              : create.isPending
                ? 'Creating…'
                : 'Create record'}
          </button>
          <Link to={cancelTo} className={buttonSecondaryCx}>
            Cancel
          </Link>
        </div>
      </form>
    </main>
  )
}
