'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { KnowledgeDocument } from '@/types/knowledge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Pencil, Trash, ExternalLink } from 'lucide-react';
import { DocumentPreview } from './document-preview';
import { useToast } from '@/hooks/use-toast';
import { deleteDocument } from '@/app/actions/knowledge';

interface DocumentListProps {
  documents: KnowledgeDocument[];
  isLoading: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

function DocumentItem({
  document,
  canEdit,
  canDelete,
}: {
  document: KnowledgeDocument;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      const { error } = await deleteDocument(document.id);
      if (error) throw error;

      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully."
      });
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

  return (
    <>
      <div 
        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
        onClick={() => setIsPreviewOpen(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-medium">{document.title}</h3>
              <p className="text-sm text-muted-foreground">
                {document.status} • {document.is_public ? 'Public' : 'Internal'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/org/knowledge/${document.id}`);
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Page
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/org/knowledge/${document.id}/edit`);
                }}
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
        </div>
      </div>

      <DocumentPreview
        url={document.file_url}
        fileType={document.file_type}
        title={document.title}
        content={document.content}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        documentId={document.id}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </>
  );
}

export function DocumentList({
  documents,
  isLoading,
  canEdit,
  canDelete,
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No documents found</h3>
        <p className="text-sm text-muted-foreground">
          Get started by creating a new document or uploading an existing one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <DocumentItem
          key={doc.id}
          document={doc}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
} 
