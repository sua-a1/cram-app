-- Drop existing organization policies
DROP POLICY IF EXISTS "Organization admins can read their organization" ON public.organizations;

-- Create new policies for organizations

-- Allow customers to view active organizations
CREATE POLICY "Customers can view active organizations"
ON public.organizations
FOR SELECT
USING (
  status = 'active' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'customer'
  )
);

-- Organization members can view their organization
CREATE POLICY "Organization members can view their organization"
ON public.organizations
FOR SELECT
USING (
  id IN (
    SELECT org_id FROM profiles 
    WHERE user_id = auth.uid()
  )
); 