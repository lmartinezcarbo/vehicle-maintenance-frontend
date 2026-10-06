import { useState, type FormEvent } from 'react'
import { useCreateExpense, useDeleteExpense, useExpenses, useUpdateExpense } from '../../hooks/useExpenses'
import type { Expense } from '../../types/api'
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
  today,
} from '../../lib/ui'

/**
 * Expenses linked to this record (the server also checks the vehicle).
 * They never feed total_cost nor the Stripe charge — stated in the UI.
 */
export function RecordExpensesSection({
  recordId,
  vehicleId,
  editable,
}: {
  recordId: number
  vehicleId: number
  editable: boolean
}) {
  const expensesQuery = useExpenses({ maintenance_record_id: recordId, limit: 100 })
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const remove = useDeleteExpense()

  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('0')
  const [date, setDate] = useState(today())
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editCategory, setEditCategory] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')

  const expenses = expensesQuery.data ?? []

  function addExpense(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const amountNum = Number(amount)
    if (!category.trim()) {
      setError('Category is required.')
      return
    }
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      setError('Amount must be 0 or more.')
      return
    }
    if (!date) {
      setError('Pick the expense date.')
      return
    }
    create.mutate(
      {
        vehicle_id: vehicleId,
        maintenance_record_id: recordId,
        category: category.trim(),
        amount: amountNum,
        expense_date: date,
        description: description.trim() ? description.trim() : null,
      },
      {
        onSuccess: () => {
          setCategory('')
          setAmount('0')
          setDescription('')
        },
        onError: (err) => setError(apiErrorMessage(err)),
      },
    )
  }

  function startEdit(expense: Expense) {
    setError(null)
    setEditingId(expense.id)
    setEditCategory(expense.category)
    setEditAmount(String(Number(expense.amount)))
    setEditDate(expense.expense_date.slice(0, 10))
  }

  function saveEdit(id: number) {
    setError(null)
    const amountNum = Number(editAmount)
    if (!editCategory.trim()) {
      setError('Category is required.')
      return
    }
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      setError('Amount must be 0 or more.')
      return
    }
    if (!editDate) {
      setError('Pick the expense date.')
      return
    }
    update.mutate(
      {
        id,
        input: { category: editCategory.trim(), amount: amountNum, expense_date: editDate },
      },
      {
        onSuccess: () => setEditingId(null),
        onError: (err) => setError(apiErrorMessage(err)),
      },
    )
  }

  function removeExpense(id: number) {
    setError(null)
    if (!window.confirm('Delete this expense?')) return
    remove.mutate(id, { onError: (err) => setError(apiErrorMessage(err)) })
  }

  return (
    <section className={panelCx}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">Expenses</h2>
        <span className="text-xs text-neutral-400">Not counted in total_cost</span>
      </div>

      {error ? (
        <div className={`${errorCx} mt-3`} role="alert">
          {error}
        </div>
      ) : null}

      {expensesQuery.isPending ? (
        <p className="mt-3 text-sm text-neutral-500">Loading…</p>
      ) : expenses.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No expenses on this record yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-neutral-200">
              <tr>
                <th className={thCx}>Category</th>
                <th className={`${thCx} text-right`}>Amount</th>
                <th className={thCx}>Date</th>
                {editable ? <th className={thCx}>Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {expenses.map((expense) => {
                const editing = editingId === expense.id
                return (
                  <tr key={expense.id}>
                    {editing ? (
                      <>
                        <td className={tdCx}>
                          <input
                            aria-label="Category"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className={`${inputCx} w-32`}
                          />
                        </td>
                        <td className={`${tdCx} text-right`}>
                          <input
                            aria-label="Amount"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            inputMode="decimal"
                            className={`${inputCx} w-24 text-right`}
                          />
                        </td>
                        <td className={tdCx}>
                          <input
                            aria-label="Date"
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className={`${inputCx} w-38`}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={tdCx}>
                          {expense.category}
                          {expense.description ? (
                            <span className="block text-xs text-neutral-400">
                              {expense.description}
                            </span>
                          ) : null}
                        </td>
                        <td className={`${tdCx} text-right tabular-nums`}>
                          {formatMoney(expense.amount)}
                        </td>
                        <td className={tdCx}>{expense.expense_date.slice(0, 10)}</td>
                      </>
                    )}
                    {editable ? (
                      <td className={tdCx}>
                        <div className="flex justify-end gap-2">
                          {editing ? (
                            <>
                              <button
                                type="button"
                                disabled={update.isPending}
                                onClick={() => saveEdit(expense.id)}
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
                                onClick={() => startEdit(expense)}
                                className={buttonSecondaryCx}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={remove.isPending}
                                onClick={() => removeExpense(expense.id)}
                                className={buttonDangerCx}
                              >
                                Delete
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
        <form
          onSubmit={addExpense}
          className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-100 pt-4"
        >
          <div className="min-w-36 flex-1">
            <label htmlFor="expense-category" className={labelCx}>
              Category
            </label>
            <input
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Towing"
              className={inputCx}
            />
          </div>
          <div>
            <label htmlFor="expense-amount" className={labelCx}>
              Amount
            </label>
            <input
              id="expense-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className={`${inputCx} w-24`}
            />
          </div>
          <div>
            <label htmlFor="expense-date" className={labelCx}>
              Date
            </label>
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputCx} w-38`}
            />
          </div>
          <div className="min-w-36 flex-1">
            <label htmlFor="expense-description" className={labelCx}>
              Description <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              id="expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCx}
            />
          </div>
          <button type="submit" disabled={create.isPending} className={buttonPrimaryCx}>
            {create.isPending ? 'Adding…' : 'Add expense'}
          </button>
        </form>
      ) : null}
    </section>
  )
}
