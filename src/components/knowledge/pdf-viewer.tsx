'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  title: string;
}

export default function PDFViewer({ url, title }: PDFViewerProps) {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <p className="text-destructive">{error}</p>
        <Button asChild>
          <a href={url} download={title} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button asChild variant="outline" size="sm">
          <a href={url} download={title} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        </Button>
      </div>
      <ScrollArea className="h-[600px] rounded-md border">
        <div className="flex justify-center p-4">
          <iframe
            src={`${url}#toolbar=0`}
            className="w-full h-[600px] border-0"
            onError={() => setError('Failed to load PDF. Please try downloading it instead.')}
          />
        </div>
      </ScrollArea>
    </div>
  );
} 