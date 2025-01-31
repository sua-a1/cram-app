-- Enable the pgvector extension if not already enabled
create extension if not exists vector;

-- Drop existing function if it exists
drop function if exists match_documents(vector(1536), float, int);

-- Create or replace the match_documents function to use document_embeddings table
create or replace function match_documents(
    query_embedding vector(1536),
    match_threshold float default 0.7,
    match_count int default 5
)
returns table (
    id uuid,
    document_id uuid,
    title text,
    content text,
    chunk_text text,
    metadata jsonb,
    similarity float
)
language plpgsql
security definer
as $$
begin
    -- Using the existing vector similarity index
    return query
    select
        e.id,
        e.document_id,
        d.title,
        coalesce(d.content, e.chunk_text) as content,  -- Fall back to chunk_text if content is NULL
        e.chunk_text,
        coalesce(e.metadata, '{}'::jsonb) || coalesce(d.metadata, '{}'::jsonb) as metadata,
        1 - (e.embedding <=> query_embedding) as similarity
    from document_embeddings e
    join knowledge_documents d on d.id = e.document_id
    where 1 - (e.embedding <=> query_embedding) > match_threshold
    order by similarity desc
    limit match_count;
end;
$$; 
