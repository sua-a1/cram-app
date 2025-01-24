'use client';

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { TicketFilters, Ticket, CreateTicketInput, UpdateTicketInput } from '@/types/tickets'

export function useTickets() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filters, setFilters] = useState<TicketFilters>({})
  const supabase = createClientComponentClient()

  const fetchTickets = async (newFilters?: TicketFilters) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          assigned_team_details:teams!tickets_assigned_team_fkey(name),
          assigned_employee_details:profiles!tickets_assigned_employee_fkey(display_name, role),
          creator:profiles!tickets_user_id_fkey(display_name, role)
        `)

      if (newFilters?.status?.length) {
        query = query.in('status', newFilters.status)
      }
      if (newFilters?.priority?.length) {
        query = query.in('priority', newFilters.priority)
      }
      if (newFilters?.assignedTeam) {
        query = query.eq('assigned_team', newFilters.assignedTeam)
      }
      if (newFilters?.assignedEmployee) {
        query = query.eq('assigned_employee', newFilters.assignedEmployee)
      }
      if (newFilters?.search) {
        query = query.or(`subject.ilike.%${newFilters.search}%,description.ilike.%${newFilters.search}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setTickets(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async (data: Omit<CreateTicketInput, 'handling_org_id'>) => {
    try {
      const { data: profile } = await supabase.auth.getUser()
      if (!profile.user) throw new Error('Not authenticated')

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', profile.user.id)
        .single()

      if (!userProfile?.org_id) throw new Error('No organization found')

      const { error: createError } = await supabase.from('tickets').insert({
        ...data,
        handling_org_id: userProfile.org_id,
        user_id: profile.user.id,
      })

      if (createError) throw createError
      await fetchTickets(filters)
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create ticket')
    }
  }

  const updateTicket = async (id: string, data: UpdateTicketInput) => {
    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update(data)
        .eq('id', id)

      if (updateError) throw updateError
      await fetchTickets(filters)
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update ticket')
    }
  }

  const updateFilters = (newFilters: Partial<TicketFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    fetchTickets(updatedFilters)
  }

  return {
    tickets,
    loading,
    error,
    filters,
    updateFilters,
    fetchTickets,
    createTicket,
    updateTicket,
  }
} 