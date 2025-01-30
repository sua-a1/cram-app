'use client';

import { useState } from 'react';
import type { KnowledgeDocument, KnowledgeCategory } from '@/types/knowledge';
import { DocumentList } from '@/components/knowledge/document-list';

interface KnowledgeCenterProps {
  initialDocuments: KnowledgeDocument[];
  initialCategories: KnowledgeCategory[];
  user: any; // TODO: Add proper user type
}

export function KnowledgeCenter({ 
  initialDocuments,
  initialCategories,
  user
}: KnowledgeCenterProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <div className="space-y-4">
      <DocumentList 
        documents={initialDocuments}
        canEdit={user?.role === 'admin'}
        canDelete={user?.role === 'admin'}
        isLoading={isLoading}
      />
    </div>
  );
} 
