'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Globe, Lock, Download, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import mammoth from 'mammoth';
import type { KnowledgeDocument } from '@/types/knowledge';
import dynamic from 'next/dynamic';
import JSZip from 'jszip';
import { convertWordDocument } from '@/app/actions/knowledge';

// Dynamically import PDF viewer
const PDFViewer = dynamic(() => import('./pdf-viewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

interface DocumentViewProps {
  document: KnowledgeDocument;
  isAdmin: boolean;
}

export function DocumentView({ document, isAdmin }: DocumentViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertedContent, setConvertedContent] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      if (!document.file_url || !document.file_type) return;
      
      setLoading(true);
      setError(null);
      setConvertedContent(null);

      try {
        if (document.file_type.includes('word')) {
          const result = await convertWordDocument(document.file_url);
          if (!result.success) {
            throw new Error(result.error || 'Failed to convert document');
          }
          if (!result.content) {
            throw new Error('Document conversion produced no content');
          }
          setConvertedContent(result.content);
        } else if (document.file_type === 'text/plain' || document.file_type === 'text/markdown') {
          const response = await fetch(document.file_url);
          if (!response.ok) {
            throw new Error(`Failed to fetch document: ${response.statusText}`);
          }
          const text = await response.text();
          setConvertedContent(text);
        }
      } catch (err: any) {
        console.error('Error loading document:', err);
        setError(err?.message || 'Failed to load document. Please try downloading it instead.');
      } finally {
        setLoading(false);
      }
    };

    if (document.content) {
      setLoading(false);
    } else {
      loadContent();
    }
  }, [document.file_url, document.file_type, document.content]);

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
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 text-center p-4">
          <p className="text-red-600">{error}</p>
          <Button asChild variant="outline">
            <a href={document.file_url || '#'} download target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download Document
            </a>
          </Button>
        </div>
      );
    }

    if (document.content) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: document.content }} />
        </div>
      );
    }

    // Handle file-based content
    if (document.file_url) {
      if (document.file_type?.includes('word') && convertedContent) {
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: convertedContent }} />
          </div>
        );
      }

      if ((document.file_type === 'text/plain' || document.file_type === 'text/markdown') && convertedContent) {
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {convertedContent}
          </div>
        );
      }

      if (document.file_type === 'application/pdf') {
        return document.file_url ? (
          <PDFViewer url={document.file_url} title={document.title} />
        ) : (
          <p className="text-muted-foreground">No PDF URL available.</p>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <p className="text-muted-foreground">Preview not available for this file type.</p>
          <Button asChild>
            <a href={document.file_url} download={document.title} className="flex items-center gap-2">
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          asChild
        >
          <Link href="/org/knowledge">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Knowledge Center
          </Link>
        </Button>
        {isAdmin && (
          <Button asChild>
            <Link href={`/org/knowledge/${document.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Document
            </Link>
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{document.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={document.status === 'published' ? 'default' : 'secondary'}>
                  {document.status}
                </Badge>
                <Badge variant="outline">
                  {document.is_public ? (
                    <>
                      <Globe className="mr-1 h-3 w-3" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="mr-1 h-3 w-3" />
                      Internal
                    </>
                  )}
                </Badge>
              </div>
            </div>
            {document.file_url && (
              <Button asChild variant="outline" size="sm">
                <a href={document.file_url} download={document.title} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
          </div>

          <ScrollArea className="h-[600px]">
            {renderContent()}
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
} 
