import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type {
  ListParams,
  MaintenancePart,
  MaintenancePartCreate,
  MaintenancePartUpdate,
  Part,
  PartCreate,
} from '../types/api'

export interface PartListParams extends ListParams {
  manufacturer?: string
  part_number?: string
  search?: string
  search_by?: 'name' | 'manufacturer' | 'part_number' | 'description'
}

/** Shared catalog: every authenticated role can read it. */
export function useParts(params: PartListParams = {}) {
  return useQuery<Part[]>({
    queryKey: queryKeys.parts(params),
    queryFn: () => api<Part[]>('/parts/', { query: { ...params } }),
    placeholderData: (previous) => previous,
  })
}

export interface MaintenancePartListParams extends ListParams {
  maintenance_record_id?: number
  part_id?: number
}

/** Lines of parts used by a record: total_cost = labor + Σ qty × unit_cost. */
export function useMaintenanceParts(params: MaintenancePartListParams = {}) {
  return useQuery<MaintenancePart[]>({
    queryKey: queryKeys.maintenanceParts(params),
    queryFn: () => api<MaintenancePart[]>('/maintenance-part/', { query: { ...params } }),
    placeholderData: (previous) => previous,
  })
}

/** Adding/removing a part changes the record's total_cost: refresh both. */
function invalidateLinesAndRecord(qc: QueryClient, recordId: number) {
  void qc.invalidateQueries({ queryKey: ['maintenance-parts'] })
  void qc.invalidateQueries({ queryKey: ['records'] })
  void qc.invalidateQueries({ queryKey: queryKeys.record(recordId) })
}

/** mechanic/admin, record `in_progress`, vehicle verified. */
export function useCreateMaintenancePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MaintenancePartCreate) =>
      api<MaintenancePart>('/maintenance-part/', { method: 'POST', json: input }),
    onSuccess: (line) => invalidateLinesAndRecord(qc, line.maintenance_record_id),
  })
}

export function useUpdateMaintenancePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: MaintenancePartUpdate }) =>
      api<MaintenancePart>(`/maintenance-part/${id}`, { method: 'PATCH', json: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['maintenance-parts'] })
      void qc.invalidateQueries({ queryKey: ['records'] })
    },
  })
}

export function useDeleteMaintenancePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/maintenance-part/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['maintenance-parts'] })
      void qc.invalidateQueries({ queryKey: ['records'] })
    },
  })
}

/* ---------------------- Catalog CRUD (admin) ---------------------- */

/** Admin only (403 otherwise): every catalog view refreshes. */
export function useCreatePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PartCreate) =>
      api<Part>('/parts/', { method: 'POST', json: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['parts'] })
    },
  })
}

export function useUpdatePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<PartCreate> }) =>
      api<Part>(`/parts/${id}`, { method: 'PATCH', json: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['parts'] })
    },
  })
}

export function useDeletePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string }>(`/parts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['parts'] })
      // Lines already using the part keep their own copy: nothing to refresh.
    },
  })
}
