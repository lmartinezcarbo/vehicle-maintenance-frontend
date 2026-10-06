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

/* ------------------------------------------------------------------ *
 * Vehicles (GET/POST /vehicles, …) — reference of the F24 endpoints. *
 * ------------------------------------------------------------------ */

export interface Vehicle {
  id: number
  user_id: number
  make: string
  model: string
  year: number
  vin: string
  mileage: number
  verified: boolean
  has_photo: boolean
  created_at: string
}

export interface VehicleCreate {
  user_id?: number | null
  make: string
  model: string
  year: number
  vin: string
  mileage: number
}

export interface VehicleUpdate {
  make?: string
  model?: string
  year?: number
  vin?: string
  mileage?: number
}

/* ------------------------- Maintenance records --------------------- */

export type RecordStatus = 'in_progress' | 'ready' | 'completed'

export interface MaintenanceRecord {
  id: number
  vehicle_id: number
  service_type: string
  description: string
  mileage: number
  service_date: string
  /** Decimal serialized as a string by the API ("45.00"). */
  labor_cost: string
  total_cost: string
  status: RecordStatus
  notes: string | null
  created_at: string
}

export interface MaintenanceRecordCreate {
  vehicle_id: number
  service_type: string
  description: string
  mileage: number
  service_date: string
  labor_cost: number | string
  notes?: string | null
}

export interface MaintenanceRecordUpdate {
  service_type?: string
  description?: string
  mileage?: number
  service_date?: string
  labor_cost?: number | string
  notes?: string | null
}

/* ----------------------------- Parts catalog ----------------------- */

export interface Part {
  id: number
  name: string
  manufacturer: string
  part_number: string
  description: string | null
}

export interface PartCreate {
  name: string
  manufacturer: string
  part_number: string
  description?: string | null
}

/* ------------------- Part lines inside a record -------------------- */

export interface MaintenancePart {
  id: number
  maintenance_record_id: number
  part_id: number
  quantity: number
  unit_cost: string
}

export interface MaintenancePartCreate {
  maintenance_record_id: number
  part_id: number
  quantity: number
  unit_cost: number | string
}

export interface MaintenancePartUpdate {
  quantity?: number
  unit_cost?: number | string
}

/* ------------------------------ Expenses --------------------------- */

export interface Expense {
  id: number
  vehicle_id: number
  maintenance_record_id: number | null
  category: string
  /** Decimal serialized as a string by the API ("120.50"). */
  amount: string
  description: string | null
  expense_date: string
  created_at: string
}

export interface ExpenseCreate {
  vehicle_id: number
  maintenance_record_id?: number | null
  category: string
  amount: number | string
  description?: string | null
  expense_date: string
}

export interface ExpenseUpdate {
  category?: string
  amount?: number | string
  description?: string | null
  expense_date?: string
}

/* ------------------------------------------------------------------ *
 * Payments (F25) — POST /payments/ (Stripe Checkout) · GET /payments/{id} *
 * ------------------------------------------------------------------ */

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'

export interface Payment {
  id: number
  maintenance_record_id: number
  /** Decimal serialized as string ("89.99"). */
  amount: string
  currency: string
  status: PaymentStatus
  stripe_checkout_session_id: string | null
  created_at: string
  paid_at: string | null
  /** Only on creation: the URL the browser must open at Stripe. */
  checkout_url?: string
}

export interface PaymentCreate {
  maintenance_record_id: number
}

/** PATCH /users/{id}/role — admin only. */
export interface UserRoleUpdate {
  role: Role
}

/* --------------------- Shared list query params -------------------- */

/** Every GET collection accepts these (defaults: limit 10, offset 0). */
export interface ListParams {
  limit?: number
  offset?: number
  sort_by?: string
  order?: 'asc' | 'desc'
  search?: string
  search_by?: string
}
