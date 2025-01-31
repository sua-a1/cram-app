import './mocks';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processDocument } from '../utils/document-embeddings';
import { mockFrom, mockInsert } from './mocks';

describe('Document Embeddings Generation', () => {
  const baseDocument = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Document',
    description: 'This is a test document description.',
    content: 'This is the main content of the document. It contains important information that should be embedded.',
    file_url: null,
    file_type: 'text',
    org_id: 'test-org',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'test-user',
    status: 'published',
    is_public: true,
    metadata: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it('should process document with direct content successfully', async () => {
    const result = await processDocument(baseDocument);

    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('document_embeddings');
    expect(mockInsert).toHaveBeenCalled();
  });

  it('should handle document with file in bucket', async () => {
    const fileDocument = {
      ...baseDocument,
      id: '123e4567-e89b-12d3-a456-426614174001',
      content: null,
      file_url: 'test/sample.txt',
      file_type: 'txt'
    };

    const result = await processDocument(fileDocument);

    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('document_embeddings');
    expect(mockInsert).toHaveBeenCalled();
  });

  it('should handle Supabase errors gracefully', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'Error storing document embedding' } });

    const result = await processDocument(baseDocument);

    expect(result).toBe(false);
  });

  it('should handle empty content gracefully', async () => {
    const emptyDocument = {
      ...baseDocument,
      content: '',
      file_url: null
    };

    const result = await processDocument(emptyDocument);

    expect(result).toBe(false);
  });
}); 