import { processContent } from '../utils/embeddings';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testBatchEmbeddingGeneration() {
  console.log('Testing batch embedding generation...');
  
  // Generate a larger test document with multiple paragraphs
  const paragraphs = Array(10).fill(0).map((_, i) => `
    This is paragraph ${i + 1} about customer support and ticket management.
    It contains multiple sentences that should be processed correctly.
    We're testing our batch processing capabilities with this larger document.
    Each paragraph adds more content to ensure we have enough text to trigger batching.
    This helps us verify our rate limiting and progress tracking functionality.
  `);
  
  const testContent = paragraphs.join('\n\n');
  
  const metadata = {
    sourceType: 'document' as const,
    sourceId: 'test-doc-002',
    title: 'Batch Processing Test Document',
    additionalContext: {
      category: 'test',
      importance: 'high'
    }
  };
  
  try {
    let lastPhase = '';
    let lastProgress = 0;
    
    const result = await processContent(
      testContent,
      metadata,
      (phase: string, completed: number, total: number) => {
        // Only log if we've made meaningful progress
        const progress = Math.round((completed / total) * 100);
        if (phase !== lastPhase || progress > lastProgress) {
          console.log(`${phase}: ${progress}% (${completed}/${total})`);
          lastPhase = phase;
          lastProgress = progress;
        }
      }
    );
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    console.log('✅ Batch embedding generation successful!');
    console.log('Total chunks processed:', result.vectors?.length);
    console.log('First vector dimension:', result.vectors?.[0].embedding.length);
    console.log('Sample metadata:', result.vectors?.[0].metadata);
    
    return true;
  } catch (error) {
    console.error('❌ Error in batch test:', error);
    return false;
  }
}

// Run the test
testBatchEmbeddingGeneration()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 