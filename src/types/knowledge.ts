import { Profile } from './database';
import type { Profile as AuthProfile } from './auth';

export type DocumentStatus = 'draft' | 'published' | 'archived';

export type SerializedFile = {
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded data
};

export interface DocumentMetadata {
  version?: string;
  lastEditedBy?: string;
  originalFileName?: string;
  fileSize?: number;
  mimeType?: string;
  tags?: string[];
  [key: string]: any;
}

export interface KnowledgeCategory {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  org_id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: DocumentStatus;
  metadata: DocumentMetadata;
  author?: Profile | null;
  categories?: KnowledgeCategory[] | null;
}

export interface KnowledgeDocumentWithDetails extends KnowledgeDocument {
  author?: Profile | null;
  categories?: KnowledgeCategory[] | null;
}

export interface DocumentFilter {
  search?: string;
  status?: DocumentStatus;
  is_public?: boolean;
  categoryIds?: string[];
  orgId?: string;
}

export interface CategoryFilter {
  search?: string;
  orgId?: string;
}

// Response types for our server actions
export interface DocumentResponse {
  data: KnowledgeDocument | null;
  error: Error | null;
}

export interface DocumentsResponse {
  data: KnowledgeDocument[];
  error: Error | null;
}

export interface CategoryResponse {
  data: KnowledgeCategory | null;
  error: Error | null;
}

export interface CategoriesResponse {
  data: KnowledgeCategory[];
  error: Error | null;
}

// Request types for our server actions
export type CreateDocumentRequest = {
  title: string;
  content?: string;
  file?: SerializedFile;
  is_public: boolean;
  status: DocumentStatus;
  categoryIds?: string[];
  metadata?: Record<string, any>;
};

export interface UpdateDocumentRequest extends Partial<CreateDocumentRequest> {
  id: string;
  file_url?: string;
  file_type?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
} 
