'use server';

import { createServerSupabaseClient } from '@/lib/server/supabase';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { initializeStorage } from './storage';
import {
  type DocumentResponse,
  type DocumentsResponse,
  type CategoryResponse,
  type CategoriesResponse,
  type CreateDocumentRequest,
  type UpdateDocumentRequest,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
  type DocumentFilter,
  type CategoryFilter,
  type KnowledgeDocumentWithDetails,
  type KnowledgeCategory,
} from '@/types/knowledge';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import mammoth from 'mammoth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { unlink } from 'fs/promises';
import { Document } from '@tiptap/extension-document';
import { Node } from 'prosemirror-model';

// Helper function to get user's org_id and role
async function getUserContext() {
  const supabase = createServerSupabaseClient(cookies());
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  return { userId: user.id, orgId: profile.org_id, role: profile.role };
}

// Document Actions
export async function createDocument(request: CreateDocumentRequest): Promise<DocumentResponse> {
  try {
    const supabase = createServerSupabaseClient(cookies());
    const { userId, orgId, role } = await getUserContext();

    if (!orgId || role === 'customer') {
      throw new Error('Unauthorized');
    }

    let fileUrl = null;
    let fileType = null;
    let metadata = request.metadata || {};

    // Handle file upload if present
    if (request.file) {
      const fileExt = request.file.name.split('.').pop();
      const filePath = `${orgId}/${userId}/${Date.now()}.${fileExt}`;
      
      try {
        // Convert base64 to Buffer
        const buffer = Buffer.from(request.file.data, 'base64');
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('knowledge-documents')
          .upload(filePath, buffer, {
            contentType: request.file.type,
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('knowledge-documents')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileType = request.file.type;
        metadata = {
          ...metadata,
          originalFileName: request.file.name,
          fileSize: request.file.size,
          mimeType: request.file.type
        };
      } catch (error: any) {
        console.error('File upload failed:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }
    }

    // Create document
    const { data: document, error: documentError } = await supabase
      .from('knowledge_documents')
      .insert({
        org_id: orgId,
        title: request.title,
        content: request.content,
        file_url: fileUrl,
        file_type: fileType,
        is_public: request.is_public,
        status: request.status,
        created_by: userId,
        metadata
      })
      .select('*, author:profiles(*)')
      .single();

    if (documentError) throw documentError;

    // Add categories if provided
    if (request.categoryIds?.length) {
      const categoryLinks = request.categoryIds.map(categoryId => ({
        document_id: document.id,
        category_id: categoryId
      }));

      const { error: categoryError } = await supabase
        .from('knowledge_document_categories')
        .insert(categoryLinks);

      if (categoryError) throw categoryError;
    }

    revalidatePath('/org/[orgId]/knowledge');
    return { data: document, error: null };
  } catch (error) {
    console.error('Error creating document:', error);
    return { data: null, error: error as Error };
  }
}

export async function updateDocument(request: UpdateDocumentRequest): Promise<DocumentResponse> {
  try {
    const supabase = createServerSupabaseClient(cookies());
    const { userId, orgId, role } = await getUserContext();

    if (!orgId || role === 'customer') {
      throw new Error('Unauthorized');
    }

    // Get existing document
    const { data: existingDoc, error: fetchError } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('id', request.id)
      .single();

    if (fetchError || !existingDoc) {
      throw new Error('Document not found');
    }

    // Verify org access
    if (existingDoc.org_id !== orgId) {
      throw new Error('Unauthorized');
    }

    let updates: Partial<KnowledgeDocumentWithDetails> = {
      ...request,
      metadata: {
        ...existingDoc.metadata,
        ...request.metadata,
        lastEditedBy: userId
      }
    };

    // Handle file update if present
    if (request.file) {
      const fileExt = request.file.name.split('.').pop();
      const filePath = `${orgId}/${userId}/${Date.now()}.${fileExt}`;
      
      // Delete old file if exists
      if (existingDoc.file_url) {
        const oldPath = existingDoc.file_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('knowledge-documents')
            .remove([oldPath]);
        }
      }

      // Upload new file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-documents')
        .upload(filePath, Buffer.from(request.file.data, 'base64'), {
          contentType: request.file.type,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('knowledge-documents')
        .getPublicUrl(filePath);

      updates.file_url = publicUrl;
      updates.file_type = request.file.type;
      updates.metadata = {
        ...updates.metadata,
        originalFileName: request.file.name,
        fileSize: request.file.size,
        mimeType: request.file.type
      };
    }

    // Update document
    const { data: document, error: updateError } = await supabase
      .from('knowledge_documents')
      .update(updates)
      .eq('id', request.id)
      .select('*, author:profiles(*)')
      .single();

    if (updateError) throw updateError;

    // Update categories if provided
    if (request.categoryIds) {
      // Delete existing category links
      await supabase
        .from('knowledge_document_categories')
        .delete()
        .eq('document_id', request.id);

      // Add new category links
      if (request.categoryIds.length > 0) {
        const categoryLinks = request.categoryIds.map(categoryId => ({
          document_id: request.id,
          category_id: categoryId
        }));

        const { error: categoryError } = await supabase
          .from('knowledge_document_categories')
          .insert(categoryLinks);

        if (categoryError) throw categoryError;
      }
    }

    revalidatePath('/org/[orgId]/knowledge');
    return { data: document, error: null };
  } catch (error) {
    console.error('Error updating document:', error);
    return { data: null, error: error as Error };
  }
}

export async function deleteDocument(id: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createServerSupabaseClient(cookies());
    const { orgId, role } = await getUserContext();

    if (!orgId || role === 'customer') {
      throw new Error('Unauthorized');
    }

    // Get document to check org_id and get file_url
    const { data: document, error: fetchError } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !document) {
      throw new Error('Document not found');
    }

    if (document.org_id !== orgId) {
      throw new Error('Unauthorized');
    }

    // Delete file if exists
    if (document.file_url) {
      const filePath = document.file_url.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('knowledge-documents')
          .remove([filePath]);
      }
    }

    // Delete document (this will cascade to knowledge_document_categories)
    const { error: deleteError } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    revalidatePath('/org/[orgId]/knowledge');
    return { error: null };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { error: error as Error };
  }
}

export async function getDocument(id: string): Promise<DocumentResponse> {
  try {
    const supabase = createServerSupabaseClient(cookies());
    const { orgId, role } = await getUserContext();

    const { data: document, error } = await supabase
      .from('knowledge_documents')
      .select(`
        *,
        author:profiles(*),
        categories:knowledge_document_categories(
          category:knowledge_categories(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!document.is_public && document.org_id !== orgId) {
      throw new Error('Unauthorized');
    }

    // Transform categories data structure
    const transformedDocument = {
      ...document,
      categories: document.categories?.map((c: { category: KnowledgeCategory }) => c.category)
    };

    return { data: transformedDocument, error: null };
  } catch (error) {
    console.error('Error fetching document:', error);
    return { data: null, error: error as Error };
  }
}

export async function getDocuments(filter?: DocumentFilter): Promise<DocumentsResponse> {
  try {
    const supabase = createServerSupabaseClient(cookies());
    const { orgId, role } = await getUserContext();

    let query = supabase
      .from('knowledge_documents')
      .select(`
        *,
        author:profiles(*),
        categories:knowledge_document_categories(
          category:knowledge_categories(*)
        )
      `);

    // Apply filters
    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    if (filter?.is_public !== undefined) {
      query = query.eq('is_public', filter.is_public);
    }

    if (filter?.orgId) {
      query = query.eq('org_id', filter.orgId);
    }

    if (filter?.search) {
      query = query.or(`title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`);
    }

    if (filter?.categoryIds) {
      query = query.contains('categories', filter.categoryIds.map(id => ({ category_id: id })));
    }

    // Add visibility filter based on role
    if (role === 'customer') {
      query = query.eq('is_public', true).eq('status', 'published');
    } else if (role === 'employee' || role === 'admin') {
      query = query.eq('org_id', orgId);
    }

    const { data: documents, error } = await query;

    if (error) throw error;

    // Transform categories data structure
    const transformedDocuments = documents.map(doc => ({
      ...doc,
      categories: doc.categories?.map((c: { category: KnowledgeCategory }) => c.category)
    }));

    return { data: transformedDocuments, error: null };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { data: [], error: error as Error };
  }
}

// Category Actions
export async function createCategory(request: CreateCategoryRequest): Promise<CategoryResponse> {
  try {
    const supabase = createServerSupabaseClient(cookies());
    const { orgId, role } = await getUserContext();

    if (!orgId || role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const { data: category, error } = await supabase
      .from('knowledge_categories')
      .insert({
        org_id: orgId,
        name: request.name,
        description: request.description
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/org/[orgId]/knowledge/categories');
    return { data: category, error: null };
  } catch (error) {
    console.error('Error creating category:', error);
    return { data: null, error: error as Error };
  }
}

export async function updateCategory(request: UpdateCategoryRequest): Promise<CategoryResponse> {
  try {
    const supabase = createServerSupabaseClient(cookies());
    const { orgId, role } = await getUserContext();

    if (!orgId || role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const { data: category, error } = await supabase
      .from('knowledge_categories')
      .update({
        name: request.name,
        description: request.description
      })
      .eq('id', request.id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/org/[orgId]/knowledge/categories');
    return { data: category, error: null };
  } catch (error) {
    console.error('Error updating category:', error);
    return { data: null, error: error as Error };
  }
}

export async function deleteCategory(id: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createServerSupabaseClient(cookies());
    const { orgId, role } = await getUserContext();

    if (!orgId || role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('knowledge_categories')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;

    revalidatePath('/org/[orgId]/knowledge/categories');
    return { error: null };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { error: error as Error };
  }
}

export async function getCategories(filter?: CategoryFilter): Promise<CategoriesResponse> {
  try {
    const supabase = createServerSupabaseClient(cookies());
    const { orgId, role } = await getUserContext();

    if (!orgId || (role !== 'admin' && role !== 'employee')) {
      throw new Error('Unauthorized');
    }

    let query = supabase
      .from('knowledge_categories')
      .select('*')
      .eq('org_id', filter?.orgId || orgId);

    if (filter?.search) {
      query = query.ilike('name', `%${filter.search}%`);
    }

    const { data: categories, error } = await query;

    if (error) throw error;

    return { data: categories, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: [], error: error as Error };
  }
}

export async function convertWordDocument(url: string) {
  'use server'
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch document:', response.status, response.statusText);
      return { success: false, error: `Failed to fetch document: ${response.statusText}` };
    }

    try {
      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (!result || !result.value) {
        console.error('Document conversion returned empty result');
        return { success: false, error: 'Failed to convert document content' };
      }
      
      return { success: true, content: result.value };
    } catch (conversionError: any) {
      console.error('Document conversion error:', conversionError);
      return { 
        success: false, 
        error: `Failed to convert document: ${conversionError?.message || 'Unknown conversion error'}`
      };
    }
  } catch (error: any) {
    console.error('Error in convertWordDocument:', error);
    return { 
      success: false, 
      error: `Failed to process document: ${error?.message || 'Unknown error'}`
    };
  }
} 
