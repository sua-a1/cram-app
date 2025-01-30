import OpenAI from 'openai';
import { supabase } from './supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface TicketMetadata {
  subject: string;
  description: string;
  status: string;
  priority: string;
  assigned_team?: string;
  assigned_employee?: string;
  handling_org_id?: string;
}

/**
 * Utility function for sleeping between retries
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates a context string from ticket metadata
 */
function createTicketContext(metadata: TicketMetadata): string {
  const context = [
    `SUBJECT: ${metadata.subject}`,
    `DESCRIPTION: ${metadata.description || 'No description provided'}`,
    `STATUS: ${metadata.status}`,
    `PRIORITY: ${metadata.priority}`,
  ];

  if (metadata.assigned_team) {
    context.push(`TEAM: ${metadata.assigned_team}`);
  }

  if (metadata.assigned_employee) {
    context.push(`ASSIGNED TO: ${metadata.assigned_employee}`);
  }

  return context.join('\n');
}

/**
 * Generates an embedding for ticket context
 */
async function generateTicketEmbedding(text: string, retryCount = 0): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    if (!response.data?.[0]?.embedding) {
      throw new Error('No embedding data received from OpenAI');
    }

    const embedding = response.data[0].embedding;
    if (!Array.isArray(embedding) || embedding.length !== 1536) {
      throw new Error(`Invalid embedding dimension: ${embedding.length}`);
    }

    return embedding;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY);
      return generateTicketEmbedding(text, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Process a ticket and generate/update its context embedding
 */
export async function processTicketContext(ticketId: string): Promise<boolean> {
  try {
    // 1. Fetch ticket data with proper relationship specifications
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        assigned_team (
          name
        ),
        creator:profiles!tickets_user_id_fkey (
          display_name
        ),
        assignee:profiles!tickets_assigned_employee_fkey (
          display_name
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Failed to fetch ticket:', ticketError);
      return false;
    }

    // 2. Create metadata object
    const metadata: TicketMetadata = {
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assigned_team: ticket.assigned_team?.name,
      assigned_employee: ticket.assignee?.display_name,
      handling_org_id: ticket.handling_org_id,
    };

    // 3. Generate context string and embedding
    const contextString = createTicketContext(metadata);
    const embedding = await generateTicketEmbedding(contextString);

    // 4. Upsert the embedding
    const { error: upsertError } = await supabase
      .from('ticket_context_embeddings')
      .upsert({
        ticket_id: ticketId,
        embedding,
        metadata: {
          context_string: contextString,
          last_updated: new Date().toISOString(),
        },
      }, {
        onConflict: 'ticket_id'
      });

    if (upsertError) {
      console.error('Failed to upsert ticket context embedding:', upsertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error processing ticket context:', error);
    return false;
  }
}

/**
 * Set up real-time updates for ticket changes
 */
export async function setupTicketContextUpdates() {
  const channel = supabase
    .channel('ticket-context-updates')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'tickets',
      },
      async (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
        if (payload.eventType === 'DELETE') return;

        const ticketId = payload.new?.id;
        if (!ticketId) return;

        console.log(`Processing ticket context for ticket ${ticketId}`);
        const success = await processTicketContext(ticketId);
        
        if (success) {
          console.log(`Successfully processed ticket context for ${ticketId}`);
        } else {
          console.error(`Failed to process ticket context for ${ticketId}`);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Find similar tickets based on context
 */
export async function findSimilarTickets(ticketId: string, limit = 5): Promise<any[]> {
  try {
    // 1. Get the source ticket's embedding
    const { data: sourceEmbedding, error: embeddingError } = await supabase
      .from('ticket_context_embeddings')
      .select('embedding')
      .eq('ticket_id', ticketId)
      .single();

    if (embeddingError || !sourceEmbedding) {
      throw new Error('Failed to fetch source ticket embedding');
    }

    // 2. Perform similarity search
    const { data: similarTickets, error: searchError } = await supabase.rpc(
      'match_tickets',
      {
        query_embedding: sourceEmbedding.embedding,
        match_threshold: 0.7,
        match_count: limit
      }
    );

    if (searchError) {
      throw searchError;
    }

    return similarTickets || [];
  } catch (error) {
    console.error('Error finding similar tickets:', error);
    return [];
  }
}

/**
 * Process existing tickets that don't have context embeddings
 */
export async function processExistingTickets(
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  try {
    // Get all tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id');

    if (ticketsError) throw ticketsError;
    if (!tickets?.length) {
      console.log('No tickets found to process');
      return;
    }

    console.log(`Found ${tickets.length} tickets to process`);

    // Process each ticket
    for (const [index, ticket] of tickets.entries()) {
      try {
        const success = await processTicketContext(ticket.id);
        if (!success) {
          console.error(`Failed to process ticket ${ticket.id}`);
        }

        // Update progress
        if (onProgress) {
          onProgress(index + 1, tickets.length);
        }
      } catch (error) {
        console.error(`Error processing ticket ${ticket.id}:`, error);
        continue;
      }
    }

    console.log('Finished processing all tickets');
  } catch (error) {
    console.error('Error in batch processing:', error);
    throw error;
  }
} 
