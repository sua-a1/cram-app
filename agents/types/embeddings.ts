export type SourceType = 'document' | 'conversation';

export interface ChunkMetadata {
  sourceType: SourceType;
  sourceId: string;
  title?: string;
  chunkIndex: number;
  totalChunks: number;
  startChar: number;
  endChar: number;
  additionalContext?: Record<string, any>;
}

export interface TextChunk {
  text: string;
  metadata: ChunkMetadata;
}

export interface EmbeddingVector {
  embedding: number[];
  chunkText: string;
  metadata: ChunkMetadata;
}

export interface EmbeddingResult {
  success: boolean;
  vectors?: EmbeddingVector[];
  error?: string;
}

export interface ProcessContentResult {
  success: boolean;
  chunks?: number;
  vectors?: EmbeddingVector[];
  error?: string;
} 