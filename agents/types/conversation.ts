// TODO: Fix database types import when module resolution is configured
type Database = any;

export type TicketMessage = any;
export type ConversationEmbedding = any;

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