-- Add organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  domain text,  -- Optional: for email domain validation
  status text NOT NULL DEFAULT 'active',  -- 'active', 'inactive', 'pending'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add org_id to profiles with check constraint
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS department text,  -- For org employees
ADD COLUMN IF NOT EXISTS position text,    -- Job title/position
ADD CONSTRAINT profiles_org_id_required CHECK (
  (role = 'customer' AND org_id IS NULL) OR  -- Customers must not have org_id
  ((role = 'admin' OR role = 'employee') AND org_id IS NOT NULL)  -- Employees/admins must have org_id
);

-- Add org_id to teams (teams belong to organizations)
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- Add org_id to tickets (for tracking which org's employee is handling the ticket)
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS handling_org_id uuid REFERENCES public.organizations(id);

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations

-- Organization admins can read their organization
CREATE POLICY "Organization admins can read their organization" ON public.organizations
FOR SELECT USING (
  id IN (
    SELECT org_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Organization admins can update their organization
CREATE POLICY "Organization admins can update their organization" ON public.organizations
FOR UPDATE USING (
  id IN (
    SELECT org_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Update profiles policies for organization context
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can read profiles in their organization
CREATE POLICY "Users can read profiles in their organization" ON public.profiles
FOR SELECT USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE user_id = auth.uid()
  )
  OR role = 'customer'  -- Customers are visible to all
);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid());

-- Update teams policies for organization context
CREATE POLICY "Users can view their organization's teams" ON public.teams
FOR SELECT USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Only admins can manage teams
CREATE POLICY "Admins can manage teams" ON public.teams
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND profiles.org_id = teams.org_id
  )
);

-- Update tickets policies for organization context
CREATE POLICY "Organization employees can view assigned tickets" ON public.tickets
FOR SELECT USING (
  handling_org_id IN (
    SELECT org_id FROM profiles 
    WHERE user_id = auth.uid()
  )
  OR user_id = auth.uid()  -- Customers can see their own tickets
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_teams_org_id ON public.teams(org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_handling_org_id ON public.tickets(handling_org_id); 