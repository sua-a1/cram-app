import { run } from '../workflows/ticket-processor';
import { mockSupabaseClient } from './mocks/supabase';
import { mockAnalyzeTicketTool, mockDocumentRetrievalTool } from './mocks/tools';
import { initializeServer } from '../server';
import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Mock dependencies
vi.mock('../utils/supabase', () => ({
  supabase: mockSupabaseClient
}));

vi.mock('../tools/analyze-ticket', () => ({
  analyzeTicketTool: mockAnalyzeTicketTool
}));

vi.mock('../tools/document-retrieval-tool', () => ({
  documentRetrievalTool: mockDocumentRetrievalTool
}));

vi.mock('@langchain/openai', () => {
  return {
    ChatOpenAI: vi.fn().mockImplementation(() => {
      return {
        invoke: vi.fn().mockResolvedValue({
          content: "I'll help you with that.",
          additional_kwargs: {
            tool_calls: [{
              function: {
                name: 'analyze_ticket',
                arguments: JSON.stringify({
                  requires_human: false,
                  status: 'in-progress'
                })
              }
            }]
          }
        }),
        bindTools: vi.fn().mockReturnThis()
      };
    })
  };
});

describe('Ticket Processor Workflow', () => {
  let subscription: any;

  beforeAll(async () => {
    // Initialize server features
    const { documentEmbeddingSubscription, success, error } = await initializeServer();
    if (!success || !documentEmbeddingSubscription) {
      throw error || new Error('Failed to initialize server features');
    }
    subscription = documentEmbeddingSubscription;

    // Setup mock responses
    mockSupabaseClient.from().select().mockResolvedValue({
      data: [],
      error: null
    });
    
    mockSupabaseClient.from().insert().mockResolvedValue({
      data: { id: '123' },
      error: null
    });
  });

  afterAll(async () => {
    if (subscription) {
      subscription.unsubscribe();
    }
    vi.clearAllMocks();
  });

  it('should process a simple ticket successfully', async () => {
    const testTicket = {
      ticket: "Hi, I'm having trouble logging in to my account. Can you help?",
      ticketId: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      previousMessages: []
    };

    const result = await run(testTicket);

    expect(result).toBeDefined();
    expect(result.messages).toBeInstanceOf(Array);
    expect(result.final_answer).toBeDefined();
    expect(result.status).toMatch(/^(open|in-progress|closed)$/);
    expect(typeof result.requires_human).toBe('boolean');

    // Verify messages were stored
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('ticket_messages');
    expect(mockSupabaseClient.from().insert).toHaveBeenCalled();
  });

  it('should handle complex tickets requiring human intervention', async () => {
    const testTicket = {
      ticket: "I need to dispute a charge on my account and request a refund for unauthorized transactions from last month. This is urgent as it's affecting my business operations.",
      ticketId: '123e4567-e89b-12d3-a456-426614174002',
      userId: '123e4567-e89b-12d3-a456-426614174003',
      previousMessages: []
    };

    // Update mock to indicate human intervention needed
    mockAnalyzeTicketTool.func.mockResolvedValueOnce({
      requires_human: true,
      status: 'open'
    });

    const result = await run(testTicket);

    expect(result.requires_human).toBe(true);
    expect(result.status).toBe('open');
  });

  it('should maintain conversation context with previous messages', async () => {
    const ticketId = '123e4567-e89b-12d3-a456-426614174004';
    const userId = '123e4567-e89b-12d3-a456-426614174005';

    // First message
    const result1 = await run({
      ticket: "What's your refund policy?",
      ticketId,
      userId,
      previousMessages: []
    });

    // Follow-up message
    const result2 = await run({
      ticket: "Ok, and how long does the refund process take?",
      ticketId,
      userId,
      previousMessages: result1.messages
    });

    expect(result2.messages).toBeDefined();
    expect(result2.final_answer).toContain(/process|refund|take/i);
  });

  it('should handle invalid input gracefully', async () => {
    const invalidTicket = {
      ticket: "",  // Empty ticket content
      ticketId: 'invalid-uuid',  // Invalid UUID
      userId: '123e4567-e89b-12d3-a456-426614174006',
      previousMessages: []
    };

    await expect(run(invalidTicket)).rejects.toThrow();
  });

  it('should use tools appropriately', async () => {
    const testTicket = {
      ticket: "I need help understanding how to use the new dashboard features.",
      ticketId: '123e4567-e89b-12d3-a456-426614174007',
      userId: '123e4567-e89b-12d3-a456-426614174008',
      previousMessages: []
    };

    // Update mock to use document retrieval
    mockDocumentRetrievalTool.func.mockResolvedValueOnce({
      documents: [
        { content: "Dashboard feature documentation..." }
      ],
      relevance_scores: [0.95]
    });

    const result = await run(testTicket);

    expect(mockDocumentRetrievalTool.func).toHaveBeenCalled();
    expect(result.final_answer).toBeDefined();
  });
}); 
