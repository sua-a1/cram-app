import { setupConversationEmbeddingUpdates } from './utils/conversation-embeddings'
import { run } from './workflows/ticket-processor'
import { AgentState } from './config/langgraph'

interface ServerInitResult {
  success: boolean
  documentEmbeddingSubscription: any | null
  error?: any
}

/**
 * Initialize server features required for testing
 */
export async function initializeServer(): Promise<ServerInitResult> {
  console.log('Initializing server features...')
  
  try {
    // Setup conversation embedding background job
    console.log('Setting up conversation embedding background job...')
    const subscription = await setupConversationEmbeddingUpdates()
    console.log('Conversation embedding background job initialized successfully')
    
    return {
      documentEmbeddingSubscription: subscription,
      success: true
    }
  } catch (error) {
    console.error('Error initializing server:', error)
    return {
      success: false,
      error,
      documentEmbeddingSubscription: null
    }
  }
}

/**
 * Process a ticket using the AI agent
 */
export async function processTicket(ticketId: string) {
  try {
    console.log(`Processing ticket ${ticketId}...`)
    
    // Get ticket details from database
    const { db } = await import('./lib/server/supabase')
    const ticket = await db.tickets.get(ticketId)
    
    const result = await run({
      ticket: ticket.description,
      ticketId: ticket.id,
      userId: ticket.user_id,
      previousMessages: []
    })
    console.log('Ticket processing completed successfully')
    
    return result
  } catch (error) {
    console.error('Error processing ticket:', error)
    throw error
  }
}

// Export the route handler for LangGraph Cloud
export const POST = async (req: Request) => {
  try {
    const { ticketId } = await req.json()
    
    if (!ticketId) {
      return new Response(JSON.stringify({ error: 'Ticket ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const result = await processTicket(ticketId)
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in route handler:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 