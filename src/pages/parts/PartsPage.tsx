import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/auth-context'
import { useCreatePart, useDeletePart, useParts, useUpdatePart } from '../../hooks/useParts'
import type { Part } from '../../types/api'
import {
  apiErrorMessage,
  buttonDangerCx,
  buttonPrimaryCx,
  buttonSecondaryCx,
  errorCx,
  inputCx,
  labelCx,
  panelCx,
  tdCx,
  thCx,
} from '../../lib/ui'

const PAGE_SIZE = 10

/**
 * The shared catalog. Every role reads it (the record's "Add line" select
 * is fed from here); only admins write — POST/PATCH/DELETE answer 403.
 */
export default function PartsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [searchBy, setSearchBy] = useState<'name' | 'manufacturer' | 'part_number'>('name')
  const [offset, setOffset] = useState(0)

  const query = useParts({
    limit: PAGE_SIZE,
    offset,
    search: submitted || undefined,
    search_by: submitted ? searchBy : undefined,
  })
  const parts = query.data ?? []

  const create = useCreatePart()
  const update = useUpdatePart()
  const remove = useDeletePart()

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

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

  function openCreate() {
    setEditId(null)
    setName('')
    setManufacturer('')
    setPartNumber('')
    setDescription('')
    setError(null)
    setFormOpen(true)
  }

  function openEdit(part: Part) {
    setEditId(part.id)
    setName(part.name)
    setManufacturer(part.manufacturer)
    setPartNumber(part.part_number)
    setDescription(part.description ?? '')
    setError(null)
    setFormOpen(true)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !manufacturer.trim() || !partNumber.trim()) {
      setError('Name, manufacturer and part number are required.')
      return
    }
    const body = {
      name: name.trim(),
      manufacturer: manufacturer.trim(),
      part_number: partNumber.trim(),
      description: description.trim() ? description.trim() : null,
    }
    const done = { onSuccess: () => setFormOpen(false), onError: (err: Error) => setError(apiErrorMessage(err)) }
    if (editId === null) create.mutate(body, done)
    else update.mutate({ id: editId, input: body }, done)
  }

  function deletePart(part: Part) {
    setError(null)
    if (!window.confirm(`Delete "${part.name}" from the catalog?`)) return
    remove.mutate(part.id, { onError: (err) => setError(apiErrorMessage(err)) })
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Parts catalog</h1>
        {isAdmin && !formOpen ? (
          <button type="button" onClick={openCreate} className={buttonPrimaryCx}>
            New part
          </button>
        ) : null}
      </div>

      <form onSubmit={search} className={`${panelCx} flex flex-wrap items-end gap-3`}>
        <div className="min-w-44 flex-1">
          <label htmlFor="part-search" className={labelCx}>
            Search
          </label>
          <input
            id="part-search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. brake pads"
            className={inputCx}
          />
        </div>
        <div>
          <label htmlFor="part-field" className={labelCx}>
            Field
          </label>
          <select
            id="part-field"
            value={searchBy}
            onChange={(e) =>
              setSearchBy(e.target.value as 'name' | 'manufacturer' | 'part_number')
            }
            className={inputCx}
          >
            <option value="name">Name</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="part_number">Part number</option>
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

      {isAdmin && formOpen ? (
        <form onSubmit={submit} className={`${panelCx} space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-500">
              {editId === null ? 'New part' : `Edit part #${editId}`}
            </h2>
            <span className="text-xs text-neutral-400">Admin · 20 changes/min</span>
          </div>
          {error ? (
            <div className={errorCx} role="alert">
              {error}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-name" className={labelCx}>
                Name
              </label>
              <input
                id="p-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Brake pads"
                className={inputCx}
              />
            </div>
            <div>
              <label htmlFor="p-manufacturer" className={labelCx}>
                Manufacturer
              </label>
              <input
                id="p-manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Bosch"
                className={inputCx}
              />
            </div>
            <div>
              <label htmlFor="p-number" className={labelCx}>
                Part number
              </label>
              <input
                id="p-number"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="BP-001"
                className={inputCx}
              />
            </div>
            <div>
              <label htmlFor="p-description" className={labelCx}>
                Description <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <input
                id="p-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCx}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              className={buttonPrimaryCx}
            >
              {editId === null
                ? create.isPending
                  ? 'Creating…'
                  : 'Create part'
                : update.isPending
                  ? 'Saving…'
                  : 'Save changes'}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className={buttonSecondaryCx}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {query.isError ? (
        <div className={errorCx} role="alert">
          {apiErrorMessage(query.error)}
        </div>
      ) : null}
      {!formOpen && error ? (
        <div className={errorCx} role="alert">
          {error}
        </div>
      ) : null}

      <div className={`${panelCx} overflow-x-auto p-0`}>
        <table className="w-full">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className={thCx}>Name</th>
              <th className={thCx}>Manufacturer</th>
              <th className={thCx}>Part number</th>
              {isAdmin ? <th className={thCx}>Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {parts.map((part) => (
              <tr key={part.id} className="hover:bg-neutral-50">
                <td className={tdCx}>
                  <span className="font-medium text-neutral-800">{part.name}</span>
                  {part.description ? (
                    <span className="block text-xs text-neutral-400">{part.description}</span>
                  ) : null}
                </td>
                <td className={tdCx}>{part.manufacturer}</td>
                <td className={`${tdCx} tabular-nums`}>{part.part_number}</td>
                {isAdmin ? (
                  <td className={tdCx}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(part)}
                        className={buttonSecondaryCx}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={remove.isPending}
                        onClick={() => deletePart(part)}
                        className={buttonDangerCx}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {!query.isPending && parts.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-neutral-500">
            {query.isError
              ? 'The catalog could not be loaded.'
              : submitted
                ? 'No parts match your search.'
                : isAdmin
                  ? 'The catalog is empty — create the first part.'
                  : 'The catalog is empty.'}
          </p>
        ) : null}
        {query.isPending ? (
          <p className="px-6 py-10 text-center text-sm text-neutral-500">Loading…</p>
        ) : null}
      </div>

      {offset > 0 || parts.length === PAGE_SIZE ? (
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
            {offset + 1}–{offset + parts.length}
          </span>
          <button
            type="button"
            disabled={parts.length < PAGE_SIZE}
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
