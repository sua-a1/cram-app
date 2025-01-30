'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Loader2, ExternalLink, Pencil, Trash } from 'lucide-react';
import mammoth from 'mammoth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { deleteDocument, convertWordDocument } from '@/app/actions/knowledge';
import JSZip from 'jszip';

// Dynamically import PDF viewer
const PDFViewer = dynamic(() => import('./pdf-viewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

export interface DocumentPreviewProps {
  url: string | null;
  fileType: string | null;
  title: string;
  content: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function DocumentPreview({
  url,
  fileType,
  title,
  content,
  open,
  onOpenChange,
  documentId,
  canEdit = false,
  canDelete = false,
}: DocumentPreviewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertedContent, setConvertedContent] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  useEffect(() => {
    const loadContent = async () => {
      if (!url || !fileType) return;
      
      setLoading(true);
      setError(null);
      setConvertedContent(null);

      try {
        if (fileType.includes('word')) {
          const result = await convertWordDocument(url);
          if (!result.success || !result.content) {
            throw new Error(result.error || 'Failed to convert document');
          }
          setConvertedContent(result.content);
        } else if (fileType === 'text/plain' || fileType === 'text/markdown') {
          const response = await fetch(url);
          const text = await response.text();
          setConvertedContent(text);
        }
      } catch (err) {
        console.error('Error loading document:', err);
        setError('Failed to load document. Please try downloading it instead.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      if (content) {
        setLoading(false);
      } else {
        loadContent();
      }
    }
  }, [url, fileType, isOpen, content]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      const { error } = await deleteDocument(documentId);
      if (error) throw error;

      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully."
      });
      handleOpenChange(false);
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete document",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <p className="text-destructive">{error}</p>
          <Button asChild>
            <a href={url || ''} download={title} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Document
            </a>
          </Button>
        </div>
      );
    }

    if (content) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );
    }

    if (url && fileType) {
      if (fileType.includes('word') && convertedContent) {
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: convertedContent }} />
          </div>
        );
      }

      if ((fileType === 'text/plain' || fileType === 'text/markdown') && convertedContent) {
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {convertedContent}
          </div>
        );
      }

      if (fileType === 'application/pdf') {
        return url ? (
          <PDFViewer url={url} title={title} />
        ) : (
          <p className="text-muted-foreground">No PDF URL available.</p>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <p className="text-muted-foreground">Preview not available for this file type.</p>
          <Button asChild>
            <a href={url} download={title} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Document
            </a>
          </Button>
        </div>
      );
    }

    return (
      <p className="text-muted-foreground">No content available.</p>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/org/knowledge/${documentId}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Page
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/org/knowledge/${documentId}/edit`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 px-4">
          {renderContent()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 
