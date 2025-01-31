import { processExistingDocuments } from '../agents/utils/process-existing-documents';

async function updateDocumentEmbeddings() {
  try {
    await processExistingDocuments((phase, completed, total) => {
      console.log(`${phase}: ${completed}/${total}`);
    });
  } catch (error) {
    console.error('Error updating document embeddings:', error);
  }
}

// Run the update
updateDocumentEmbeddings().catch(console.error); 
