import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type {
  ListParams,
  MaintenanceRecord,
  MaintenanceRecordCreate,
  MaintenanceRecordUpdate,
} from '../types/api'

export interface RecordListParams extends ListParams {
  vehicle_id?: number
  service_type?: string
  search?: string
  search_by?: 'service_type' | 'description'
}

export function useRecords(params: RecordListParams = {}) {
  return useQuery<MaintenanceRecord[]>({
    queryKey: queryKeys.records(params),
    queryFn: () => api<MaintenanceRecord[]>('/maintenance-records/', { query: { ...params } }),
    placeholderData: (previous) => previous,
  })
}

export function useMaintenanceRecord(id: number) {
  return useQuery<MaintenanceRecord>({
    queryKey: queryKeys.record(id),
    enabled: Number.isFinite(id),
    queryFn: () => api<MaintenanceRecord>(`/maintenance-records/${id}`),
  })
}

/** mechanic/admin only; the record starts as `in_progress`. */
export function useCreateMaintenanceRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MaintenanceRecordCreate) =>
      api<MaintenanceRecord>('/maintenance-records/', { method: 'POST', json: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['records'] })
    },
  })
}

/** Only allowed while the record is still `in_progress`. */
export function useUpdateMaintenanceRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: MaintenanceRecordUpdate }) =>
      api<MaintenanceRecord>(`/maintenance-records/${id}`, { method: 'PATCH', json: input }),
    onSuccess: (_record, { id }) => {
      void qc.invalidateQueries({ queryKey: ['records'] })
      void qc.invalidateQueries({ queryKey: queryKeys.record(id) })
    },
  })
}

export function useDeleteMaintenanceRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/maintenance-records/${id}`, { method: 'DELETE' }),
    onSuccess: (_result, id) => {
      void qc.invalidateQueries({ queryKey: ['records'] })
      void qc.invalidateQueries({ queryKey: queryKeys.record(id) })
    },
  })
}

/**
 * The only client-side transition: `in_progress → ready` (sends the
 * "Your vehicle is ready" email). `ready → completed` happens exclusively
 * in the signed Stripe webhook.
 */
export function useMarkRecordReady() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<MaintenanceRecord>(`/maintenance-records/${id}/status`, {
        method: 'PATCH',
        json: { status: 'ready' },
      }),
    onSuccess: (_record, id) => {
      void qc.invalidateQueries({ queryKey: ['records'] })
      void qc.invalidateQueries({ queryKey: queryKeys.record(id) })
    },
  })
}
