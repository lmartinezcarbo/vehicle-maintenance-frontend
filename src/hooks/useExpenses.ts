import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { Expense, ExpenseCreate, ExpenseUpdate, ListParams } from '../types/api'

export interface ExpenseListParams extends ListParams {
  vehicle_id?: number
  maintenance_record_id?: number
  category?: string
  search?: string
  search_by?: 'category' | 'description'
}

export function useExpenses(params: ExpenseListParams = {}) {
  return useQuery<Expense[]>({
    queryKey: queryKeys.expenses(params),
    queryFn: () => api<Expense[]>('/expenses/', { query: { ...params } }),
    placeholderData: (previous) => previous,
  })
}

/** mechanic/admin; vehicle verified. Expenses never feed total_cost. */
export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ExpenseCreate) => api<Expense>('/expenses/', { method: 'POST', json: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

/** Blocked by the server when the linked record is not `in_progress`. */
export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ExpenseUpdate }) =>
      api<Expense>(`/expenses/${id}`, { method: 'PATCH', json: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<{ message: string }>(`/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
