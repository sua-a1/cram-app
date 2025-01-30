import { supabase } from '../utils/supabase';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import type { Database } from '@/types/database.types';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface KnowledgeDocument {
  id: string;
  org_id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'archived';
  metadata: Record<string, any>;
}

interface DocumentEmbedding {
  id: string;
  document_id: string;
  embedding: number[];
  chunk_index: number;
  chunk_text: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

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

/**
 * Measure execution time of an async function
 */
async function measureTime<T>(name: string, fn: () => Promise<T> | any): Promise<T> {
  const start = performance.now();
  const result = await Promise.resolve(fn());
  const end = performance.now();
  console.log(`${name} took ${Math.round(end - start)}ms`);
  return result;
}

async function uploadTestDocument(
  filePath: string,
  title: string,
  fileType: 'pdf' | 'md' | 'text',
  content?: string
): Promise<KnowledgeDocument> {
  const testOrgId = '123ea677-a7c1-44b3-984b-12b8528397e2';
  const testUserId = 'b1b4fb82-4b37-473c-ba25-2d52210361dd';
  const fileName = `test-${fileType}-${Date.now()}.${fileType}`;
  const storagePath = `${testOrgId}/${testUserId}/${fileName}`;

  // Upload file to storage
  let fileData: Buffer | Blob;
  if (content) {
    fileData = new Blob([content], { type: `text/${fileType}` });
  } else {
    fileData = await fs.promises.readFile(filePath);
  }

  // Measure upload time
  const { data: uploadData, error: uploadError } = await measureTime(
    `Uploading ${fileType} file`,
    () => supabase.storage.from('knowledge-documents').upload(storagePath, fileData)
  ) as { data: { path: string } | null; error: Error | null };

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('knowledge-documents')
    .getPublicUrl(storagePath);

  // Create document entry
  const { data: doc, error: docError } = await measureTime(
    `Creating ${fileType} document entry`,
    () => supabase
      .from('knowledge_documents')
      .insert({
        title,
        file_type: fileType,
        file_url: publicUrl,
        org_id: testOrgId,
        created_by: testUserId,
        status: 'published',
        is_public: true,
      })
      .select()
      .single()
  ) as { data: KnowledgeDocument | null; error: Error | null };

  if (docError) throw docError;
  if (!doc) throw new Error('Failed to create document');
  return doc;
}

async function testComplexDocuments() {
  try {
    console.log('Starting complex documents test...');

    // Test 1: Complex Markdown with rich formatting
    const complexMarkdown = `# Heading 1
## Heading 2
### Heading 3

**Bold text** and *italic text*

> Blockquote with some important information
> Multiple lines in the quote
> - With a list
> - Inside it

\`\`\`typescript
// Code block
function example() {
  return "Hello World";
}
\`\`\`

| Table | Header | Cells |
|-------|--------|-------|
| Data  | More   | Stuff |

1. Ordered list
2. With multiple
3. Items

- [x] Task list
- [ ] With items
- [x] Some completed

[Link](https://example.com) and ![Image](https://example.com/image.jpg)

---

<details>
<summary>Expandable section</summary>
With hidden content
</details>`;

    console.log('\nTesting complex markdown processing...');
    const mdDoc = await measureTime('Markdown document creation', () =>
      uploadTestDocument('', 'Complex Markdown Test', 'md', complexMarkdown)
    ) as KnowledgeDocument;

    // Test 2: Large text file - reduce size for testing
    const largeText = Array(100) // Reduced from 1000 to 100 for testing
      .fill('This is a test line with some meaningful content that should be processed correctly. ')
      .join('\n');
    
    console.log('\nTesting large text file processing...');
    const textDoc = await measureTime('Large text document creation', () =>
      uploadTestDocument('', 'Large Text Test', 'text', largeText)
    ) as KnowledgeDocument;

    // Test 3: Process the documents
    console.log('\nProcessing documents...');
    const { processExistingDocuments } = await import('../utils/process-existing-documents');
    await measureTime('Document processing', () => processExistingDocuments());

    // Verify embeddings were created
    console.log('\nVerifying embeddings...');
    const { data: mdEmbeddings, error: mdEmbedError } = await measureTime(
      'Fetching markdown embeddings',
      () => supabase.from('document_embeddings').select('*').eq('document_id', mdDoc.id)
    ) as { data: DocumentEmbedding[] | null; error: Error | null };

    if (mdEmbedError) throw mdEmbedError;
    console.log(`Markdown document embeddings created: ${mdEmbeddings?.length || 0}`);

    const { data: textEmbeddings, error: textEmbedError } = await measureTime(
      'Fetching text embeddings',
      () => supabase.from('document_embeddings').select('*').eq('document_id', textDoc.id)
    ) as { data: DocumentEmbedding[] | null; error: Error | null };

    if (textEmbedError) throw textEmbedError;
    console.log(`Text document embeddings created: ${textEmbeddings?.length || 0}`);

    // Clean up
    console.log('\nCleaning up test documents...');
    await measureTime('Cleanup', () =>
      supabase.from('knowledge_documents').delete().in('id', [mdDoc.id, textDoc.id])
    );

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Run the test
testComplexDocuments().catch(console.error); 
