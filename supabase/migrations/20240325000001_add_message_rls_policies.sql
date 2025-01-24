-- Add RLS policies for ticket messages
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view messages if:
-- 1. They are the message author, OR
-- 2. They are part of the organization handling the ticket, OR
-- 3. They are the ticket creator
CREATE POLICY "Users can view messages for their tickets and org tickets"
  ON public.ticket_messages
  FOR SELECT
  USING (
    author_id = auth.uid() OR  -- Message author
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE t.id = ticket_messages.ticket_id
      AND (
        t.handling_org_id = p.org_id OR  -- User is part of handling org
        t.user_id = auth.uid()  -- User is ticket creator
      )
    )
  ); 