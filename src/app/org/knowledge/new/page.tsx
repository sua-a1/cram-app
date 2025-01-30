'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/supabase-auth-provider';
import { useToast } from '@/hooks/use-toast';
import { DocumentEditor } from '@/components/knowledge/document-editor';
import { createDocument, createCategory } from '@/app/actions/knowledge';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import type { KnowledgeCategory } from '@/types/knowledge';

export default function NewDocumentPage() {
  const router = useRouter();
  const { user, supabase } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('name');
      setCategories(data || []);
    };
    fetchCategories();
  }, [supabase]);

  const handleSave = async (data: {
    title: string;
    content: string;
    status: 'draft' | 'published' | 'archived';
    is_public: boolean;
    categoryIds: string[];
  }) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await createDocument({
        content: data.content || '',
        title: data.title,
        status: data.status,
        is_public: data.is_public,
        categoryIds: data.categoryIds,
      });

      if (error) throw error;

      toast({
        title: 'Document created',
        description: 'Your document has been created successfully.',
      });

      router.push('/org/knowledge');
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to create document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = async (data: { name: string; description?: string }) => {
    if (!user) return;

    try {
      const { error } = await createCategory(data);
      if (error) throw error;

      toast({
        title: 'Category created',
        description: 'New category has been created successfully.',
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create category. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw to handle in the UI
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Document</h1>
        <p className="text-muted-foreground mt-2">
          Create a new knowledge base document. You can use rich text formatting and add images.
        </p>
      </div>

      <Card className="p-6">
        <DocumentEditor
          categories={categories}
          onSave={handleSave}
          onCreateCategory={user?.role === 'admin' ? handleCreateCategory : undefined}
          canCreateCategories={user?.role === 'admin'}
          isSaving={isSaving}
        />
      </Card>
    </div>
  );
} 