import OpenAI from 'openai';
import { ChunkMetadata, TextChunk, EmbeddingVector, EmbeddingResult, ProcessContentResult } from '../types/embeddings';
import { supabase } from './supabase';
import { Database } from '../types/supabase';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Constants for batch processing
const BATCH_SIZE = 20; // Process 20 chunks at a time
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Converts an array to a Postgres array string
 */
function toPostgresArray(arr: number[]): string {
  return `[${arr.join(',')}]`;
}

/**
 * Generates embeddings for a single piece of text with retry logic
 */
export async function generateEmbedding(text: string, retryCount = 0): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    if (retryCount < MAX_RETRIES && error instanceof Error) {
      console.warn(`Retry ${retryCount + 1}/${MAX_RETRIES} for embedding generation`);
      await sleep(RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      return generateEmbedding(text, retryCount + 1);
    }
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Chunks text into smaller pieces suitable for embedding
 * Uses simple sentence-based chunking with overlap
 */
export function chunkText(
  text: string,
  metadata: Omit<ChunkMetadata, 'chunkIndex' | 'totalChunks'>,
  maxChunkSize: number = 200 // Reduced chunk size to ensure multiple chunks
): TextChunk[] {
  // Handle empty content
  if (!text.trim()) {
    throw new Error('Cannot process empty content');
  }

  // Clean and normalize text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Split into sentences (basic implementation)
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
  
  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let currentStartChar = metadata.startChar;
  
  for (const sentence of sentences) {
    // If adding this sentence would exceed maxChunkSize, create a new chunk
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        metadata: {
          ...metadata,
          chunkIndex: chunks.length,
          totalChunks: 0, // Will be updated later
          startChar: currentStartChar,
          endChar: currentStartChar + currentChunk.length,
        },
      });
      currentChunk = '';
      currentStartChar = currentStartChar + currentChunk.length;
    }
    currentChunk += sentence + ' ';
  }
  
  // Add the last chunk if there's any text left
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      metadata: {
        ...metadata,
        chunkIndex: chunks.length,
        totalChunks: 0,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
      },
    });
  }
  
  // Update totalChunks in metadata
  return chunks.map(chunk => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      totalChunks: chunks.length,
    },
  }));
}

/**
 * Generates embeddings for multiple chunks of text in batches
 */
export async function generateEmbeddings(chunks: TextChunk[], onProgress?: (phase: string, completed: number, total: number) => void): Promise<EmbeddingResult> {
  try {
    const vectors: EmbeddingVector[] = [];
    let completed = 0;
    
    // Process chunks in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchTexts = batch.map(chunk => chunk.text);
      
      // Generate embeddings for the entire batch
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: batchTexts,
      });

      // Add vectors with their metadata
      batch.forEach((chunk, index) => {
        vectors.push({
          embedding: response.data[index].embedding,
          chunkText: chunk.text,
          metadata: chunk.metadata,
        });
      });

      // Update progress
      completed += batch.length;
      onProgress?.('Generating embeddings', completed, chunks.length);

      // Add a small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < chunks.length) {
        await sleep(100);
      }
    }
    
    return {
      success: true,
      vectors,
    };
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Stores embeddings in the appropriate Supabase table based on source type
 */
export async function storeEmbeddings(vectors: EmbeddingVector[], onProgress?: (phase: string, completed: number, total: number) => void): Promise<boolean> {
  try {
    for (const vector of vectors) {
      const { metadata, embedding, chunkText } = vector;
      const postgresEmbedding = toPostgresArray(embedding);
      
      switch (metadata.sourceType) {
        case 'document': {
          const { error } = await supabase.from('document_embeddings').insert({
            document_id: metadata.sourceId,
            embedding: postgresEmbedding,
            chunk_index: metadata.chunkIndex,
            chunk_text: chunkText,
            metadata: metadata.additionalContext || {},
          } satisfies Database['public']['Tables']['document_embeddings']['Insert']);
          
          if (error) {
            console.error('Error storing document embedding:', error);
            throw error;
          }
          break;
        }
        
        case 'conversation': {
          const { error } = await supabase.from('conversation_embeddings').insert({
            ticket_id: metadata.sourceId,
            message_id: metadata.additionalContext?.messageId,
            embedding: postgresEmbedding,
            context_window: chunkText,
          } satisfies Database['public']['Tables']['conversation_embeddings']['Insert']);
          
          if (error) {
            console.error('Error storing conversation embedding:', error);
            throw error;
          }
          break;
        }
      }

      // Update progress if callback provided
      if (onProgress) {
        onProgress('Storing embeddings', vectors.indexOf(vector) + 1, vectors.length);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error storing embeddings:', error);
    return false;
  }
}

/**
 * Processes text content and generates/stores embeddings
 */
export async function processContent(
  content: string,
  metadata: Omit<ChunkMetadata, 'chunkIndex' | 'totalChunks' | 'startChar' | 'endChar'>,
  onProgress?: (phase: string, completed: number, total: number) => void
): Promise<ProcessContentResult> {
  try {
    if (!content.trim()) {
      return {
        success: false,
        error: 'Cannot process empty content'
      };
    }

    // Add startChar and endChar to metadata for chunking
    const metadataWithPositions = {
      ...metadata,
      startChar: 0,
      endChar: 0
    };

    // 1. Chunk the content
    const chunks = chunkText(content, metadataWithPositions);
    
    // 2. Generate embeddings with progress tracking
    const embeddingResult = await generateEmbeddings(chunks, onProgress);
    if (!embeddingResult.success || !embeddingResult.vectors) {
      throw new Error(embeddingResult.error || 'Failed to generate embeddings');
    }
    
    // 3. Store embeddings with progress tracking
    const stored = await storeEmbeddings(embeddingResult.vectors, onProgress);
    if (!stored) {
      throw new Error('Failed to store embeddings');
    }
    
    return {
      success: true,
      chunks: chunks.length,
      vectors: embeddingResult.vectors,
    };
  } catch (error) {
    console.error('Error processing content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 
