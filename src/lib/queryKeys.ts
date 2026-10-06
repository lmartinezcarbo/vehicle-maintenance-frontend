import type { ListParams } from '../types/api'

/**
 * Query key factory. List keys carry the params object so each filtered
 * view caches on its own; invalidations use the string prefix
 * (e.g. ['vehicles'] matches every list of vehicles).
 */
export const queryKeys = {
  vehicles: (params: ListParams = {}) => ['vehicles', params] as const,
  vehicle: (id: number) => ['vehicle', id] as const,
  vehiclePhoto: (id: number) => ['vehicle-photo', id] as const,
  records: (params: ListParams = {}) => ['records', params] as const,
  record: (id: number) => ['record', id] as const,
  parts: (params: ListParams = {}) => ['parts', params] as const,
  maintenanceParts: (params: ListParams = {}) => ['maintenance-parts', params] as const,
  expenses: (params: ListParams = {}) => ['expenses', params] as const,
  payment: (id: number) => ['payment', id] as const,
  users: (params: ListParams = {}) => ['users', params] as const,
}
