import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useVehicles } from '../../hooks/useVehicles'
import {
  apiErrorMessage,
  buttonPrimaryCx,
  buttonSecondaryCx,
  errorCx,
  inputCx,
  labelCx,
  panelCx,
  tdCx,
  thCx,
  verifiedCx,
} from '../../lib/ui'

const PAGE_SIZE = 10

type SearchField = 'make' | 'model' | 'vin'

export default function VehiclesPage() {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [searchBy, setSearchBy] = useState<SearchField>('make')
  const [offset, setOffset] = useState(0)

  const query = useVehicles({
    limit: PAGE_SIZE,
    offset,
    search: submitted || undefined,
    search_by: submitted ? searchBy : undefined,
  })
  const vehicles = query.data ?? []

  function search(e: FormEvent) {
    e.preventDefault()
    setSubmitted(input.trim())
    setOffset(0)
  }

  function clear() {
    setInput('')
    setSubmitted('')
    setOffset(0)
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Vehicles</h1>
        <Link to="/app/vehicles/new" className={buttonPrimaryCx}>
          Add vehicle
        </Link>
      </div>

      <form onSubmit={search} className={`${panelCx} flex flex-wrap items-end gap-3`}>
        <div className="min-w-48 flex-1">
          <label htmlFor="vehicle-search" className={labelCx}>
            Search
          </label>
          <input
            id="vehicle-search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Corolla"
            className={inputCx}
          />
        </div>
        <div>
          <label htmlFor="vehicle-field" className={labelCx}>
            Field
          </label>
          <select
            id="vehicle-field"
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value as SearchField)}
            className={inputCx}
          >
            <option value="make">Make</option>
            <option value="model">Model</option>
            <option value="vin">VIN</option>
          </select>
        </div>
        <button type="submit" className={buttonPrimaryCx}>
          Search
        </button>
        {submitted ? (
          <button type="button" onClick={clear} className={buttonSecondaryCx}>
            Clear
          </button>
        ) : null}
      </form>

      {query.isError ? (
        <div className={errorCx} role="alert">
          {apiErrorMessage(query.error)}
        </div>
      ) : null}

      <div className={`${panelCx} overflow-x-auto p-0`}>
        <table className="w-full">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className={thCx}>Vehicle</th>
              <th className={thCx}>Year</th>
              <th className={thCx}>VIN</th>
              <th className={`${thCx} text-right`}>Mileage</th>
              <th className={thCx}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-neutral-50">
                <td className={tdCx}>
                  <Link
                    to={`/app/vehicles/${vehicle.id}`}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    {vehicle.make} {vehicle.model}
                  </Link>
                </td>
                <td className={tdCx}>{vehicle.year}</td>
                <td className={`${tdCx} font-mono text-xs`}>{vehicle.vin}</td>
                <td className={`${tdCx} text-right tabular-nums`}>
                  {vehicle.mileage.toLocaleString()}
                </td>
                <td className={tdCx}>
                  <span className={verifiedCx(vehicle.verified)}>
                    {vehicle.verified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!query.isPending && vehicles.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-neutral-500">
            {query.isError
              ? 'The list could not be loaded.'
              : submitted
                ? 'No vehicles match your search.'
                : 'No vehicles yet. Create the first one.'}
          </p>
        ) : null}
        {query.isPending ? (
          <p className="px-6 py-10 text-center text-sm text-neutral-500">Loading…</p>
        ) : null}
      </div>

      {offset > 0 || vehicles.length === PAGE_SIZE ? (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            className={buttonSecondaryCx}
          >
            Previous
          </button>
          <span>
            {offset + 1}–{offset + vehicles.length}
          </span>
          <button
            type="button"
            disabled={vehicles.length < PAGE_SIZE}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            className={buttonSecondaryCx}
          >
            Next
          </button>
        </div>
      ) : null}
    </main>
  )
}
