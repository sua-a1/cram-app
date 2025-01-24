// Re-export all types from their respective modules
export * from './database.types'
export { UserRoles } from './auth'
export type {
  UserRole,
  AuthUser,
  AuthSession,
  SignUpCredentials,
  SignInCredentials,
  AuthResponse,
  PKCECodePair,
  AuthOptions,
  RLSPolicies,
  Profile
} from './auth'

// Additional shared types
export type ErrorResponse = {
  message: string
  status?: number
  details?: unknown
}

export type SuccessResponse<T = unknown> = {
  data: T
  message?: string
}

export type ApiResponse<T = unknown> = {
  data?: T
  error?: ErrorResponse
  status: number
}

// Utility types
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
export type WithOptional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] }

// Common type guards
export function isErrorResponse(obj: unknown): obj is ErrorResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    typeof (obj as ErrorResponse).message === 'string'
  )
}

export function isSuccessResponse<T>(obj: unknown): obj is SuccessResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'data' in obj
  )
}

// Common type assertions
export function assertIsError(obj: unknown): asserts obj is ErrorResponse {
  if (!isErrorResponse(obj)) {
    throw new Error('Expected an error response')
  }
}

export function assertIsSuccess<T>(obj: unknown): asserts obj is SuccessResponse<T> {
  if (!isSuccessResponse<T>(obj)) {
    throw new Error('Expected a success response')
  }
}

export interface User {
  id: string
  email: string
  display_name: string
  role: 'admin' | 'employee' | 'customer'
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  userId: string
  subject: string
  description?: string
  status: 'open' | 'in-progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  assignedTeam?: string
  assignedEmployee?: string
}

export interface Team {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type NotificationType = 'status_update' | 'new_message';

export interface NotificationMetadata {
    // For status updates
    old_status?: string;
    new_status?: string;
    updated_by?: string;
    
    // For new messages
    author_id?: string;
    author_role?: string;
    message_preview?: string;
}

export interface Notification {
    id: string;
    user_id: string;
    ticket_id: string;
    type: NotificationType;
    message: string;
    read: boolean;
    message_id?: string;
    created_at: string;
    metadata: NotificationMetadata;
}

export interface NotificationFilters {
    read?: boolean;
    type?: NotificationType;
    limit?: number;
    offset?: number;
} 