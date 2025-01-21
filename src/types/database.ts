export type Profile = {
  user_id: string
  display_name: string
  email: string
  role: 'customer' | 'employee' | 'admin'
  organization_name?: string
  department?: string
  approval_status?: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export type Team = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type Ticket = {
  id: string
  user_id: string
  subject: string
  description?: string
  status: 'open' | 'in-progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
  assigned_team?: string
  assigned_employee?: string
}

export type TicketMessage = {
  id: string
  ticket_id: string
  author_id: string
  message_type: 'public' | 'internal'
  body: string
  created_at: string
  updated_at: string
}

export type KnowledgeArticle = {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
} 