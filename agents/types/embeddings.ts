export interface ChunkMetadata {
  sourceType: 'document' | 'conversation' | 'ticket';
  sourceId: string;
  chunkIndex: number;
  totalChunks: number;
  startChar?: number;
  endChar?: number;
  title?: string;
  additionalContext?: Record<string, unknown>;
}

export interface TextChunk {
  text: string;
  metadata: ChunkMetadata;
}

export interface EmbeddingVector {
  embedding: number[];
  text: string;
  metadata: ChunkMetadata;
}

export interface EmbeddingResult {
  success: boolean;
  vectors?: EmbeddingVector[];
  error?: string;
} 