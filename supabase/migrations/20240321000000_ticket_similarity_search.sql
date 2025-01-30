-- Create a function to match similar tickets based on context embeddings
CREATE OR REPLACE FUNCTION match_tickets(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  ticket_id uuid,
  similarity float,
  subject text,
  status text,
  priority text,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id as ticket_id,
    1 - (tce.embedding <=> query_embedding) as similarity,
    t.subject,
    t.status,
    t.priority,
    t.created_at
  FROM ticket_context_embeddings tce
  JOIN tickets t ON t.id = tce.ticket_id
  WHERE 1 - (tce.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 