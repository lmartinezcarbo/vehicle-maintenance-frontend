import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { useRecords } from '../../hooks/useRecords'
import { useVehicles } from '../../hooks/useVehicles'
import {
  apiErrorMessage,
  buttonPrimaryCx,
  buttonSecondaryCx,
  errorCx,
  formatMoney,
  inputCx,
  labelCx,
  panelCx,
  statusCx,
  statusLabel,
  tdCx,
  thCx,
} from '../../lib/ui'

const PAGE_SIZE = 10

export default function RecordsPage() {
  const { user } = useAuth()
  const staff = user?.role === 'mechanic' || user?.role === 'admin'

  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [searchBy, setSearchBy] = useState<'service_type' | 'description'>('service_type')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [offset, setOffset] = useState(0)

  const vehiclesQuery = useVehicles({ limit: 100 })
  const query = useRecords({
    limit: PAGE_SIZE,
    offset,
    vehicle_id: vehicleFilter ? Number(vehicleFilter) : undefined,
    search: submitted || undefined,
    search_by: submitted ? searchBy : undefined,
  })
  const records = query.data ?? []
  const vehicles = vehiclesQuery.data ?? []

  function search(e: FormEvent) {
    e.preventDefault()
    setSubmitted(input.trim())
    setOffset(0)
  }

  function clear() {
    setInput('')
    setSubmitted('')
    setVehicleFilter('')
    setOffset(0)
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Maintenance records</h1>
        {staff ? (
          <Link to="/app/records/new" className={buttonPrimaryCx}>
            New record
          </Link>
        ) : null}
      </div>

      <form onSubmit={search} className={`${panelCx} flex flex-wrap items-end gap-3`}>
        <div className="min-w-44 flex-1">
          <label htmlFor="record-search" className={labelCx}>
            Search
          </label>
          <input
            id="record-search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. oil change"
            className={inputCx}
          />
        </div>
        <div>
          <label htmlFor="record-field" className={labelCx}>
            Field
          </label>
          <select
            id="record-field"
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value as 'service_type' | 'description')}
            className={inputCx}
          >
            <option value="service_type">Service type</option>
            <option value="description">Description</option>
          </select>
        </div>
        <div>
          <label htmlFor="record-vehicle" className={labelCx}>
            Vehicle
          </label>
          <select
            id="record-vehicle"
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value)
              setOffset(0)
            }}
            className={inputCx}
          >
            <option value="">All vehicles</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                #{vehicle.id} — {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={buttonPrimaryCx}>
          Search
        </button>
        {submitted || vehicleFilter ? (
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
              <th className={thCx}>Service</th>
              <th className={thCx}>Vehicle</th>
              <th className={thCx}>Date</th>
              <th className={`${thCx} text-right`}>Mileage</th>
              <th className={`${thCx} text-right`}>Total</th>
              <th className={thCx}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {records.map((record) => {
              const vehicle = vehicles.find((v) => v.id === record.vehicle_id)
              return (
                <tr key={record.id} className="hover:bg-neutral-50">
                  <td className={tdCx}>
                    <Link
                      to={`/app/records/${record.id}`}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      {record.service_type}
                    </Link>
                  </td>
                  <td className={tdCx}>
                    {vehicle ? `${vehicle.make} ${vehicle.model}` : `#${record.vehicle_id}`}
                  </td>
                  <td className={tdCx}>{record.service_date.slice(0, 10)}</td>
                  <td className={`${tdCx} text-right tabular-nums`}>
                    {record.mileage.toLocaleString()}
                  </td>
                  <td className={`${tdCx} text-right tabular-nums`}>
                    {formatMoney(record.total_cost)}
                  </td>
                  <td className={tdCx}>
                    <span className={statusCx(record.status)}>{statusLabel(record.status)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!query.isPending && records.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-neutral-500">
            {query.isError
              ? 'The list could not be loaded.'
              : submitted || vehicleFilter
                ? 'No records match your filters.'
                : 'No maintenance records yet.'}
          </p>
        ) : null}
        {query.isPending ? (
          <p className="px-6 py-10 text-center text-sm text-neutral-500">Loading…</p>
        ) : null}
      </div>

      {offset > 0 || records.length === PAGE_SIZE ? (
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
            {offset + 1}–{offset + records.length}
          </span>
          <button
            type="button"
            disabled={records.length < PAGE_SIZE}
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
