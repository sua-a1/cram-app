-- Create internal notes table
CREATE TABLE IF NOT EXISTS public.internal_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles (user_id),
  author_name text NOT NULL,
  author_email text NOT NULL,
  author_role text NOT NULL CHECK (author_role IN ('employee', 'admin')),
  content text NOT NULL,
  related_ticket_message_id uuid REFERENCES public.ticket_messages (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add RLS policies for internal notes
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;

-- Only employees and admins of the organization can view internal notes
CREATE POLICY "Employees and admins can view internal notes" ON internal_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE t.id = internal_notes.ticket_id
      AND t.handling_org_id = p.org_id
      AND p.role IN ('employee', 'admin')
    )
  );

-- Only employees and admins of the organization can create internal notes
CREATE POLICY "Employees and admins can create internal notes" ON internal_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE t.id = internal_notes.ticket_id
      AND t.handling_org_id = p.org_id
      AND p.role IN ('employee', 'admin')
    )
  );

-- Only the author or admin can update internal notes
CREATE POLICY "Author or admin can update internal notes" ON internal_notes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE t.id = internal_notes.ticket_id
      AND t.handling_org_id = p.org_id
      AND (p.role = 'admin' OR auth.uid() = internal_notes.author_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE t.id = internal_notes.ticket_id
      AND t.handling_org_id = p.org_id
      AND (p.role = 'admin' OR auth.uid() = internal_notes.author_id)
    )
  );

-- Only the author or admin can delete internal notes
CREATE POLICY "Author or admin can delete internal notes" ON internal_notes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE t.id = internal_notes.ticket_id
      AND t.handling_org_id = p.org_id
      AND (p.role = 'admin' OR auth.uid() = internal_notes.author_id)
    )
  ); 
