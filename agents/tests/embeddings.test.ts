import { processContent } from '../utils/embeddings';
import { vi, describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';
import { ChunkMetadata } from '../types/embeddings';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: {
      create: vi.fn().mockImplementation(({ input }) => {
        // Handle array of inputs for batch processing
        const embeddings = Array.isArray(input) 
          ? input.map(() => ({ embedding: new Array(1536).fill(0.1) }))
          : [{ embedding: new Array(1536).fill(0.1) }];
        
        return Promise.resolve({ data: embeddings });
      })
    }
  }))
}));

describe('Embeddings Generation', () => {
  const baseMetadata: Omit<ChunkMetadata, 'chunkIndex' | 'totalChunks' | 'startChar' | 'endChar'> = {
    sourceType: 'document',
    sourceId: 'test-doc-001',
    title: 'Test Document',
    additionalContext: {
      category: 'test',
      importance: 'high'
    }
  };

  it('should process simple content successfully', async () => {
    const testContent = 'This is a simple test document.';
    
    const result = await processContent(testContent, baseMetadata);
    
    expect(result.success).toBe(true);
    expect(result.vectors).toBeDefined();
    expect(result.vectors?.length).toBeGreaterThan(0);
    expect(result.vectors?.[0].embedding.length).toBe(1536);
    
    // Only check the static metadata fields
    const { startChar, endChar, chunkIndex, totalChunks, ...staticMetadata } = result.vectors![0].metadata;
    expect(staticMetadata).toMatchObject(baseMetadata);
  });

  it('should handle long content with proper chunking', async () => {
    const longContent = `
      This is a test document about customer support.
      It contains multiple sentences that should be processed correctly.
      We want to make sure our chunking and embedding generation works as expected.
      This is particularly important for the AI agent's functionality.
      The document continues with more information about various topics.
      Each of these sentences should be properly chunked and processed.
      We need to verify that the chunking logic works correctly.
      This helps ensure our embeddings are meaningful and useful.
    `.trim();
    
    const result = await processContent(longContent, baseMetadata);
    
    expect(result.success).toBe(true);
    expect(result.vectors).toBeDefined();
    expect(result.vectors?.length).toBeGreaterThan(1); // Should create multiple chunks
    result.vectors?.forEach(vector => {
      expect(vector.embedding.length).toBe(1536);
      const { startChar, endChar, chunkIndex, totalChunks, ...staticMetadata } = vector.metadata;
      expect(staticMetadata).toMatchObject(baseMetadata);
      expect(chunkIndex).toBeDefined();
      expect(totalChunks).toBe(result.vectors?.length);
    });
  });

  it('should handle empty content gracefully', async () => {
    const emptyContent = '';
    
    const result = await processContent(emptyContent, baseMetadata);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should preserve metadata in all chunks', async () => {
    const content = 'Test content for metadata preservation.';
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
      expect(staticMetadata).toMatchObject(customMetadata);
      expect(vector.metadata.additionalContext?.customField).toBe('test-value');
    });
  });

  it('should handle special characters and formatting', async () => {
    const formattedContent = `
      # Heading
      * Bullet point 1
      * Bullet point 2
      
      ## Subheading
      1. Numbered item
      2. Another item
      
      **Bold text** and *italic text*
    `.trim();
    
    const result = await processContent(formattedContent, baseMetadata);
    
    expect(result.success).toBe(true);
    expect(result.vectors).toBeDefined();
    expect(result.vectors?.length).toBeGreaterThan(0);
  });
}); 