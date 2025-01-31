-- Enable the pgvector extension if not already enabled
create extension if not exists vector;

-- Create the documents table if it doesn't exist
create table if not exists documents (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    chunk_text text not null,
    metadata jsonb default '{}'::jsonb,
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index for vector similarity search
create index if not exists documents_embedding_idx 
    on documents 
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

-- Create the match_documents function
create or replace function match_documents(
    query_embedding vector(1536),
    match_threshold float default 0.7,
    match_count int default 5
)
returns table (
    id uuid,
    title text,
    chunk_text text,
    metadata jsonb,
    similarity float
)
language plpgsql
security definer
as $$
begin
    return query
    select
        documents.id,
        documents.title,
        documents.chunk_text,
        documents.metadata,
        1 - (documents.embedding <=> query_embedding) as similarity
    from documents
    where 1 - (documents.embedding <=> query_embedding) > match_threshold
    order by similarity desc
    limit match_count;
end;
$$;

-- Grant access to the function
grant execute on function match_documents(vector, float, int) to anon, authenticated, service_role;

-- Create RLS policies for the documents table
alter table documents enable row level security;

create policy "Allow public read access"
    on documents for select
    to anon, authenticated
    using (true);

create policy "Allow service role full access"
    on documents for all
    to service_role
    using (true)
    with check (true); 