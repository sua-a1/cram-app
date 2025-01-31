// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: vi.fn().mockImplementation(({ input }) => {
          // Handle both single and batch inputs
          const inputs = Array.isArray(input) ? input : [input];
          return Promise.resolve({
            data: inputs.map(() => ({
              embedding: new Array(1536).fill(0.1),
              index: 0,
              object: 'embedding'
            })),
            model: 'text-embedding-ada-002',
            object: 'list',
            usage: {
              prompt_tokens: 0,
              total_tokens: 0
            }
          });
        })
      }
    }))
  };
});

// Mock Supabase client
vi.mock('../utils/supabase', () => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn().mockReturnValue({
    insert: mockInsert,
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    url: new URL('http://localhost'),
    headers: {},
  });
  return {
    supabase: {
      from: mockFrom
    }
  };
});

import './mocks';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processContent } from '../utils/embeddings';
import { mockFrom, mockInsert } from './mocks';

describe('Conversation Embeddings Generation', () => {
  const baseMetadata = {
    sourceType: 'conversation' as const,
    sourceId: 'test-ticket-123',
    additionalContext: {
      messageId: 'msg-123',
      role: 'user'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it('should process conversation message successfully', async () => {
    const testContent = 'This is a test message for embedding generation.';
    const result = await processContent(testContent, baseMetadata);

    expect(result.success).toBe(true);
    expect(result.vectors).toBeDefined();
    expect(result.vectors?.length).toBeGreaterThan(0);
    expect(mockFrom).toHaveBeenCalledWith('conversation_embeddings');
  });

  it('should handle long conversation with proper chunking', async () => {
    const longContent = Array(10).fill('This is a long test message that should be split into multiple chunks. ').join(' ');
    const result = await processContent(longContent, baseMetadata);

    expect(result.success).toBe(true);
    expect(result.vectors).toBeDefined();
    const vectorCount = result.vectors?.length ?? 0;
    expect(vectorCount).toBeGreaterThan(1);
  });

  it('should preserve message metadata in all chunks', async () => {
    const content = 'Test message for metadata preservation.';
    const customMetadata = {
      ...baseMetadata,
      additionalContext: {
        ...baseMetadata.additionalContext,
        customField: 'test-value'
      }
    };

    const result = await processContent(content, customMetadata);

    expect(result.success).toBe(true);
    result.vectors?.forEach(vector => {
      const { startChar, endChar, chunkIndex, totalChunks, ...staticMetadata } = vector.metadata;
      expect(staticMetadata).toEqual(customMetadata);
    });
  });

  it('should handle messages with special formatting', async () => {
    const formattedContent = '**Bold text** and *italic text* with [links](https://example.com)';
    const result = await processContent(formattedContent, baseMetadata);

    expect(result.success).toBe(true);
    expect(result.vectors).toBeDefined();
    expect(result.vectors?.length).toBeGreaterThan(0);
  });

  it('should handle Supabase errors gracefully', async () => {
    // Mock Supabase error for this test
    mockInsert.mockResolvedValueOnce({ error: { message: 'Error storing conversation embedding' } });

    const result = await processContent('Test error handling', baseMetadata);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toBe('Failed to store embeddings');
  });
});
