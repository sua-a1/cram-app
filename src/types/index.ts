export type UserRole = 'customer' | 'employee' | 'admin'

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