export type Role = 'customer' | 'mechanic' | 'admin'

export interface User {
  id: number
  role: Role
  name: string
  email: string
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}

/** Login never hands back tokens: 2FA is mandatory and codes go by email. */
export interface LoginRequires2fa {
  message: string
  requires_2fa: true
}
