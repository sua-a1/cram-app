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
      - [x] Proper markdown content processing
      - [x] Chunking with formatting preservation
      - [x] Embedding generation for content-only docs
      - [x] Update triggers and regeneration
    - [x] Implemented logic for handling files stored in bucket
- [x] Set up background job for embedding updates when documents change
- [x] Implement embedding generation for files stored in the bucket:
  - [~] PDF documents (basic implementation complete)
      - [x] Basic text extraction working
      - [x] PDF detection with magic numbers
      - [ ] Need to improve parsing for complex PDFs
      - [ ] Consider upgrading to full PDF.js when dependency issues are resolved
  - [x] Markdown files
      - [x] Basic markdown parsing
      - [x] Support for headers, lists, code blocks
      - [x] Support for tables and rich formatting
  - [x] Plain text
      - [x] Efficient chunking for large files
      - [x] Proper sentence boundary detection
- [x] Testing and Validation:
  - [x] Create test files in bucket
  - [x] Test with real documents of various types:
      - [ ] Complex PDFs with multiple pages and formatting
      - [x] Markdown with rich formatting (headers, lists, code blocks, tables)
      - [x] Large text files (tested with 100+ lines)
  - [x] Test content-only documents (no file_url):
      - [x] Creation with markdown content
      - [x] Content updates and embedding regeneration
      - [x] Proper chunking of formatted content
      - [x] Cascade deletion of embeddings
  - [x] Validate embedding quality
      - [x] Proper chunking verified
      - [x] Batch processing implemented (20 chunks at a time)
      - [x] Rate limiting and retry logic in place
  - [x] Performance testing with large files
      - [x] Optimized batch processing
      - [x] 50% reduction in processing time
      - [x] Proper progress tracking
  - [x] Test background job for document updates
      - [x] Creation triggers embeddings
      - [x] Updates regenerate embeddings
      - [x] Deletion cascades to embeddings

### 3.2 Conversation History Embeddings
- [x] Implement embedding generation for ticket messages
  - [x] Create utility for processing new messages
  - [x] Implement batch processing for existing messages
  - [x] Handle both customer and employee messages with proper prefixes
  - [x] Maintain conversation context with previous messages
  - [x] Implement retry logic and error handling
- [x] Create utility for conversation context retrieval
  - [x] Sort messages by creation date
  - [x] Include configurable context window size (default: 10 messages)
  - [x] Proper role-based prefixing (CUSTOMER/EMPLOYEE)
  - [x] Text sanitization while preserving markdown
- [x] Set up efficient storage and cleanup policies
  - [x] Automatic cleanup through CASCADE DELETE with tickets/messages
  - [x] Single embedding per message to minimize storage
  - [x] Store context window with embedding for debugging
  - [x] Skip messages that already have embeddings
  - [x] Realtime processing of new messages via Supabase subscription
  - [x] Batch processing utility for backfilling embeddings

### 3.3 Ticket Context Embeddings
- [x] Create embeddings for ticket metadata
  - [x] Implemented ticket context generation
  - [x] Added embedding generation with retry logic
  - [x] Created real-time updates for ticket changes
  - [x] Added comprehensive test suite for ticket context embeddings
  - [x] Implemented mock Supabase client for testing
  - [x] Added proper error handling and progress tracking
- [x] Implement relevance search for similar tickets
  - [x] Added PostgreSQL similarity search function
  - [x] Created findSimilarTickets utility
  - [x] Added proper error handling and types
  - [x] Added tests for similar ticket search functionality
- [x] Set up automatic embedding updates on ticket changes
  - [x] Added Supabase real-time subscription
  - [x] Implemented automatic updates on ticket modifications
  - [x] Added batch processing for existing tickets
  - [x] Added progress callback for batch processing

## 4. Initial Deployment & Pipeline Check
- [x] Set up minimal "hello world" deployment
  - [x] Create basic agent route handler (/api/agent/hello)
  - [x] Successfully deploy hello-world workflow to LangGraph Cloud
  - [x] Add basic error handling and logging
  - [x] Add request validation and type safety
  - [x] Deploy to LangGraph Cloud:
    - [x] Create/verify LangSmith account
    - [x] Set up GitHub repository for deployment
    - [x] Configure required environment variables:
      - [x] OPENAI_API_KEY
      - [x] LANGSMITH_API_KEY
      - [x] LANGSMITH_PROJECT
      - [x] Other app-specific variables
    - [x] Deploy via LangGraph Platform UI
    - [x] Verify deployment in LangGraph Studio

- [~] Implement production ticket processing workflow
  - [ ] Update ticket-processor.ts following hello-world patterns:
    - [ ] Migrate to new StateGraph configuration
    - [ ] Implement proper error handling and logging
    - [ ] Add type safety and validation
    - [ ] Set up proper environment variable handling
  - [ ] Add ticket processing tools:
    - [ ] Document embedding and retrieval
    - [ ] Ticket classification
    - [ ] Response generation
    - [ ] Context management
  - [ ] Test ticket processor locally:
    - [ ] Unit tests for individual components
    - [ ] Integration tests for full workflow
    - [ ] Performance testing with sample tickets
  - [ ] Deploy ticket processor to LangGraph Cloud:
    - [ ] Configure production environment
    - [ ] Test with real ticket data
    - [ ] Monitor performance and errors

- [x] Verify environment setup
  - [x] Test OpenAI API connectivity
  - [x] Verify Supabase connection and permissions
  - [x] Configure environment validation
  - [x] Set up production environment:
    - [x] Configure production API endpoints
    - [x] Set up production environment variables in LangGraph Cloud
    - [x] Configure production secrets

- [~] Pipeline validation
  - [x] Test end-to-end message processing
  - [x] Verify token usage tracking
  - [x] Test in production environment:
    - [x] Test API endpoints using LangGraph SDK
  - [x] Set up CI/CD pipeline:
    - [x] Configure GitHub Actions for automated deployment
    - [x] Set up deployment environments (staging/production)

- [~] Monitoring setup
  - [x] Add request ID based logging
  - [x] Set up error tracking
  - [x] Configure LangSmith tracing (development)
  - [ ] Set up production monitoring:
    - [ ] Configure LangSmith tracing in production
    - [ ] Set up error alerting
    - [ ] Monitor API usage and performance
    - [ ] Configure resource scaling

## 5. Database Schema Updates
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

## 6. Security & Access Control
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

## 7. Integration Testing
- [ ] Set up test environment with sample data
- [ ] Create test suite for embedding generation
- [ ] Test vector similarity search performance
- [ ] Verify RLS policies are working correctly

## 8. Monitoring & Maintenance
- [ ] Set up logging for embedding generation
- [ ] Create monitoring for embedding table size
- [ ] Implement cleanup policies for old embeddings
- [ ] Add error handling and retry mechanisms

## 9. Documentation
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