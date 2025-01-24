import { type Session, type User, type AuthError as SupabaseAuthError } from '@supabase/supabase-js'

// Role and Status Enums
export const UserRoles = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  CUSTOMER: 'customer'
} as const

export type UserRole = typeof UserRoles[keyof typeof UserRoles]

export const TicketStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  CLOSED: 'closed'
} as const

export type TicketStatusType = typeof TicketStatus[keyof typeof TicketStatus]

export const TicketPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const

export type TicketPriorityType = typeof TicketPriority[keyof typeof TicketPriority]

// User and Profile Types
export type UserMetadata = {
  role?: UserRole
  org_id?: string
  display_name?: string
}

export type Profile = {
  user_id: string
  display_name: string
  role: UserRole
  org_id?: string | null
  department?: string | null
  position?: string | null
  created_at: string
  updated_at: string
}

// Extend Supabase User type
export interface AuthUser extends User {
  role: UserRole
  org_id?: string | null
  display_name: string
  department?: string | null
  position?: string | null
  metadata?: UserMetadata
}

// Extend Supabase Session type
export interface AuthSession extends Omit<Session, 'user'> {
  user: AuthUser
}

// Auth Flow Types
export type SignUpCredentials = {
  email: string
  password: string
  role?: UserRole
  display_name?: string
  org_id?: string
  department?: string
  position?: string
}

export type SignInCredentials = {
  email: string
  password: string
}

export type ResetPasswordCredentials = {
  email: string
}

export type UpdatePasswordCredentials = {
  password: string
}

export type UpdateProfileCredentials = {
  display_name?: string
  email?: string
  department?: string
  position?: string
}

// Response Types
export type AuthResponse = {
  user: AuthUser | null
  session: AuthSession | null
  error?: SupabaseAuthError | null
}

// PKCE Types
export type PKCECodePair = {
  codeVerifier: string
  codeChallenge: string
}

export type AuthState = {
  loading: boolean
  user: AuthUser | null
  session: AuthSession | null
  error: SupabaseAuthError | null
}

// Auth Options Types
export interface AuthOptions {
  emailRedirectTo?: string
  data?: Record<string, any>
  captchaToken?: string
  codeChallenge?: string
  codeChallengeMethod?: 'S256'
}

export type RLSPolicies = {
  canReadTicket: (userId: string, ticketId: string) => Promise<boolean>
  canCreateTicket: (userId: string) => Promise<boolean>
  canUpdateTicket: (userId: string, ticketId: string) => Promise<boolean>
  canDeleteTicket: (userId: string, ticketId: string) => Promise<boolean>
} 