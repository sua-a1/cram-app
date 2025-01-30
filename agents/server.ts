import { setupConversationEmbeddingUpdates } from './utils/conversation-embeddings'

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