'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Send, Bold, Italic, Link2, Image as ImageIcon, List, Code, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageType } from '@/types/tickets';
import { useDebounce } from '@/hooks/use-debounce';
import { TemplateSelector } from './template-selector';

interface MessageComposerProps {
  ticketId: string;
  onSendMessage: (message: { body: string; messageType: MessageType }) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
  title: string;
  placeholder: string;
}

function InsertDialog({ open, onOpenChange, onSubmit, title, placeholder }: LinkDialogProps) {
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

export function MessageComposer({ 
  ticketId, 
  onSendMessage, 
  className,
  disabled = false 
}: MessageComposerProps) {
  // Get draft key for this specific ticket
  const getDraftKey = useCallback(() => `ticket-draft-${ticketId}`, [ticketId]);

  const [sending, setSending] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const debouncedContent = useDebounce(draftContent, 1000);

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
        placeholder: 'Type your message... (Supports Markdown)',
        emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none',
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[100px] px-3 py-2 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      setDraftContent(editor.getHTML());
    },
  });

  // Load draft on mount
  useEffect(() => {
    if (!editor) return;
    
    const savedDraft = localStorage.getItem(getDraftKey());
    if (savedDraft) {
      editor.commands.setContent(savedDraft);
    }
  }, [editor, getDraftKey]);

  // Save draft when content changes
  useEffect(() => {
    if (debouncedContent) {
      localStorage.setItem(getDraftKey(), debouncedContent);
    }
  }, [debouncedContent, getDraftKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!editor?.getText().trim() || sending || disabled) {
      return;
    }

    const messageContent = editor.getHTML();
    
    if (!messageContent) {
      return;
    }

    setSending(true);

    try {
      await onSendMessage({
        body: messageContent,
        messageType: 'public'
      });
      
      // Clear content and remove draft after successful send
      editor.commands.clearContent();
      editor.commands.focus();
      localStorage.removeItem(getDraftKey());
      setDraftContent('');
    } catch (error) {
      console.error('Error sending message:', error);
      setSending(false);
      return;
    }

    setSending(false);
  };

  const insertImage = useCallback((url: string) => {
    if (!editor) return;
    
    // Prevent auto-submit when inserting image
    setSending(false);
    
    editor
      .chain()
      .focus()
      .setImage({ src: url })
      .run();
  }, [editor]);

  const setLink = useCallback((url: string) => {
    if (!editor) return;
    
    // Prevent auto-submit when inserting link
    setSending(false);

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

  // Modify the keydown handler to be more robust
  useEffect(() => {
    if (!editor) return;
    
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        
        // Create a synthetic event and call handleSubmit
        const syntheticEvent = new Event('submit', {
          bubbles: true,
          cancelable: true
        }) as any;
        
        await handleSubmit(syntheticEvent);
      }
    };

    const element = editor.view.dom;
    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, handleSubmit]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      setSending(false);
    };
  }, []);

  const handleTemplateSelect = useCallback((template: { content: string }) => {
    if (editor) {
      editor.commands.setContent(template.content)
    }
  }, [editor])

  return (
    <div className={cn('space-y-2', className)}>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  name="url"
                  placeholder="https://example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const url = e.currentTarget.value;
                      if (url) {
                        setLink(url);
                        setShowLinkDialog(false);
                      }
                    }
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const input = document.getElementById('url') as HTMLInputElement;
                    const url = input.value;
                    if (url) {
                      setLink(url);
                      setShowLinkDialog(false);
                    }
                  }}
                >
                  Insert
                </Button>
              </div>
            </div>
          </DialogContent>
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
        </Dialog>
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  name="url"
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const url = e.currentTarget.value;
                      if (url) {
                        insertImage(url);
                        setShowImageDialog(false);
                      }
                    }
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const input = document.getElementById('imageUrl') as HTMLInputElement;
                    const url = input.value;
                    if (url) {
                      insertImage(url);
                      setShowImageDialog(false);
                    }
                  }}
                >
                  Insert
                </Button>
              </div>
            </div>
          </DialogContent>
          <DialogTrigger asChild>
            <Toggle
              size="sm"
              disabled={disabled}
              aria-label="Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Toggle>
          </DialogTrigger>
        </Dialog>
        <div className="ml-auto">
          <TemplateSelector onSelectTemplate={handleTemplateSelect} />
        </div>
      </div>
      <EditorContent editor={editor} disabled={disabled} />
      {draftContent && (
        <div className="px-3 py-1 text-xs text-muted-foreground border-t">
          Draft saved
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!editor?.getText().trim() || sending || disabled}
            className="gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}