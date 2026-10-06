import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiBlob } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { ListParams, Vehicle, VehicleCreate, VehicleUpdate } from '../types/api'

export interface VehicleListParams extends ListParams {
  make?: string
  model?: string
  year?: number
  search?: string
  search_by?: 'make' | 'model' | 'vin'
}

/** Vehicles visible to the current user (the server filters by role). */
export function useVehicles(params: VehicleListParams = {}) {
  return useQuery<Vehicle[]>({
    queryKey: queryKeys.vehicles(params),
    queryFn: () => api<Vehicle[]>('/vehicles/', { query: { ...params } }),
    placeholderData: (previous) => previous,
  })
}

export function useVehicle(id: number) {
  return useQuery<Vehicle>({
    queryKey: queryKeys.vehicle(id),
    enabled: Number.isFinite(id),
    queryFn: () => api<Vehicle>(`/vehicles/${id}`),
  })
}

/**
 * The photo endpoint requires the Authorization header, so <img src> can't
 * point at it directly: fetch the bytes and hand out an object URL, which
 * is revoked when the component unmounts or the blob changes.
 */
export function useVehiclePhotoUrl(vehicle: Pick<Vehicle, 'id' | 'has_photo'>) {
  const photo = useQuery<Blob>({
    queryKey: queryKeys.vehiclePhoto(vehicle.id),
    enabled: vehicle.has_photo,
    staleTime: Infinity,
    queryFn: () => apiBlob(`/vehicles/${vehicle.id}/photo`),
  })
  const [url, setUrl] = useState<string | null>(null)
  /* The effect syncs local state with the fetched blob (external system);
   * deriving the URL during render would create/revoke blobs on every pass. */
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    if (!photo.data) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(photo.data)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [photo.data])
  /* oxlint-enable react/set-state-in-effect */
  return { ...photo, url }
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: VehicleCreate) => api<Vehicle>('/vehicles/', { method: 'POST', json: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: VehicleUpdate }) =>
      api<Vehicle>(`/vehicles/${id}`, { method: 'PATCH', json: input }),
    onSuccess: (_vehicle, { id }) => {
      void qc.invalidateQueries({ queryKey: ['vehicles'] })
      void qc.invalidateQueries({ queryKey: queryKeys.vehicle(id) })
    },
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<{ message: string }>(`/vehicles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

/** mechanic/admin only: flips verified to true (irreversible). */
export function useVerifyVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<Vehicle>(`/vehicles/${id}/verify`, { method: 'PATCH' }),
    onSuccess: (_vehicle, id) => {
      void qc.invalidateQueries({ queryKey: ['vehicles'] })
      void qc.invalidateQueries({ queryKey: queryKeys.vehicle(id) })
    },
  })
}

export function useUploadVehiclePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const data = new FormData()
      data.append('file', file)
      return api<{ message: string }>(`/vehicles/${id}/photo`, { method: 'POST', formData: data })
    },
    onSuccess: (_result, { id }) => {
      void qc.invalidateQueries({ queryKey: ['vehicles'] })
      void qc.invalidateQueries({ queryKey: queryKeys.vehicle(id) })
      void qc.invalidateQueries({ queryKey: queryKeys.vehiclePhoto(id) })
    },
  })
}

export function useDeleteVehiclePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<{ message: string }>(`/vehicles/${id}/photo`, { method: 'DELETE' }),
    onSuccess: (_result, id) => {
      void qc.invalidateQueries({ queryKey: ['vehicles'] })
      void qc.invalidateQueries({ queryKey: queryKeys.vehicle(id) })
      void qc.invalidateQueries({ queryKey: queryKeys.vehiclePhoto(id) })
    },
  })
}
