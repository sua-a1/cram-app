'use client';

import Link from 'next/link'
import { Plus, Search, Upload, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DocumentList } from '@/components/knowledge/document-list'
import type { KnowledgeDocument, DocumentStatus, KnowledgeCategory } from '@/types/knowledge'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileUploader } from '@/components/knowledge/file-uploader'
import { KnowledgeCenter } from './knowledge-center'
import { CategorySelector } from '@/components/knowledge/category-selector'
import { useRouter } from 'next/navigation'

interface KnowledgeCenterPageProps {
  initialDocuments: KnowledgeDocument[];
  initialCategories: KnowledgeCategory[];
  user: any;
}

export default function KnowledgeCenterPage({
  initialDocuments,
  initialCategories,
  user,
}: KnowledgeCenterPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'internal'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const router = useRouter();

  const filteredDocuments = initialDocuments.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    const matchesVisibility = visibilityFilter === 'all' ||
      (visibilityFilter === 'public' && doc.is_public) ||
      (visibilityFilter === 'internal' && !doc.is_public);

    const matchesCategories = selectedCategories.length === 0 || 
      doc.categories?.some(category => selectedCategories.includes(category.id));

    return matchesSearch && matchesStatus && matchesVisibility && matchesCategories;
  });

  const handleUploadComplete = () => {
    setIsUploadOpen(false);
    router.refresh();
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/org/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Knowledge Center</h1>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <FileUploader 
                onUploadComplete={handleUploadComplete}
                categories={initialCategories}
              />
            </DialogContent>
          </Dialog>
          <Button asChild>
            <Link href="/org/knowledge/new">
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={visibilityFilter} onValueChange={(value: typeof visibilityFilter) => setVisibilityFilter(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CategorySelector
        categories={initialCategories}
        selectedCategories={selectedCategories}
        onSelectCategories={setSelectedCategories}
        canCreate
      />

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <KnowledgeCenter
          initialDocuments={filteredDocuments}
          initialCategories={initialCategories}
          user={user}
        />
      </div>
    </div>
  );
} 
