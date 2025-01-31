import { supabase } from '../agents/utils/supabase';

async function checkDocuments() {
  try {
    // Log Supabase configuration
    const { data: config } = await supabase.rpc('get_config');
    console.log('Current database:', config);

    // Try a raw count query first
    const { count, error: countError } = await supabase
      .from('knowledge_documents')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting count:', countError);
      return;
    }

    console.log('\nTotal document count:', count);

    // Direct simple query to knowledge_documents
    console.log('\nChecking knowledge_documents table...');
    const { data: docs, error: docsError } = await supabase
      .from('knowledge_documents')
      .select('id, title, content');

    if (docsError) {
      console.error('Error querying knowledge_documents:', docsError);
      return;
    }

    console.log('\nDocuments found:', docs?.length);
    docs?.forEach(doc => {
      console.log(`\nDocument ID: ${doc.id}`);
      console.log(`Title: ${doc.title}`);
      console.log(`Content length: ${doc.content?.length || 0} chars`);
    });

    // Direct simple query to document_embeddings
    console.log('\n\nChecking document_embeddings table...');
    const { data: embeddings, error: embedError } = await supabase
      .from('document_embeddings')
      .select('document_id, id');

    if (embedError) {
      console.error('Error querying document_embeddings:', embedError);
      return;
    }

    console.log('\nTotal embeddings found:', embeddings?.length);
    const embeddingsByDoc = embeddings?.reduce((acc, curr) => {
      acc[curr.document_id] = (acc[curr.document_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nEmbeddings per document:');
    Object.entries(embeddingsByDoc || {}).forEach(([docId, count]) => {
      console.log(`Document ${docId}: ${count} embeddings`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkDocuments().catch(console.error); 
