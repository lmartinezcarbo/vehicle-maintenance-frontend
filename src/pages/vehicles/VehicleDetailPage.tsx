import { useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import {
  useDeleteVehicle,
  useDeleteVehiclePhoto,
  useUploadVehiclePhoto,
  useVehicle,
  useVehiclePhotoUrl,
  useVerifyVehicle,
} from '../../hooks/useVehicles'
import {
  apiErrorMessage,
  buttonDangerCx,
  buttonPrimaryCx,
  buttonSecondaryCx,
  errorCx,
  panelCx,
  verifiedCx,
} from '../../lib/ui'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function VehicleDetailPage() {
  const { id } = useParams()
  const vehicleId = Number(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  const vehicleQuery = useVehicle(vehicleId)
  const vehicle = vehicleQuery.data
  const photo = useVehiclePhotoUrl(vehicle ?? { id: vehicleId, has_photo: false })

  const verify = useVerifyVehicle()
  const remove = useDeleteVehicle()
  const upload = useUploadVehiclePhoto()
  const removePhoto = useDeleteVehiclePhoto()
  const [error, setError] = useState<string | null>(null)

  if (vehicleQuery.isPending) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10 text-sm text-neutral-500">Loading…</main>
    )
  }
  if (vehicleQuery.isError || !vehicle) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-6 py-10">
        <Link to="/app/vehicles" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Vehicles
        </Link>
        <div className={errorCx} role="alert">
          {apiErrorMessage(vehicleQuery.error)}
        </div>
      </main>
    )
  }

  // Mirror of the API rules: customers only touch unverified vehicles,
  // mechanics never delete, verify is mechanic/admin and one-way.
  const canModify = user?.role !== 'customer' || !vehicle.verified
  const canDelete =
    user?.role === 'admin' || (user?.role === 'customer' && !vehicle.verified)
  const canVerify = (user?.role === 'mechanic' || user?.role === 'admin') && !vehicle.verified

  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Photo exceeds the 5 MB limit.')
      return
    }
    if (!PHOTO_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG and WEBP images are accepted.')
      return
    }
    setError(null)
    upload.mutate(
      { id: vehicleId, file },
      { onError: (err) => setError(apiErrorMessage(err)) },
    )
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/app/vehicles" className="text-sm text-neutral-500 hover:text-neutral-700">
            ← Vehicles
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {vehicle.make} {vehicle.model}{' '}
            <span className="font-normal text-neutral-400">· {vehicle.year}</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {canVerify ? (
            <button
              type="button"
              disabled={verify.isPending}
              onClick={() =>
                verify.mutate(vehicleId, { onError: (err) => setError(apiErrorMessage(err)) })
              }
              className={buttonPrimaryCx}
            >
              {verify.isPending ? 'Verifying…' : 'Verify vehicle'}
            </button>
          ) : null}
          {canModify ? (
            <Link to={`/app/vehicles/${vehicle.id}/edit`} className={buttonSecondaryCx}>
              Edit
            </Link>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => {
                if (!window.confirm('Delete this vehicle? This cannot be undone.')) return
                remove.mutate(vehicleId, {
                  onSuccess: () => navigate('/app/vehicles'),
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

      <div className="grid gap-6 md:grid-cols-2">
        <section className={panelCx}>
          <h2 className="text-sm font-medium text-neutral-500">Details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">VIN</dt>
              <dd className="font-mono text-xs text-neutral-800">{vehicle.vin}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Mileage</dt>
              <dd className="tabular-nums text-neutral-800">
                {vehicle.mileage.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Status</dt>
              <dd>
                <span className={verifiedCx(vehicle.verified)}>
                  {vehicle.verified ? 'Verified' : 'Unverified'}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Owner</dt>
              <dd className="text-neutral-800">#{vehicle.user_id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Created</dt>
              <dd className="text-neutral-800">
                {new Date(vehicle.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </section>

        <section className={panelCx}>
          <h2 className="text-sm font-medium text-neutral-500">Photo</h2>
          {vehicle.has_photo && photo.url ? (
            <img
              src={photo.url}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="mt-4 h-56 w-full rounded-lg object-cover"
            />
          ) : vehicle.has_photo ? (
            <div className="mt-4 flex h-56 items-center justify-center rounded-lg bg-neutral-50 text-sm text-neutral-400">
              Loading photo…
            </div>
          ) : (
            <div className="mt-4 flex h-56 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-400">
              No photo yet
            </div>
          )}
          {canModify ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <label
                className={`${buttonSecondaryCx} ${upload.isPending ? 'opacity-50' : 'cursor-pointer'}`}
              >
                {upload.isPending
                  ? 'Uploading…'
                  : vehicle.has_photo
                    ? 'Replace photo'
                    : 'Upload photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={upload.isPending}
                  onChange={onPickFile}
                />
              </label>
              {vehicle.has_photo ? (
                <button
                  type="button"
                  disabled={removePhoto.isPending}
                  onClick={() => {
                    if (!window.confirm('Remove the photo of this vehicle?')) return
                    removePhoto.mutate(vehicleId, {
                      onError: (err) => setError(apiErrorMessage(err)),
                    })
                  }}
                  className={buttonDangerCx}
                >
                  {removePhoto.isPending ? 'Removing…' : 'Remove photo'}
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
