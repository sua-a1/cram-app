import { setupConversationEmbeddingUpdates } from './utils/conversation-embeddings'
import { run } from './workflows/ticket-processor'
import { AgentState } from './config/langgraph'

/**
 * Initialize server features required for testing
 */
export async function initializeServer() {
  console.log('Initializing server features...')
  
  // Setup conversation embedding background job
  console.log('Setting up conversation embedding background job...')
  const subscription = await setupConversationEmbeddingUpdates()
  console.log('Conversation embedding background job initialized successfully')
  
  return subscription
}

/**
 * Process a ticket using the AI agent
 */
export async function processTicket(ticketId: string) {
  try {
    console.log(`Processing ticket ${ticketId}...`)
    
    const initialState: AgentState = {
      messages: [],
      current_ticket: {
        id: ticketId,
        subject: '',
        description: '',
        status: '',
        priority: '',
      },
    }

    const result = await run(initialState)
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