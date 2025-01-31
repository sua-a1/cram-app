import { supabase } from './supabase';
import OpenAI from 'openai';
import { generateEmbedding } from './embeddings';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface RelevantDocument {
  title: string;
  content: string;
  chunk_text: string;
  similarity: number;
  metadata?: any;
}

/**
 * Retrieves relevant documents based on a query
 */
export async function findRelevantDocuments(
  query: string,
  limit: number = 5,
  similarityThreshold: number = 0.7
): Promise<RelevantDocument[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar documents
    const { data: results, error } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: similarityThreshold,
        match_count: limit
      }
    );

    if (error) {
      console.error('Error finding relevant documents:', error);
      return [];
    }

    // Format results
    return results.map((result: any) => ({
      title: result.title,
      content: result.content,
      chunk_text: result.chunk_text,
      similarity: result.similarity,
      metadata: result.metadata
    }));
  } catch (error) {
    console.error('Error in findRelevantDocuments:', error);
    return [];
  }
}

/**
 * Formats document results into a context string
 */
export function formatDocumentContext(documents: RelevantDocument[]): string {
  if (!documents.length) return '';

  return documents
    .map(doc => {
      // If content is null (file attachment case), use the chunk text
      const fullContent = doc.content || doc.chunk_text;
      
      const context = [
        `Title: ${doc.title}`,
        `Relevant Section: ${doc.chunk_text}`,
        // Only include full content if it's different from the chunk
        ...(fullContent !== doc.chunk_text ? [`Full Content: ${fullContent}`] : []),
        '---'
      ];
      return context.join('\n');
    })
    .join('\n\n');
}

/**
 * Retrieves and formats relevant documents as context
 */
export async function getDocumentContext(query: string): Promise<string> {
  const documents = await findRelevantDocuments(query);
  return formatDocumentContext(documents);
} 