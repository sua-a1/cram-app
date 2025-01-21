import { type RLSPolicies } from '@/types/auth'
import { getUserRole } from './auth-logic'

export const rlsPolicies: RLSPolicies = {
  async canReadTicket(userId: string, ticketId: string): Promise<boolean> {
    const role = await getUserRole(userId)
    if (!role) return false
    
    // Admins and employees can read all tickets
    if (role === 'admin' || role === 'employee') return true
    
    // Customers can only read their own tickets
    // This will need to be checked against the ticket's customer_id
    return role === 'customer'
  },

  async canCreateTicket(userId: string): Promise<boolean> {
    const role = await getUserRole(userId)
    // All authenticated users can create tickets
    return !!role
  },

  async canUpdateTicket(userId: string, ticketId: string): Promise<boolean> {
    const role = await getUserRole(userId)
    if (!role) return false
    
    // Only admins and employees can update tickets
    return role === 'admin' || role === 'employee'
  },

  async canDeleteTicket(userId: string, ticketId: string): Promise<boolean> {
    const role = await getUserRole(userId)
    // Only admins can delete tickets
    return role === 'admin'
  }
} 