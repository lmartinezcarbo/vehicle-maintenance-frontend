import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { ListParams, User, UserRoleUpdate } from '../types/api'

export interface UserListParams extends ListParams {
  name?: string
  search?: string
  search_by?: 'name' | 'email'
}

/**
 * GET /users/: an admin gets everybody (paginated/filterable); any other
 * role gets back a one-element list with its own profile — the admin panel
 * guards on the role before ever rendering this.
 */
export function useUsers(params: UserListParams = {}) {
  return useQuery<User[]>({
    queryKey: queryKeys.users(params),
    queryFn: () => api<User[]>('/users/', { query: { ...params } }),
    placeholderData: (previous) => previous,
  })
}

/** Admin only, 5/min. The server refuses to demote your own admin role. */
export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: number } & UserRoleUpdate) =>
      api<User>(`/users/${id}/role`, { method: 'PATCH', json: { role } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
