# AI Agent Setup & Integration Checklist

## Overview
This checklist covers the initial setup of the AI Agent within the Cram project, focusing on directory structure, pgvector setup, and embedding management. This implementation follows the plan outlined in `docs/Agent Plan Overview.md` and `docs/AI Agent Planning.md`.

## Prerequisites
- [x] Review and understand current schema in `initial-schema.md`
- [x] Verify Supabase project has pgvector extension enabled
- [x] Ensure all necessary environment variables are set up
- [x] Confirm access to OpenAI API (for embeddings generation)

## 1. Directory Structure Setup
- [x] Create `/agents` directory at project root
  ```bash
  mkdir agents
  ```
- [x] Set up core agent directories:
  ```
  /agents
  ├── config/           # Configuration files
  ├── tools/            # Tool definitions
  ├── workflows/        # LangGraph workflows
  ├── types/           # TypeScript types
  ├── utils/           # Utility functions
  └── tests/           # Test files
  ```

## 2. Supabase pgvector Setup
- [x] Create new tables for embeddings:
  - [x] Document embeddings table
  - [x] Conversation history embeddings table
  - [x] Ticket context embeddings table
- [x] Set up proper RLS policies for each table
- [x] Create necessary indexes for vector similarity search
- [x] Implement embedding generation utilities
  - [x] Core embedding generation with retry logic
  - [x] Batch processing (20 chunks at a time)
  - [x] Progress tracking
  - [x] Error handling and logging

## 3. Embedding Management Implementation
### 3.1 Document Embeddings
- [x] Create utility for processing stored files from 'knowledge-documents' bucket
- [x] Create utility for processing 'content' column from 'knowledge-documents' table
    - [x] Implemented logic for handling content when file_url is NULL
    - [x] Implemented logic for handling files stored in bucket
- [x] Set up background job for embedding updates when documents change
- [ ] Implement embedding generation for files stored in the bucket:
  - [~] PDF documents (basic implementation complete)
      - [x] Basic text extraction working
      - [x] PDF detection with magic numbers
      - [ ] Need to improve parsing for complex PDFs
      - [ ] Consider upgrading to full PDF.js when dependency issues are resolved
  - [x] Markdown files
  - [x] Plain text
- [ ] Testing and Validation:
  - [ ] Create test files in bucket
  - [ ] Test with real documents of various types:
      - [ ] Complex PDFs with multiple pages and formatting
      - [ ] Markdown with rich formatting
      - [ ] Large text files
  - [ ] Validate embedding quality
  - [ ] Performance testing with large files
  - [ ] Test background job for document updates

### 3.2 Conversation History Embeddings
- [ ] Implement embedding generation for ticket messages
- [ ] Create utility for conversation context retrieval
- [ ] Set up efficient storage and cleanup policies

### 3.3 Ticket Context Embeddings
- [ ] Create embeddings for ticket metadata
- [ ] Implement relevance search for similar tickets
- [ ] Set up automatic embedding updates on ticket changes

## 4. Database Schema Updates
- [x] Add embedding-related tables:
```sql
-- Document Embeddings
CREATE TABLE public.document_embeddings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id uuid REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    embedding vector(1536),  -- For OpenAI embeddings
    chunk_index integer,
    chunk_text text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Conversation Embeddings
CREATE TABLE public.conversation_embeddings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
    message_id uuid REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
    embedding vector(1536),
    context_window text,    -- The actual text that was embedded
    created_at timestamptz DEFAULT now()
);

-- Ticket Context Embeddings
CREATE TABLE public.ticket_context_embeddings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
    embedding vector(1536),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

## 5. Security & Access Control
- [ ] Implement RLS policies for new tables:
```sql
-- Document Embeddings
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to embeddings of public documents"
    ON public.document_embeddings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.knowledge_documents
            WHERE id = document_embeddings.document_id
            AND is_public = true
            AND status = 'published'
        )
    );

CREATE POLICY "Org members can access their document embeddings"
    ON public.document_embeddings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.knowledge_documents d
            JOIN public.profiles p ON p.org_id = d.org_id
            WHERE d.id = document_embeddings.document_id
            AND p.user_id = auth.uid()
            AND p.role IN ('admin', 'employee')
        )
    );

-- Similar policies for conversation and ticket embeddings
```

## 6. Integration Testing
- [ ] Set up test environment with sample data
- [ ] Create test suite for embedding generation
- [ ] Test vector similarity search performance
- [ ] Verify RLS policies are working correctly

## 7. Monitoring & Maintenance
- [ ] Set up logging for embedding generation
- [ ] Create monitoring for embedding table size
- [ ] Implement cleanup policies for old embeddings
- [ ] Add error handling and retry mechanisms

## 8. Documentation
- [ ] Document embedding generation process
- [ ] Create API documentation for vector search endpoints
- [ ] Document security policies and access patterns
- [ ] Add maintenance procedures

## Next Steps
After completing this checklist, proceed to Phase Two: Memory & Multi-Step Conversations implementation.

## Notes
- All vector columns use dimension 1536 for OpenAI embeddings
- Consider implementing batched embedding generation for large documents
- Monitor performance and adjust chunk sizes as needed
- Consider implementing caching for frequently accessed embeddings 