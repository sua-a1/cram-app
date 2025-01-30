'use client';

import { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Loader2, Bold, Italic, Link2, Image as ImageIcon, List, Code, Quote, Save } from 'lucide-react';
import { type DocumentStatus, KnowledgeCategory } from '@/types/knowledge';
import { cn } from '@/lib/utils';
import { CategorySelector } from './category-selector';

export interface DocumentEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialStatus?: DocumentStatus;
  initialIsPublic?: boolean;
  initialCategoryIds?: string[];
  categories: KnowledgeCategory[];
  onContentChange?: (content: string) => void;
  onSave: (data: {
    title: string;
    content: string;
    status: DocumentStatus;
    is_public: boolean;
    categoryIds: string[];
  }) => Promise<void>;
  onCreateCategory?: (data: { name: string; description?: string }) => Promise<void>;
  canCreateCategories?: boolean;
  isSaving?: boolean;
  className?: string;
  disabled?: boolean;
}

interface InsertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
  title: string;
  placeholder: string;
}

function InsertDialog({ open, onOpenChange, onSubmit, title, placeholder }: InsertDialogProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url);
    setUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder={placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!url.trim()}>Insert</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DocumentEditor({
  initialTitle = '',
  initialContent = '',
  initialStatus = 'draft',
  initialIsPublic = false,
  initialCategoryIds = [],
  categories,
  onContentChange,
  onSave,
  onCreateCategory,
  canCreateCategories = false,
  isSaving = false,
  className,
  disabled = false
}: DocumentEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<DocumentStatus>(initialStatus);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategoryIds);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        code: {
          HTMLAttributes: {
            class: 'rounded-md bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-2 pl-4 italic',
          },
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 hover:text-primary/80',
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'rounded-md max-w-full',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
        emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none min-h-[200px] px-3 py-2 focus:outline-none',
          disabled && 'opacity-50 cursor-not-allowed'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      if (editor) {
        onContentChange?.(editor.getHTML());
      }
    },
  });

  const insertImage = useCallback((url: string) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setImage({ src: url })
      .run();
  }, [editor]);

  const setLink = useCallback((url: string) => {
    if (!editor) return;
    
    // If there's no selection, create a new link
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${url}</a>`)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setLink({ href: url })
        .run();
    }
  }, [editor]);

  const handleSave = async () => {
    if (!editor || !title.trim()) return;

    const content = editor.getHTML();
    await onSave({
      title: title.trim(),
      content,
      status,
      is_public: isPublic,
      categoryIds: selectedCategories
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as DocumentStatus)} disabled={disabled}>
              <SelectTrigger id="status" className="w-[130px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="visibility">Public</Label>
            <Switch
              id="visibility"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Categories</Label>
          <CategorySelector
            categories={categories}
            selectedCategories={selectedCategories}
            onSelectCategories={setSelectedCategories}
            onCreateCategory={onCreateCategory}
            canCreate={canCreateCategories}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1 border-b pb-2">
          <Toggle
            size="sm"
            pressed={editor?.isActive('bold')}
            onPressedChange={() => editor?.chain().focus().toggleBold().run()}
            disabled={disabled}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor?.isActive('italic')}
            onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
            disabled={disabled}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor?.isActive('bulletList')}
            onPressedChange={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            aria-label="Bullet List"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor?.isActive('code')}
            onPressedChange={() => editor?.chain().focus().toggleCode().run()}
            disabled={disabled}
            aria-label="Code"
          >
            <Code className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor?.isActive('blockquote')}
            onPressedChange={() => editor?.chain().focus().toggleBlockquote().run()}
            disabled={disabled}
            aria-label="Quote"
          >
            <Quote className="h-4 w-4" />
          </Toggle>
          <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <DialogTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor?.isActive('link')}
                disabled={disabled}
                aria-label="Link"
              >
                <Link2 className="h-4 w-4" />
              </Toggle>
            </DialogTrigger>
            <InsertDialog
              open={showLinkDialog}
              onOpenChange={setShowLinkDialog}
              onSubmit={setLink}
              title="Insert Link"
              placeholder="https://example.com"
            />
          </Dialog>
          <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
            <DialogTrigger asChild>
              <Toggle
                size="sm"
                disabled={disabled}
                aria-label="Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Toggle>
            </DialogTrigger>
            <InsertDialog
              open={showImageDialog}
              onOpenChange={setShowImageDialog}
              onSubmit={insertImage}
              title="Insert Image"
              placeholder="https://example.com/image.jpg"
            />
          </Dialog>
        </div>

        <EditorContent editor={editor} />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || !title.trim() || !editor?.getText().trim() || disabled}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Document
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 
