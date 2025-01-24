-- Initial Supabase Schema for Cram
-- Based on @prd.md, @App Description.md, and @roadmap-overview.md

-- NOTE: This schema assumes you are using Supabase Auth for user authentication.
-- Each user will have a record in auth.users. We'll store additional profile
-- information in the "profiles" table and reference auth.users by user_id.

------------------------------------------------------------------------
-- 1. ORGANIZATIONS TABLE
--    - Stores organization information for employee/admin accounts
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  domain text,  -- Optional: for email domain validation
  status text NOT NULL DEFAULT 'active',  -- 'active', 'inactive', 'pending'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------------
-- 2. PROFILES TABLE
--    - Stores role-based info for employees, admins, or customers.
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'customer', -- 'customer', 'employee', 'admin'
  org_id uuid REFERENCES public.organizations (id), -- Required for employees/admins, NULL for customers
  department text, -- For org employees
  position text,  -- Job title/position
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_org_id_required CHECK (
    (role = 'customer' AND org_id IS NULL) OR  -- Customers must not have org_id
    ((role = 'admin' OR role = 'employee') AND org_id IS NOT NULL)  -- Employees/admins must have org_id
  )
);

-- We can expand 'profiles' to reference a team if needed (for employees):
-- ALTER TABLE public.profiles ADD COLUMN team_id uuid REFERENCES public.teams (id);

------------------------------------------------------------------------
-- 3. TEAMS TABLE
--    - Manages team groupings within organizations
--      (E.g., "Billing", "Support", "Sales", etc.)
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  org_id uuid NOT NULL REFERENCES public.organizations (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------------
-- 4. TICKETS TABLE
--    - Core record for customer support tickets.
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',   -- 'open', 'in-progress', 'closed'
  priority text NOT NULL DEFAULT 'medium',  -- 'low', 'medium', 'high'
  handling_org_id uuid REFERENCES public.organizations (id),
  assigned_team uuid REFERENCES public.teams (id),
  assigned_employee uuid REFERENCES public.profiles (user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('open', 'in-progress', 'closed')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high'))
);

------------------------------------------------------------------------
-- 5. TICKET_MESSAGES TABLE
--    - Tracks each note, reply, or internal message on a ticket.
--    - Includes support for email messages, templates, and message threading
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles (user_id),
  author_role text NOT NULL,  -- 'customer', 'employee', 'admin'
  author_name text,  -- For external senders (email, API)
  author_email text,  -- For external senders (email, API)
  body text NOT NULL,
  message_type text NOT NULL DEFAULT 'public',  -- 'public' or 'internal'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_email boolean DEFAULT false,  -- Indicates if message was sent/received via email
  metadata jsonb,  -- Additional message metadata (e.g., email headers, attachments)
  template_id uuid REFERENCES public.ticket_message_templates (id),  -- Optional reference to template used
  parent_message_id uuid REFERENCES public.ticket_messages (id),  -- For threaded conversations
  source text NOT NULL DEFAULT 'web',  -- 'web', 'email', 'api'
  external_id text,  -- For tracking external message IDs (e.g., email message-id)
  CONSTRAINT valid_message_type CHECK (message_type IN ('public', 'internal')),
  CONSTRAINT valid_author_role CHECK (author_role IN ('customer', 'employee', 'admin')),
  CONSTRAINT valid_source CHECK (source IN ('web', 'email', 'api'))
);

------------------------------------------------------------------------
-- 6. TICKET MESSAGE TEMPLATES
--    - Reusable templates for common ticket responses
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_message_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations (id),
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------------
-- 7. RLS (Row-Level Security) POLICIES
--    - Organization-aware policies for data access control
------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_message_templates ENABLE ROW LEVEL SECURITY;

-- Organization Policies
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = organizations.id
    )
  );

-- Profile Policies
CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Team Policies
CREATE POLICY "Users can view teams in their organization"
  ON teams FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Ticket Policies
CREATE POLICY "Users can view tickets in their organization"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    handling_org_id IN (
      SELECT org_id FROM profiles WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Admins and employees can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = tickets.handling_org_id
      AND profiles.role IN ('admin', 'employee')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = tickets.handling_org_id
      AND profiles.role IN ('admin', 'employee')
    )
  );

-- Message Template Policies
CREATE POLICY "Users can view org templates"
  ON ticket_message_templates FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can create templates"
  ON ticket_message_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = ticket_message_templates.org_id
      AND profiles.role IN ('admin', 'employee')
    )
  );

CREATE POLICY "Creator/admin can update templates"
  ON ticket_message_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = ticket_message_templates.org_id
      AND (profiles.role = 'admin' OR profiles.user_id = ticket_message_templates.created_by)
    )
  );

CREATE POLICY "Creator/admin can delete templates"
  ON ticket_message_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = ticket_message_templates.org_id
      AND (profiles.role = 'admin' OR profiles.user_id = ticket_message_templates.created_by)
    )
  );

------------------------------------------------------------------------
-- The above schema covers:
--   - Organizations and their structure
--   - User profiles & roles with org context
--   - Team assignments within orgs
--   - Enhanced tickets with status and priority constraints
--   - Ticket messages with type constraints
--   - Message templates with org context
--   - Comprehensive RLS policies for data access control
------------------------------------------------------------------------