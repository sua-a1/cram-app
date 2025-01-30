import { setupDocumentEmbeddingUpdates } from '../../../agents/utils/document-embeddings';

/**
 * Initialize server-side features and background jobs
 */
export async function initializeServer() {
  console.log('Initializing server-side features...');
  
  try {
    // Set up document embedding background job
    console.log('Setting up document embedding background job...');
    const subscription = await setupDocumentEmbeddingUpdates();
    console.log('Document embedding background job initialized successfully');
    
    return {
      documentEmbeddingSubscription: subscription,
      success: true,
    };
  } catch (error) {
    console.error('Error initializing server:', error);
    return {
      success: false,
      error,
    };
  }
} 