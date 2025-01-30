import { supabase } from '../utils/supabase';
import { initializeServer } from '../../src/lib/server/init';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Wait with progress indicator
 */
async function waitWithProgress(ms: number, message: string) {
  const steps = 10;
  const stepMs = ms / steps;
  process.stdout.write(`\n${message}`);
  for (let i = 0; i < steps; i++) {
    await new Promise(resolve => setTimeout(resolve, stepMs));
    process.stdout.write('.');
  }
  process.stdout.write('\n');
}

async function testBackgroundJobLocal() {
  try {
    console.log('Starting background job local test...');

    // Initialize server features (including background job)
    console.log('\nInitializing server features...');
    const { documentEmbeddingSubscription, success, error } = await initializeServer();
    
    if (!success || !documentEmbeddingSubscription) {
      throw error || new Error('Failed to initialize server features');
    }
    
    // Wait for subscription to be fully ready
    await waitWithProgress(2000, 'Waiting for subscription to be ready');

    // Test Case 1: Create a new document
    console.log('\nTesting document creation...');
    const { data: newDoc, error: createError } = await supabase
      .from('knowledge_documents')
      .insert({
        title: 'Background Job Local Test',
        content: 'This is a test document for the local background job.',
        file_type: 'text',
        org_id: '123ea677-a7c1-44b3-984b-12b8528397e2', // Test org ID
        created_by: 'b1b4fb82-4b37-473c-ba25-2d52210361dd', // Test user ID
        status: 'published',
        is_public: true,
      })
      .select()
      .single();

    if (createError) throw createError;
    console.log('Created document:', newDoc.id);

    // Wait for embeddings to be generated
    await waitWithProgress(5000, 'Waiting for embeddings to be generated');

    // Verify embeddings were created
    const { data: embeddings1, error: embedError1 } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('document_id', newDoc.id);

    if (embedError1) throw embedError1;
    console.log('Initial embeddings created:', embeddings1?.length || 0);

    // Test Case 2: Update the document
    console.log('\nTesting document update...');
    const { error: updateError } = await supabase
      .from('knowledge_documents')
      .update({
        content: 'This is an updated test document for the local background job.',
      })
      .eq('id', newDoc.id);

    if (updateError) throw updateError;

    // Wait for embeddings to be updated
    await waitWithProgress(5000, 'Waiting for embeddings to be updated');

    // Verify embeddings were updated
    const { data: embeddings2, error: embedError2 } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('document_id', newDoc.id);

    if (embedError2) throw embedError2;
    console.log('Updated embeddings:', embeddings2?.length || 0);

    // Test Case 3: Delete the document
    console.log('\nTesting document deletion...');
    const { error: deleteError } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', newDoc.id);

    if (deleteError) throw deleteError;

    // Wait for embeddings to be deleted
    await waitWithProgress(3000, 'Waiting for embeddings to be deleted');

    // Verify embeddings were deleted
    const { data: embeddings3, error: embedError3 } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('document_id', newDoc.id);

    if (embedError3) throw embedError3;
    console.log('Remaining embeddings after deletion:', embeddings3?.length || 0);

    // Clean up
    documentEmbeddingSubscription.unsubscribe();
    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Run the test
testBackgroundJobLocal().catch(console.error); 