import OpenAI from 'openai';
import { supabase } from './supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { 
  MessageContext, 
  ConversationWindow, 
  ConversationEmbeddingResult,
  TicketMessage 
} from '../types/conversation';

// Constants
const MAX_WINDOW_SIZE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Utility function for sleeping between retries
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sanitizes text by removing problematic characters and normalizing whitespace
 * while preserving markdown formatting
 */
function sanitizeText(text: string): string {
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1') // Unescape markdown characters
    .replace(/[^\x20-\x7E\s]/g, '') // Remove non-printable characters
    .trim();
}

/**
 * Creates a context window from a list of messages
 */
export function createContextWindow(messages: MessageContext[]): string {
  if (!messages.length) return '';

  // Sort messages by creation date
  const sortedMessages = messages.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Map messages to context strings with role prefixes
  return sortedMessages.map(message => {
    // Role is already lowercase from convertToMessageContext
    const prefix = message.authorRole === 'customer' ? 'CUSTOMER' : 'EMPLOYEE';
    return `${prefix}:${sanitizeText(message.body || '')}`;
  }).join('\n\n');
}

/**
 * Generates an embedding for a conversation context window
 */
export async function generateConversationEmbedding(text: string, retryCount = 0): Promise<ConversationEmbeddingResult> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    if (!response.data?.[0]?.embedding) {
      throw new Error('No embedding data received from OpenAI');
    }

    // Ensure we have a proper array of numbers
    const embedding = response.data[0].embedding;
    if (!Array.isArray(embedding)) {
      throw new Error('OpenAI returned invalid embedding format');
    }

    if (embedding.length !== 1536) {
      throw new Error(`Invalid embedding dimension: ${embedding.length}`);
    }

    return {
      success: true,
      embedding,
      contextWindow: text,
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY);
      return generateConversationEmbedding(text, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Process a new message and generate embeddings
 */
export async function processNewMessage(message: MessageContext): Promise<boolean> {
  try {
    // 1. Validate input
    if (!message.messageId || !message.ticketId) {
      console.error('Invalid message: missing required fields', { message });
      return false;
    }

    console.log('Processing message:', {
      messageId: message.messageId,
      ticketId: message.ticketId,
      role: message.authorRole,
      type: message.messageType
    });

    // 2. Get previous messages with proper ordering
    const { data: previousMessages, error: prevError } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', message.ticketId)
      .lte('created_at', message.createdAt)
      .order('created_at', { ascending: true })
      .limit(MAX_WINDOW_SIZE);

    if (prevError) {
      console.error('Failed to fetch previous messages:', prevError);
      return false;
    }

    console.log(`Found ${previousMessages?.length || 0} previous messages`);

    // 3. Build context window
    const contextMessages = [...(previousMessages || []).map(convertToMessageContext), message];

    const contextWindow = createContextWindow(contextMessages);
    console.log('Created context window:', contextWindow);

    // 4. Generate embedding
    let result: ConversationEmbeddingResult;
    try {
      result = await generateConversationEmbedding(contextWindow);
      console.log('Generated embedding successfully');
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      return false;
    }

    // 5. Upsert the embedding using the stored procedure
    const { error: upsertError } = await supabase.rpc('upsert_embedding', {
      p_message_id: message.messageId,
      p_ticket_id: message.ticketId,
      p_embedding: JSON.stringify(result.embedding),
      p_context_window: result.contextWindow
    });

    if (upsertError) {
      console.error('Failed to upsert embedding:', upsertError);
      return false;
    }

    // Wait for the database to reflect changes
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  } catch (error) {
    console.error('Error processing message:', error);
    return false;
  }
}

export function convertToMessageContext(dbMessage: any): MessageContext {
  if (!dbMessage?.id || !dbMessage?.ticket_id) {
    throw new Error('Invalid message: missing required fields');
  }

  return {
    ticketId: dbMessage.ticket_id,
    messageId: dbMessage.id,
    authorRole: (dbMessage.author_role || 'employee').toLowerCase(), // Always lowercase
    messageType: 'public', // Treat all messages as public
    body: dbMessage.body || '',
    metadata: dbMessage.metadata || {},
    createdAt: dbMessage.created_at,
  };
}

export async function setupConversationEmbeddingUpdates() {
  const channel = supabase
    .channel('conversation-embeddings')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
      },
      async (payload: RealtimePostgresChangesPayload<{
        [key: string]: any;
      }>) => {
        const message = convertToMessageContext(payload.new);
        console.log(`Processing new message ${message.messageId}`);

        // Process the message
        const success = await processNewMessage(message);
        
        if (success) {
          console.log(`Successfully processed message ${message.messageId}`);
        } else {
          console.error(`Failed to process message ${message.messageId}`);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Process existing messages that don't have embeddings
 */
export async function processExistingMessages(
  onProgress?: (phase: string, completed: number, total: number) => void
): Promise<void> {
  try {
    // Get all messages that don't have embeddings
    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;
    if (!messages?.length) {
      console.log('No messages found to process');
      return;
    }

    console.log(`Found ${messages.length} messages to process`);

    // Process each message
    for (const [index, message] of messages.entries()) {
      try {
        // Check if message already has an embedding
        const { data: existingEmbedding, error: embeddingError } = await supabase
          .from('conversation_embeddings')
          .select('id')
          .eq('message_id', message.id)
          .single();

        if (embeddingError && embeddingError.code !== 'PGRST116') {
          console.error(`Error checking existing embedding for message ${message.id}:`, embeddingError);
          continue;
        }

        if (existingEmbedding) {
          console.log(`Message ${message.id} already has embedding, skipping...`);
          continue;
        }

        // Convert message to context
        const messageContext = convertToMessageContext(message);

        // Process the message
        const success = await processNewMessage(messageContext);
        
        if (!success) {
          console.error(`Failed to process message ${message.id}`);
          continue;
        }

        // Update progress
        if (onProgress) {
          onProgress('processing', index + 1, messages.length);
        }
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        continue;
      }
    }

    console.log('Finished processing all messages');
  } catch (error) {
    console.error('Error in batch processing:', error);
    throw error;
  }
}
