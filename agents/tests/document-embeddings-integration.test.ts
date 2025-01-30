import { supabase } from '../utils/supabase';
import { setupDocumentEmbeddingUpdates } from '../utils/document-embeddings';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testDocumentEmbeddings() {
  try {
    console.log('Starting document embeddings integration test...');

    // 1. First, let's check existing files in bucket
    console.log('\nChecking existing files in bucket...');
    const { data: files, error: filesError } = await supabase
      .storage
      .from('knowledge-documents')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (filesError) throw filesError;
    console.log('Files in bucket:', files?.map(f => f.name));

    // 2. Check if these files have corresponding documents in the database
    const { data: documents, error: docsError } = await supabase
      .from('knowledge_documents')
      .select('*');

    if (docsError) throw docsError;
    console.log('\nFound documents:', documents?.length);

    // 3. Check if these documents have embeddings
    for (const doc of documents || []) {
      const { data: embeddings, error: embeddingsError } = await supabase
        .from('document_embeddings')
        .select('*')
        .eq('document_id', doc.id);

      if (embeddingsError) throw embeddingsError;
      console.log(`\nDocument "${doc.title}" (${doc.file_type}):`);
      console.log(`- File URL: ${doc.file_url}`);
      console.log(`- Chunks: ${embeddings?.length || 0}`);
      if (embeddings?.length) {
        console.log(`- First chunk text: ${embeddings[0].chunk_text?.slice(0, 100)}...`);
      }
    }

    // 4. Set up background job to monitor changes
    console.log('\nSetting up background job for document changes...');
    const subscription = await setupDocumentEmbeddingUpdates();

    // 5. Test document update
    console.log('\nTesting document update...');
    const testDoc = documents?.[0];
    if (testDoc) {
      const { error: updateError } = await supabase
        .from('knowledge_documents')
        .update({ title: `${testDoc.title} (Updated)` })
        .eq('id', testDoc.id);

      if (updateError) throw updateError;
      console.log('Document updated, check logs for embedding updates...');
    }

    // Wait for a bit to see the background job in action
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Clean up
    subscription.unsubscribe();
    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testDocumentEmbeddings().catch(console.error); 
