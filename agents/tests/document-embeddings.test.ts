import { processDocument } from '../utils/document-embeddings';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testDocumentEmbeddings() {
  console.log('Starting document embeddings test...');

  // Test Case 1: Document with direct content (no file)
  const directContentDoc = {
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

  console.log('\nTesting document with direct content...');
  const result1 = await processDocument(directContentDoc, (phase, completed, total) => {
    console.log(`Progress - ${phase}: ${completed}/${total}`);
  });
  console.log('Result:', result1 ? 'Success' : 'Failed');

  // Test Case 2: Document with file in bucket (to be implemented when PDF extraction is ready)
  const fileDoc = {
    ...directContentDoc,
    id: '123e4567-e89b-12d3-a456-426614174001',
    content: null,
    file_url: 'test/sample.txt',
    file_type: 'txt'
  };

  console.log('\nTesting document with file in bucket...');
  const result2 = await processDocument(fileDoc, (phase, completed, total) => {
    console.log(`Progress - ${phase}: ${completed}/${total}`);
  });
  console.log('Result:', result2 ? 'Success' : 'Failed');
}

// Run the test
testDocumentEmbeddings().catch(console.error); 