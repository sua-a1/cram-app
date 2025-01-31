import { vi } from 'vitest';

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
export const mockInsert = vi.fn().mockResolvedValue({ error: null });
export const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  upsert: vi.fn(),
  url: new URL('http://localhost'),
  headers: {},
});

vi.mock('../utils/supabase', () => ({
  supabase: {
    from: mockFrom
  }
})); 