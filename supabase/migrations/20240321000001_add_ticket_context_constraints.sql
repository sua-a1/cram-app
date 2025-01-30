-- Add unique constraint on ticket_id in ticket_context_embeddings table
ALTER TABLE public.ticket_context_embeddings
ADD CONSTRAINT ticket_context_embeddings_ticket_id_key UNIQUE (ticket_id);

-- Add index on embedding column for similarity search
CREATE INDEX IF NOT EXISTS ticket_context_embeddings_embedding_idx
ON public.ticket_context_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100); 