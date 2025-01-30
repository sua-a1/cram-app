import { supabase } from './supabase';
import { processDocument } from './document-embeddings';

/**
 * Extract the storage path from a Supabase URL
 */
function getStoragePath(url: string): string {
  try {
    if (!url) return '';
    
    // Example URL: https://xxx.supabase.co/storage/v1/object/public/knowledge-documents/orgId/userId/timestamp.ext
    const match = url.match(/\/knowledge-documents\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (!match) return '';
    
    // Return the path in the format: orgId/userId/filename
    return `${match[1]}/${match[2]}/${match[3]}`;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return '';
  }
}

/**
 * Download a file from a public URL
 */
async function downloadFile(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to download file:', response.statusText);
      return null;
    }
    return await response.blob();
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
}

/**
 * Clean up orphaned files in the bucket that don't have corresponding document entries
 */
async function cleanupOrphanedFiles(): Promise<void> {
  try {
    console.log('\nChecking for orphaned files...');
    
    // Get all files from bucket recursively
    const { data: orgs, error: orgsError } = await supabase
      .storage
      .from('knowledge-documents')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (orgsError) throw orgsError;
    if (!orgs?.length) {
      console.log('No files in bucket');
      return;
    }

    // Get all documents with files
    const { data: documents, error: docsError } = await supabase
      .from('knowledge_documents')
      .select('file_url')
      .not('file_url', 'is', null);

    if (docsError) throw docsError;

    // Find files that don't have corresponding documents
    const documentPaths = new Set(documents?.map(d => getStoragePath(d.file_url)));

    // Check each org directory
    for (const org of orgs) {
      const { data: users, error: usersError } = await supabase
        .storage
        .from('knowledge-documents')
        .list(org.name);

      if (usersError) throw usersError;
      if (!users?.length) continue;

      // Check each user directory
      for (const user of users) {
        const { data: files, error: filesError } = await supabase
          .storage
          .from('knowledge-documents')
          .list(`${org.name}/${user.name}`);

        if (filesError) throw filesError;
        if (!files?.length) continue;

        // Check each file
        for (const file of files) {
          const filePath = `${org.name}/${user.name}/${file.name}`;
          if (!documentPaths.has(filePath)) {
            console.log(`Deleting orphaned file: ${filePath}`);
            const { error: deleteError } = await supabase
              .storage
              .from('knowledge-documents')
              .remove([filePath]);

            if (deleteError) {
              console.warn(`Failed to delete file ${filePath}:`, deleteError);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up orphaned files:', error);
  }
}

/**
 * Process all existing documents that don't have embeddings yet
 */
export async function processExistingDocuments(
  onProgress?: (phase: string, completed: number, total: number) => void
): Promise<void> {
  try {
    // First, clean up any orphaned files
    await cleanupOrphanedFiles();

    // Get all documents
    const { data: documents, error: docsError } = await supabase
      .from('knowledge_documents')
      .select('*');

    if (docsError) throw docsError;
    if (!documents?.length) {
      console.log('No documents found to process');
      return;
    }

    console.log(`\nFound ${documents.length} documents to process`);

    // Process each document
    for (const [index, doc] of documents.entries()) {
      console.log(`\nProcessing document "${doc.title}" (${index + 1}/${documents.length})`);
      
      // Check if document already has embeddings
      const { data: existingEmbeddings, error: embeddingsError } = await supabase
        .from('document_embeddings')
        .select('id')
        .eq('document_id', doc.id);

      if (embeddingsError) throw embeddingsError;

      if (existingEmbeddings?.length) {
        console.log('Document already has embeddings, skipping...');
        continue;
      }

      // If document has a file, download it
      if (doc.file_url) {
        console.log(`Downloading file from URL: ${doc.file_url}`);
        const fileData = await downloadFile(doc.file_url);
        if (!fileData) {
          console.warn(`Failed to download file for document "${doc.title}", skipping...`);
          continue;
        }

        // Process the document
        const success = await processDocument(doc, (phase, completed, total) => {
          onProgress?.(
            `Processing "${doc.title}"`,
            index + (completed / total),
            documents.length
          );
        });

        if (success) {
          console.log('Successfully processed document');
        } else {
          console.warn('Failed to process document');
        }
      }
    }

    console.log('\nFinished processing all documents');
  } catch (error) {
    console.error('Error processing existing documents:', error);
    throw error;
  }
} 
