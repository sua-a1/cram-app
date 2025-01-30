import OpenAI from 'openai';
import { ChunkMetadata, TextChunk, EmbeddingVector, EmbeddingResult } from '../types/embeddings';
import { supabase } from './supabase';

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
  maxChunkSize: number = 1000
): TextChunk[] {
  // Clean and normalize text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Split into sentences (basic implementation)
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
  
  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let currentStartChar = 0;
  
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
      currentStartChar += currentChunk.length;
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
 * Generates embeddings for multiple chunks of text
 */
export async function generateEmbeddings(chunks: TextChunk[], onProgress?: (phase: string, completed: number, total: number) => void): Promise<EmbeddingResult> {
  try {
    const vectors: EmbeddingVector[] = [];
    
    // Process chunks in batches to avoid rate limits
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);
      vectors.push({
        embedding,
        text: chunk.text,
        metadata: chunk.metadata,
      });
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
      const { metadata, embedding, text } = vector;
      
      switch (metadata.sourceType) {
        case 'document':
          await supabase.from('document_embeddings').insert({
            document_id: metadata.sourceId,
            embedding,
            chunk_index: metadata.chunkIndex,
            chunk_text: text,
            metadata: metadata.additionalContext || {},
          });
          break;
          
        case 'conversation':
          await supabase.from('conversation_embeddings').insert({
            ticket_id: metadata.sourceId,
            message_id: metadata.additionalContext?.messageId,
            embedding,
            context_window: text,
          });
          break;
          
        case 'ticket':
          await supabase.from('ticket_context_embeddings').insert({
            ticket_id: metadata.sourceId,
            embedding,
            metadata: metadata.additionalContext || {},
          });
          break;
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
  metadata: Omit<ChunkMetadata, 'chunkIndex' | 'totalChunks'>,
  onProgress?: (phase: string, completed: number, total: number) => void
): Promise<EmbeddingResult> {
  try {
    // 1. Chunk the content
    const chunks = chunkText(content, metadata);
    
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
    
    return embeddingResult;
  } catch (error) {
    console.error('Error processing content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 
