import { createClient } from '@supabase/supabase-js';
import { processContent } from './embeddings';
import { ChunkMetadata } from '../types/embeddings';
import { supabase } from '../lib/server/supabase';
import { extractTextFromPDF } from './pdf-extractor';

type KnowledgeDocument = any;

/**
 * Download a file from a public URL
 */
async function downloadFile(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to download file:', response.statusText);
      return null;
    }
    return await response.blob();
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
}

/**
 * Normalize file type for processing
 */
function normalizeFileType(fileType: string | null): string {
  if (!fileType) return 'text';
  
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('markdown') || type.includes('md')) return 'md';
  if (type.includes('text') || type.includes('txt')) return 'text';
  
  return type;
}

/**
 * Processes a document's content and description for embedding generation.
 * Handles different cases:
 * 1. Direct content (file_url is NULL, content has the document text)
 * 2. File in bucket (file_url exists, content is NULL)
 * 3. Description field (may exist in either case)
 */
export async function processDocument(
  document: KnowledgeDocument,
  onProgress?: (phase: string, completed: number, total: number) => void
): Promise<boolean> {
  try {
    const { id, title, content, file_url, file_type } = document;

    // Base metadata for all embeddings from this document
    const baseMetadata: Omit<ChunkMetadata, 'chunkIndex' | 'totalChunks'> = {
      sourceType: 'document',
      sourceId: id,
      title,
      additionalContext: {
        documentType: file_type || 'text',
      }
    };

    // Case 1: Direct content in the database
    if (!file_url && content) {
      const contentMetadata = {
        ...baseMetadata,
        additionalContext: {
          ...baseMetadata.additionalContext,
          section: 'main_content'
        }
      };

      await processContent(content, contentMetadata, onProgress);
      return true;
    }

    // Case 2: File in bucket
    if (file_url) {
      return await processFileFromBucket(document, baseMetadata, onProgress);
    }

    console.warn(`Document ${id} has no content or file to process`);
    return false;
  } catch (error) {
    console.error('Error processing document:', error);
    return false;
  }
}

/**
 * Processes a file stored in the Supabase bucket
 */
async function processFileFromBucket(
  document: KnowledgeDocument,
  baseMetadata: Omit<ChunkMetadata, 'chunkIndex' | 'totalChunks'>,
  onProgress?: (phase: string, completed: number, total: number) => void
): Promise<boolean> {
  const { file_url, file_type } = document;
  
  if (!file_url) return false;

  try {
    // Download file from public URL
    const fileData = await downloadFile(file_url);
    if (!fileData) {
      throw new Error('Failed to download file');
    }

    // Extract text based on file type
    let text: string;
    const normalizedType = normalizeFileType(file_type);
    
    switch (normalizedType) {
      case 'pdf':
        const arrayBuffer = await fileData.arrayBuffer();
        text = await extractTextFromPDF(arrayBuffer);
        break;
      case 'md':
      case 'text':
        text = await fileData.text();
        break;
      default:
        throw new Error(`Unsupported file type: ${file_type}`);
    }

    // Process the extracted text
    const fileMetadata = {
      ...baseMetadata,
      additionalContext: {
        ...baseMetadata.additionalContext,
        section: 'file_content',
        fileName: file_url.split('/').pop(),
      }
    };

    await processContent(text, fileMetadata, onProgress);
    return true;
  } catch (error) {
    console.error('Error processing file from bucket:', error);
    return false;
  }
}

/**
 * Sets up a background job to monitor and update document embeddings
 * when documents change
 */
export async function setupDocumentEmbeddingUpdates() {
  // Subscribe to realtime changes
  const subscription = supabase
    .channel('document_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'knowledge_documents'
      },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          // Embeddings will be automatically deleted via CASCADE
          return;
        }

        const document = payload.new as KnowledgeDocument;
        await processDocument(document);
      }
    )
    .subscribe();

  return subscription;
} 