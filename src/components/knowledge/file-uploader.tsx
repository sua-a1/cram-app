'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createDocument } from '@/app/actions/knowledge';
import { Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategorySelector } from './category-selector';
import type { DocumentStatus, KnowledgeCategory, SerializedFile } from '@/types/knowledge';

interface FileUploaderProps {
  onUploadComplete?: (url: string, type: string) => void;
  categories: KnowledgeCategory[];
  existingFile?: string | null;
  isPublic?: boolean;
  mode?: 'create' | 'edit';
}

export function FileUploader({ onUploadComplete, categories, existingFile, isPublic: defaultIsPublic, mode = 'create' }: FileUploaderProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(defaultIsPublic || false);
  const [status, setStatus] = useState<DocumentStatus>('draft');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || (mode === 'create' && !title)) return;

    setUploading(true);
    setProgress(0);

    try {
      // Convert file to base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            // Only take the base64 data part, remove the data URL prefix
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
          } else {
            reject(new Error('Failed to read file as base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Create a plain serializable object
      const serializedFile: SerializedFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: fileData
      };

      if (mode === 'create') {
        const formData = {
          title,
          content,
          file: serializedFile,
          is_public: isPublic,
          status,
          categoryIds: selectedCategories,
        };

        const { error } = await createDocument(formData);
        if (error) throw error;
      }

      setProgress(100);
      toast({
        title: 'Success',
        description: 'File uploaded successfully.',
      });

      // Pass the file URL and type to the callback
      onUploadComplete?.(serializedFile.data, serializedFile.type);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [title, content, isPublic, status, selectedCategories, toast, onUploadComplete, mode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    multiple: false,
    disabled: uploading || (mode === 'create' && !title),
  });

  // Only show the form fields in create mode
  const showFormFields = mode === 'create';

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {showFormFields && (
          <>
            <div className="space-y-2">
              <Label htmlFor="title" className="required">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                disabled={uploading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Description</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Document description or summary"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label>Categories</Label>
              <CategorySelector
                categories={categories}
                selectedCategories={selectedCategories}
                onSelectCategories={setSelectedCategories}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value: DocumentStatus) => setStatus(value)} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={uploading}
              />
              <Label htmlFor="public">Make document public</Label>
            </div>
          </>
        )}

        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 transition-colors',
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            (mode === 'create' && !title || uploading) && 'pointer-events-none opacity-50'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, Word, Text, Markdown (up to 50MB)
            </p>
            {mode === 'create' && !title && (
              <p className="text-xs text-destructive">
                Please enter a title before uploading
              </p>
            )}
          </div>

          {uploading && (
            <div className="mt-4 space-y-2">
              <Progress value={progress} className="h-1" />
              <p className="text-xs text-center text-muted-foreground">
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
