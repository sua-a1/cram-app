import { supabase } from '../agents/utils/supabase';
import fs from 'fs/promises';
import path from 'path';
import { generateEmbedding } from '../agents/utils/embeddings';

const DOCS_DIR = path.join(process.cwd(), 'docs', 'sample-policies');

async function readPolicyFile(filename: string): Promise<{ title: string; content: string }> {
  const content = await fs.readFile(path.join(DOCS_DIR, filename), 'utf-8');
  const title = content.split('\n')[0].replace('# ', '');
  return { title, content };
}

async function insertDocument(title: string, content: string) {
  try {
    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Insert document
    const { error } = await supabase
      .from('knowledge_documents')
      .insert({
        title,
        content,
        embedding,
        metadata: { type: 'policy' }
      });

    if (error) {
      throw error;
    }

    console.log(`Successfully inserted document: ${title}`);
  } catch (error) {
    console.error(`Error inserting document ${title}:`, error);
  }
}

async function insertPolicyDocuments() {
  try {
    const files = await fs.readdir(DOCS_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md'));

    console.log(`Found ${mdFiles.length} policy documents to insert`);

    for (const file of mdFiles) {
      console.log(`\nProcessing ${file}...`);
      const { title, content } = await readPolicyFile(file);
      await insertDocument(title, content);
    }

    console.log('\nFinished inserting policy documents');
  } catch (error) {
    console.error('Error in insertPolicyDocuments:', error);
  }
}

// Run the insertion
insertPolicyDocuments().catch(console.error); 