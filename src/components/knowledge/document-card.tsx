'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye, Pencil, Trash2, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KnowledgeDocument } from '@/types/knowledge';
import { DocumentPreview } from './document-preview';

interface DocumentCardProps {
  document: KnowledgeDocument;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  isCompact?: boolean;
  className?: string;
}

const STATUS_COLORS = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
} as const;

export function DocumentCard({
  document,
  onView,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  isCompact = false,
  className,
}: DocumentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(document.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <div className={cn(
          'flex gap-4 p-4',
          isCompact ? 'items-center' : 'flex-col sm:flex-row'
        )}>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold leading-none truncate">
                  {document.title}
                </h3>
                {!isCompact && document.content && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {document.content}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={cn(STATUS_COLORS[document.status])}>
                {document.status}
              </Badge>
              <Badge variant="outline">
                {document.is_public ? 'Public' : 'Internal'}
              </Badge>
              {document.categories?.map((category) => (
                <Badge key={category.id} variant="outline">
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className={cn(
            'flex gap-2',
            isCompact ? 'flex-row' : 'flex-row sm:flex-col items-end'
          )}>
            {document.file_url ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                asChild
              >
                <a href={document.file_url} download>
                  <Download className="h-4 w-4" />
                  {!isCompact && 'Download'}
                </a>
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4" />
              {!isCompact && 'Preview'}
            </Button>
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => onEdit(document.id)}
              >
                <Pencil className="h-4 w-4" />
                {!isCompact && 'Edit'}
              </Button>
            )}
            {canDelete && onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                {!isCompact && 'Delete'}
              </Button>
            )}
          </div>
        </div>
        {!isCompact && (
          <div className="px-4 py-2 bg-muted/50 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>
                  {document.author?.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span>{document.author?.display_name || 'Unknown User'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Created {new Date(document.created_at).toLocaleDateString()}</span>
              {document.updated_at && (
                <span>Updated {new Date(document.updated_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document &quot;{document.title}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DocumentPreview
        url={document.file_url || ''}
        fileType={document.file_type || 'text/plain'}
        title={document.title}
        content={document.content}
        open={showPreview}
        onOpenChange={setShowPreview}
        documentId={document.id}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </>
  );
} 
