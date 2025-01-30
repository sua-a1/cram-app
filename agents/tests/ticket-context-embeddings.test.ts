import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockSupabaseClient } from './mocks/supabase';
import { 
  processTicketContext,
  findSimilarTickets,
  processExistingTickets
} from '../utils/ticket-context-embeddings';

// Import mocks
import './mocks/openai';

// Mock the supabase module
vi.mock('../utils/supabase', () => ({
  supabase: mockSupabaseClient,
}));

describe('Ticket Context Embeddings', () => {
  const TEST_TICKET_ID = 'test-ticket-1';
  const SIMILAR_TICKET_ID = 'test-ticket-2';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process a ticket and generate context embedding', async () => {
    // Create a test ticket
    const { data: ticket } = await mockSupabaseClient
      .from('tickets')
      .insert({
        id: TEST_TICKET_ID,
        subject: 'Test Billing Issue',
        description: 'Customer is having problems with their subscription billing',
        status: 'open',
        priority: 'high',
      })
      .select()
      .single();

    const success = await processTicketContext(TEST_TICKET_ID);
    expect(success).toBe(true);

    // Verify embedding was created
    const { data: embedding } = await mockSupabaseClient
      .from('ticket_context_embeddings')
      .select('*')
      .eq('ticket_id', TEST_TICKET_ID)
      .single();

    expect(embedding).toBeTruthy();
    expect(Array.isArray(embedding.embedding)).toBe(true);
    expect(embedding.embedding.length).toBe(1536);
  });

  it('should process multiple tickets', async () => {
    // Create test tickets
    await mockSupabaseClient
      .from('tickets')
      .insert([
        {
          id: TEST_TICKET_ID,
          subject: 'Test Billing Issue',
          description: 'Customer is having problems with their subscription billing',
          status: 'open',
          priority: 'high',
        },
        {
          id: SIMILAR_TICKET_ID,
          subject: 'Billing Problem',
          description: 'User reports issues with subscription charges',
          status: 'open',
          priority: 'medium',
        },
      ]);

    const progressCallback = vi.fn();
    await processExistingTickets(progressCallback);

    // Verify progress callback was called
    expect(progressCallback).toHaveBeenCalled();

    // Verify embeddings were created for both test tickets
    const { data: embeddings } = await mockSupabaseClient
      .from('ticket_context_embeddings')
      .select('ticket_id')
      .in('ticket_id', [TEST_TICKET_ID, SIMILAR_TICKET_ID]);

    expect(embeddings).toHaveLength(2);
  });

  it('should find similar tickets', async () => {
    // Create test tickets
    await mockSupabaseClient
      .from('tickets')
      .insert([
        {
          id: TEST_TICKET_ID,
          subject: 'Test Billing Issue',
          description: 'Customer is having problems with their subscription billing',
          status: 'open',
          priority: 'high',
        },
        {
          id: SIMILAR_TICKET_ID,
          subject: 'Billing Problem',
          description: 'User reports issues with subscription charges',
          status: 'open',
          priority: 'medium',
        },
      ]);

    // Process tickets to generate embeddings
    await processTicketContext(TEST_TICKET_ID);
    await processTicketContext(SIMILAR_TICKET_ID);

    // Search for similar tickets
    const similarTickets = await findSimilarTickets(TEST_TICKET_ID);

    expect(similarTickets).toBeTruthy();
    expect(similarTickets.length).toBeGreaterThan(0);

    // The similar ticket we created should be in the results
    const foundSimilar = similarTickets.some(ticket => ticket.ticket_id === SIMILAR_TICKET_ID);
    expect(foundSimilar).toBe(true);
  });
}); 
