-- Add SELECT policy for employees and admins to view tickets
CREATE POLICY "Employees and admins can view tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = tickets.handling_org_id
      AND profiles.role IN ('admin', 'employee')
    )
  );