import { supabase } from '../utils/supabase';
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

async function testCleanupOrphanedFiles() {
  try {
    console.log('Starting cleanup test...');

    const testOrgId = '123ea677-a7c1-44b3-984b-12b8528397e2';
    const testUserId = 'b1b4fb82-4b37-473c-ba25-2d52210361dd';
    const testFileName = `test-file-${Date.now()}.txt`;
    const filePath = `${testOrgId}/${testUserId}/${testFileName}`;

    // Step 1: Upload a test file
    console.log('\nUploading test file...');
    const { error: uploadError } = await supabase
      .storage
      .from('knowledge-documents')
      .upload(filePath, new Blob(['Test content'], { type: 'text/plain' }));

    if (uploadError) throw uploadError;

    // Step 2: Verify file exists in storage
    console.log('\nVerifying file exists...');
    const { data: fileList, error: listError } = await supabase
      .storage
      .from('knowledge-documents')
      .list(`${testOrgId}/${testUserId}`);

    if (listError) throw listError;
    
    const fileExists = fileList?.some(f => f.name === testFileName);
    if (!fileExists) {
      throw new Error('Test file not found in storage');
    }
    console.log('Test file exists in storage');

    // Step 3: Run cleanup
    console.log('\nRunning cleanup...');
    const { processExistingDocuments } = await import('../utils/process-existing-documents');
    await processExistingDocuments();

    // Step 4: Verify file was deleted
    console.log('\nVerifying file was deleted...');
    const { data: fileListAfter, error: listErrorAfter } = await supabase
      .storage
      .from('knowledge-documents')
      .list(`${testOrgId}/${testUserId}`);

    if (listErrorAfter) throw listErrorAfter;
    
    const fileStillExists = fileListAfter?.some(f => f.name === testFileName);
    if (fileStillExists) {
      throw new Error('Orphaned file was not deleted');
    }
    console.log('Orphaned file was successfully deleted');

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Run the test
testCleanupOrphanedFiles().catch(console.error); 