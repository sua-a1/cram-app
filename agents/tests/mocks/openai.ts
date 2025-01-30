import { vi } from 'vitest';

// Create a mock embedding of the correct size (1536 dimensions)
const mockEmbedding = Array(1536).fill(0).map((_, i) => Math.sin(i));

export const mockOpenAI = {
  embeddings: {
    create: vi.fn().mockResolvedValue({
      data: [{
        embedding: mockEmbedding,
      }],
    }),
  },
};

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => mockOpenAI),
})); 