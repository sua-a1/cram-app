export type UserRole = 'customer' | 'employee' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  displayName: string
  createdAt: string
  updatedAt: string
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