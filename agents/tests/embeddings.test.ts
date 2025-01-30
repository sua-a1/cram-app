import { processContent } from '../utils/embeddings';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testEmbeddingGeneration() {
  console.log('Testing embedding generation...');
  
  const testContent = `
    This is a test document about customer support.
    It contains multiple sentences that should be processed correctly.
    We want to make sure our chunking and embedding generation works as expected.
    This is particularly important for the AI agent's functionality.
  `;
  
  const metadata = {
    sourceType: 'document' as const,
    sourceId: 'test-doc-001',
    title: 'Test Document',
    additionalContext: {
      category: 'test',
      importance: 'high'
    }
  };
  
  try {
    const result = await processContent(testContent, metadata);
    
    console.log('✅ Embedding generation successful!');
    console.log('Number of chunks:', result.vectors?.length);
    console.log('First vector dimension:', result.vectors?.[0].embedding.length);
    console.log('Sample metadata:', result.vectors?.[0].metadata);
    
    return true;
  } catch (error) {
    console.error('❌ Error in test:', error);
    return false;
  }
}

// Run the test
testEmbeddingGeneration()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 