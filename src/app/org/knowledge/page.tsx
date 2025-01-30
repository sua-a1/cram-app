import { createServiceClient } from '@/lib/server/supabase';
import { getCurrentUser } from '@/lib/server/auth-logic';
import { getDocuments } from '@/app/actions/knowledge';
import { initializeStorage } from '@/app/actions/storage';
import KnowledgeCenterPage from './knowledge-center-page';
import type { KnowledgeDocument, KnowledgeCategory } from '@/types/knowledge';

export default async function Page() {
  const user = await getCurrentUser();
  const serviceClient = createServiceClient();
  
  let documents: KnowledgeDocument[] = [];
  let categories: KnowledgeCategory[] = [];

  try {
    // Initialize storage buckets
    const { success, error: storageError } = await initializeStorage();
    if (!success) {
      console.error('Error initializing storage:', storageError);
    }

    const { data, error } = await getDocuments({});
    if (error) throw error;
    documents = data || [];

    const { data: categoriesData } = await serviceClient
      .from('knowledge_categories')
      .select('*')
      .order('name');
    categories = categoriesData || [];
  } catch (error: any) {
    console.error('Error fetching data:', error);
  }

  return (
    <KnowledgeCenterPage 
      initialDocuments={documents}
      initialCategories={categories}
      user={user}
    />
  );
} 
