import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { useCreateVehicle, useUpdateVehicle, useVehicle } from '../../hooks/useVehicles'
import {
  apiErrorMessage,
  buttonPrimaryCx,
  buttonSecondaryCx,
  errorCx,
  inputCx,
  labelCx,
  panelCx,
} from '../../lib/ui'

interface FormInitial {
  make: string
  model: string
  year: string
  vin: string
  mileage: string
}

export default function VehicleFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const vehicleId = Number(id)
  const editing = mode === 'edit'
  const query = useVehicle(vehicleId)

  if (editing && query.isPending) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10 text-sm text-neutral-500">Loading…</main>
    )
  }
  if (editing && (query.isError || !query.data)) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-10">
        <Link to="/app/vehicles" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Vehicles
        </Link>
        <div className={errorCx} role="alert">
          {apiErrorMessage(query.error)}
        </div>
      </main>
    )
  }

  const initial: FormInitial = editing
    ? {
        make: query.data!.make,
        model: query.data!.model,
        year: String(query.data!.year),
        vin: query.data!.vin,
        mileage: String(query.data!.mileage),
      }
    : { make: '', model: '', year: '', vin: '', mileage: '' }

  // key remounts the form once the record loads, so state starts filled
  // without a setState-inside-effect dance.
  return (
    <VehicleForm
      key={editing ? query.data!.id : 'create'}
      mode={mode}
      vehicleId={vehicleId}
      initial={initial}
    />
  )
}

function VehicleForm({
  mode,
  vehicleId,
  initial,
}: {
  mode: 'create' | 'edit'
  vehicleId: number
  initial: FormInitial
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const staff = user?.role === 'mechanic' || user?.role === 'admin'

  const [make, setMake] = useState(initial.make)
  const [model, setModel] = useState(initial.model)
  const [year, setYear] = useState(initial.year)
  const [vin, setVin] = useState(initial.vin)
  const [mileage, setMileage] = useState(initial.mileage)
  const [customerId, setCustomerId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const create = useCreateVehicle()
  const update = useUpdateVehicle()

  function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const yearNum = Number(year)
    const mileageNum = Number(mileage)
    if (!make.trim() || !model.trim() || !vin.trim()) {
      setError('Make, model and VIN are required.')
      return
    }
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) {
      setError('Enter a valid year.')
      return
    }
    if (!Number.isInteger(mileageNum) || mileageNum < 0) {
      setError('Mileage must be a whole number (0 or more).')
      return
    }

    if (mode === 'create') {
      const customerIdNum = Number(customerId)
      if (staff && (!Number.isInteger(customerIdNum) || customerIdNum < 1)) {
        setError('Enter the ID of the customer who will own the vehicle.')
        return
      }
      create.mutate(
        {
          make: make.trim(),
          model: model.trim(),
          year: yearNum,
          vin: vin.trim(),
          mileage: mileageNum,
          ...(staff ? { user_id: customerIdNum } : {}),
        },
        {
          onSuccess: (vehicle) => navigate(`/app/vehicles/${vehicle.id}`),
          onError: (err) => setError(apiErrorMessage(err)),
        },
      )
      return
    }

    update.mutate(
      {
        id: vehicleId,
        input: {
          make: make.trim(),
          model: model.trim(),
          year: yearNum,
          vin: vin.trim(),
          mileage: mileageNum,
        },
      },
      {
        onSuccess: () => navigate(`/app/vehicles/${vehicleId}`),
        onError: (err) => setError(apiErrorMessage(err)),
      },
    )
  }

  const cancelTo = mode === 'edit' ? `/app/vehicles/${vehicleId}` : '/app/vehicles'

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <div>
        <Link to={cancelTo} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← {mode === 'edit' ? 'Vehicle' : 'Vehicles'}
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {mode === 'edit' ? 'Edit vehicle' : 'Add vehicle'}
        </h1>
      </div>

      <form onSubmit={submit} className={`${panelCx} space-y-4`}>
        {error ? (
          <div className={errorCx} role="alert">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="v-make" className={labelCx}>
              Make
            </label>
            <input
              id="v-make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="Toyota"
              className={inputCx}
            />
          </div>
          <div>
            <label htmlFor="v-model" className={labelCx}>
              Model
            </label>
            <input
              id="v-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Corolla"
              className={inputCx}
            />
          </div>
          <div>
            <label htmlFor="v-year" className={labelCx}>
              Year
            </label>
            <input
              id="v-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
              placeholder="2021"
              className={inputCx}
            />
          </div>
          <div>
            <label htmlFor="v-mileage" className={labelCx}>
              Mileage
            </label>
            <input
              id="v-mileage"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              inputMode="numeric"
              placeholder="45000"
              className={inputCx}
            />
          </div>
        </div>

        <div>
          <label htmlFor="v-vin" className={labelCx}>
            VIN
          </label>
          <input
            id="v-vin"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="17 characters"
            className={inputCx}
          />
        </div>

        {mode === 'create' && staff ? (
          <div>
            <label htmlFor="v-owner" className={labelCx}>
              Customer ID
            </label>
            <input
              id="v-owner"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              inputMode="numeric"
              placeholder="ID of the owning customer"
              className={inputCx}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Mechanics and admins create vehicles for a customer; the vehicle is created
              verified.
            </p>
          </div>
        ) : null}

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
                : 'Create vehicle'}
          </button>
          <Link to={cancelTo} className={buttonSecondaryCx}>
            Cancel
          </Link>
        </div>
      </form>
    </main>
  )
}
