import { processExistingDocuments } from '../utils/process-existing-documents';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testProcessExistingDocuments() {
  try {
    console.log('Starting to process existing documents...');

    await processExistingDocuments((phase, completed, total) => {
      const percentage = Math.round((completed / total) * 100);
      console.log(`${phase}: ${percentage}%`);
    });

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testProcessExistingDocuments().catch(console.error); 