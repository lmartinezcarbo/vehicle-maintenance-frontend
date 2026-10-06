import { useState, type FormEvent } from 'react'
import {
  useCreateMaintenancePart,
  useDeleteMaintenancePart,
  useMaintenanceParts,
  useParts,
  useUpdateMaintenancePart,
} from '../../hooks/useParts'
import type { MaintenancePart } from '../../types/api'
import {
  apiErrorMessage,
  buttonDangerCx,
  buttonPrimaryCx,
  buttonSecondaryCx,
  errorCx,
  formatMoney,
  inputCx,
  labelCx,
  panelCx,
  tdCx,
  thCx,
} from '../../lib/ui'

/**
 * Lines of parts used by the record: each line refreshes the record's
 * total_cost (the hook invalidates it). Writes require staff role and
 * status `in_progress`, enforced by the server and mirrored by `editable`.
 */
export function RecordPartsSection({
  recordId,
  editable,
}: {
  recordId: number
  editable: boolean
}) {
  const linesQuery = useMaintenanceParts({ maintenance_record_id: recordId, limit: 100 })
  const partsQuery = useParts({ limit: 100 })
  const createLine = useCreateMaintenancePart()
  const updateLine = useUpdateMaintenancePart()
  const deleteLine = useDeleteMaintenancePart()

  const [partId, setPartId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitCost, setUnitCost] = useState('0')
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editCost, setEditCost] = useState('')

  const lines = linesQuery.data ?? []
  const parts = partsQuery.data ?? []
  const partById = new Map(parts.map((part) => [part.id, part]))
  const usedPartIds = new Set(lines.map((line) => line.part_id))
  const available = parts.filter((part) => !usedPartIds.has(part.id))
  const partsSubtotal = lines.reduce(
    (sum, line) => sum + Number(line.quantity) * Number(line.unit_cost),
    0,
  )

  function addLine(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const qty = Number(quantity)
    const cost = Number(unitCost)
    if (!partId) {
      setError('Choose a part from the catalog.')
      return
    }
    if (!Number.isInteger(qty) || qty < 1) {
      setError('Quantity must be a whole number of 1 or more.')
      return
    }
    if (!Number.isFinite(cost) || cost < 0) {
      setError('Unit cost must be 0 or more.')
      return
    }
    createLine.mutate(
      { maintenance_record_id: recordId, part_id: Number(partId), quantity: qty, unit_cost: cost },
      {
        onSuccess: () => {
          setPartId('')
          setQuantity('1')
          setUnitCost('0')
        },
        onError: (err) => setError(apiErrorMessage(err)),
      },
    )
  }

  function startEdit(line: MaintenancePart) {
    setError(null)
    setEditingId(line.id)
    setEditQty(String(line.quantity))
    setEditCost(String(Number(line.unit_cost)))
  }

  function saveEdit(id: number) {
    setError(null)
    const qty = Number(editQty)
    const cost = Number(editCost)
    if (!Number.isInteger(qty) || qty < 1) {
      setError('Quantity must be a whole number of 1 or more.')
      return
    }
    if (!Number.isFinite(cost) || cost < 0) {
      setError('Unit cost must be 0 or more.')
      return
    }
    updateLine.mutate(
      { id, input: { quantity: qty, unit_cost: cost } },
      {
        onSuccess: () => setEditingId(null),
        onError: (err) => setError(apiErrorMessage(err)),
      },
    )
  }

  function removeLine(id: number) {
    setError(null)
    if (!window.confirm('Remove this part line from the record?')) return
    deleteLine.mutate(id, { onError: (err) => setError(apiErrorMessage(err)) })
  }

  return (
    <section className={panelCx}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">Parts used</h2>
        {lines.length > 0 ? (
          <span className="text-sm tabular-nums text-neutral-700">
            Subtotal {formatMoney(partsSubtotal)}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className={`${errorCx} mt-3`} role="alert">
          {error}
        </div>
      ) : null}

      {linesQuery.isPending ? (
        <p className="mt-3 text-sm text-neutral-500">Loading…</p>
      ) : lines.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No parts on this record yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-neutral-200">
              <tr>
                <th className={thCx}>Part</th>
                <th className={`${thCx} text-right`}>Qty</th>
                <th className={`${thCx} text-right`}>Unit</th>
                <th className={`${thCx} text-right`}>Subtotal</th>
                {editable ? <th className={thCx}>Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {lines.map((line) => {
                const part = partById.get(line.part_id)
                const editing = editingId === line.id
                return (
                  <tr key={line.id}>
                    <td className={tdCx}>
                      {part ? (
                        <>
                          {part.name}{' '}
                          <span className="text-neutral-400">· {part.part_number}</span>
                        </>
                      ) : (
                        `#${line.part_id}`
                      )}
                    </td>
                    {editing ? (
                      <>
                        <td className={`${tdCx} text-right`}>
                          <input
                            aria-label="Quantity"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            inputMode="numeric"
                            className={`${inputCx} w-16 text-right`}
                          />
                        </td>
                        <td className={`${tdCx} text-right`}>
                          <input
                            aria-label="Unit cost"
                            value={editCost}
                            onChange={(e) => setEditCost(e.target.value)}
                            inputMode="decimal"
                            className={`${inputCx} w-24 text-right`}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={`${tdCx} text-right tabular-nums`}>{line.quantity}</td>
                        <td className={`${tdCx} text-right tabular-nums`}>
                          {formatMoney(line.unit_cost)}
                        </td>
                      </>
                    )}
                    <td className={`${tdCx} text-right tabular-nums`}>
                      {formatMoney(Number(line.quantity) * Number(line.unit_cost))}
                    </td>
                    {editable ? (
                      <td className={tdCx}>
                        <div className="flex justify-end gap-2">
                          {editing ? (
                            <>
                              <button
                                type="button"
                                disabled={updateLine.isPending}
                                onClick={() => saveEdit(line.id)}
                                className={buttonPrimaryCx}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className={buttonSecondaryCx}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(line)}
                                className={buttonSecondaryCx}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={deleteLine.isPending}
                                onClick={() => removeLine(line.id)}
                                className={buttonDangerCx}
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editable ? (
        <form onSubmit={addLine} className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-100 pt-4">
          <div className="min-w-44 flex-1">
            <label htmlFor="line-part" className={labelCx}>
              Part
            </label>
            <select
              id="line-part"
              value={partId}
              onChange={(e) => setPartId(e.target.value)}
              className={inputCx}
            >
              <option value="">
                {partsQuery.isPending
                  ? 'Loading catalog…'
                  : available.length > 0
                    ? 'Choose a part'
                    : 'No parts left in the catalog (an admin adds them)'}
              </option>
              {available.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name} · {part.part_number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="line-qty" className={labelCx}>
              Qty
            </label>
            <input
              id="line-qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputMode="numeric"
              className={`${inputCx} w-20`}
            />
          </div>
          <div>
            <label htmlFor="line-cost" className={labelCx}>
              Unit cost
            </label>
            <input
              id="line-cost"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              inputMode="decimal"
              className={`${inputCx} w-28`}
            />
          </div>
          <button type="submit" disabled={createLine.isPending} className={buttonPrimaryCx}>
            {createLine.isPending ? 'Adding…' : 'Add line'}
          </button>
        </form>
      ) : null}
    </section>
  )
}
