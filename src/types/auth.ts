export type UserRole = 'admin' | 'employee' | 'customer'

export type UserMetadata = {
  org_id?: string
  [key: string]: any
}

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  display_name: string
  created_at: string
  updated_at: string
  metadata?: UserMetadata
}

export type AuthSession = {
  user: AuthUser | null
  expires_at: number
}

export type SignUpCredentials = {
  email: string
  password: string
  role?: UserRole
  display_name?: string
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
}

export type AuthResponse = {
  user: AuthUser | null
  session: AuthSession | null
  error?: string
} 