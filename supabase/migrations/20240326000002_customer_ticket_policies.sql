-- Add indexes for customer ticket performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- Add customer ticket creation policy
CREATE POLICY "Customers can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'customer'
    )
  );

-- Add policy for customers to update their own tickets
CREATE POLICY "Customers can update their own tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'customer'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'customer'
    )
    -- Only allow updating status to 'closed' or keeping it unchanged
    AND (
      tickets.status = 'closed' -- Allow setting to closed
      OR tickets.status = (SELECT status FROM tickets WHERE id = tickets.id) -- Or keep unchanged
    )
    -- These fields must remain unchanged
    AND handling_org_id = (SELECT handling_org_id FROM tickets WHERE id = tickets.id)
    AND assigned_team = (SELECT assigned_team FROM tickets WHERE id = tickets.id)
    AND assigned_employee = (SELECT assigned_employee FROM tickets WHERE id = tickets.id)
    AND priority = (SELECT priority FROM tickets WHERE id = tickets.id)
  ); 
