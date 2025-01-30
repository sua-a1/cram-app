'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/supabase-auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DocumentEditor } from '@/components/knowledge/document-editor';
import { FileUploader } from '@/components/knowledge/file-uploader';
import { CategorySelector } from '@/components/knowledge/category-selector';
import { getDocument, updateDocument, createCategory } from '@/app/actions/knowledge';
import type { KnowledgeDocument, DocumentStatus, KnowledgeCategory } from '@/types/knowledge';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function DocumentEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user, supabase } = useAuth();
  const { toast } = useToast();
  const [document, setDocument] = useState<KnowledgeDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [status, setStatus] = useState<DocumentStatus>('draft');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const { data, error } = await getDocument(params.id);
        if (error) throw error;
        if (!data) throw new Error('Document not found');

        setDocument(data);
        setTitle(data.title);
        setContent(data.content || '');
        setIsPublic(data.is_public);
        setStatus(data.status);
        setSelectedCategories(data.categories?.map(c => c.id) || []);
        setFileUrl(data.file_url);
        setFileType(data.file_type);
      } catch (error) {
        console.error('Error fetching document:', error);
        toast({
          title: 'Error',
          description: 'Failed to load document. Please try again.',
          variant: 'destructive',
        });
        router.push('/org/knowledge');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [params.id, router, toast]);

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
    status: DocumentStatus;
    is_public: boolean;
    categoryIds: string[];
  }) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await updateDocument({
        id: params.id,
        ...data
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document updated successfully.',
      });

      router.push(`/org/knowledge/${params.id}`);
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (url: string, type: string) => {
    setFileUrl(url);
    setFileType(type);
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
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create category. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!document || user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to edit this document.
        </p>
        <Button onClick={() => router.push('/org/knowledge')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Knowledge Center
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(`/org/knowledge/${params.id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Document
        </Button>
        <Button
          onClick={() => handleSave({ title, content, status, is_public: isPublic, categoryIds: selectedCategories })}
          disabled={!title.trim() || saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as DocumentStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label>Make document public</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <CategorySelector
              categories={categories}
              selectedCategories={selectedCategories}
              onSelectCategories={setSelectedCategories}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Document Content</Label>
          <DocumentEditor
            initialContent={content}
            categories={categories}
            onSave={handleSave}
            onContentChange={setContent}
            initialTitle={title}
            initialStatus={status}
            initialIsPublic={isPublic}
            initialCategoryIds={selectedCategories}
            onCreateCategory={handleCreateCategory}
            canCreateCategories={user?.role === 'admin'}
            isSaving={saving}
            disabled={!user || user.role !== 'admin'}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Attachments</Label>
          <FileUploader
            existingFile={fileUrl}
            onUploadComplete={handleFileUpload}
            isPublic={isPublic}
          />
          {fileUrl && (
            <p className="text-sm text-muted-foreground">
              Current file: {fileUrl.split('/').pop()}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
} 
