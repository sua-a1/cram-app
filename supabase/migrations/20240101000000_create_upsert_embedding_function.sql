-- Create function to upsert embeddings
CREATE OR REPLACE FUNCTION upsert_embedding(
  p_message_id UUID,
  p_ticket_id UUID,
  p_embedding TEXT,
  p_context_window TEXT
) RETURNS void AS $$
BEGIN
  -- Delete any existing embedding for this message
  DELETE FROM conversation_embeddings
  WHERE message_id = p_message_id;

  -- Insert the new embedding
  INSERT INTO conversation_embeddings (
    message_id,
    ticket_id,
    embedding,
    context_window,
    created_at
  ) VALUES (
    p_message_id,
    p_ticket_id,
    p_embedding,
    p_context_window,
    NOW()
  );
END;
$$ LANGUAGE plpgsql; 