import { Database } from '@/types/database.types'

export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row']
export type ConversationEmbedding = Database['public']['Tables']['conversation_embeddings']['Row']

export interface MessageContext {
  ticketId: string
  messageId: string
  authorRole: string
  messageType: string
  body: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface ConversationWindow {
  messages: MessageContext[]
  startTime: string
  endTime: string
  contextSize: number
}

export interface ConversationEmbeddingResult {
  success: boolean
  error?: string
  embedding?: number[]
  contextWindow?: string
} 