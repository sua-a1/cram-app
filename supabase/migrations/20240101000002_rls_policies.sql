-- Enable RLS on tables
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets table
CREATE POLICY "Admins and employees can read all tickets"
ON tickets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'employee')
  )
  OR customer_id = auth.uid()
);

CREATE POLICY "Users can create their own tickets"
ON tickets FOR INSERT
TO authenticated
WITH CHECK (
  customer_id = auth.uid()
);

CREATE POLICY "Admins and employees can update tickets"
ON tickets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'employee')
  )
);

CREATE POLICY "Only admins can delete tickets"
ON tickets FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create policies for ticket_messages table
CREATE POLICY "Users can read messages for tickets they have access to"
ON ticket_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_messages.ticket_id
    AND (
      -- Customer can read their own ticket messages
      tickets.customer_id = auth.uid()
      OR
      -- Admins and employees can read all ticket messages
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'employee')
      )
    )
  )
);

CREATE POLICY "Users can create messages for tickets they have access to"
ON ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_messages.ticket_id
    AND (
      -- Customer can create messages on their own tickets
      tickets.customer_id = auth.uid()
      OR
      -- Admins and employees can create messages on all tickets
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'employee')
      )
    )
  )
);

CREATE POLICY "Only admins can update messages"
ON ticket_messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Only admins can delete messages"
ON ticket_messages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
); 