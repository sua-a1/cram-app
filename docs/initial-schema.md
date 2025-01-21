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
  description text,                -- Could store a brief overview of the issue
  status text NOT NULL DEFAULT 'open',   -- e.g., 'open', 'in-progress', 'closed'
  priority text NOT NULL DEFAULT 'medium',  -- e.g., 'low', 'medium', 'high'
  handling_org_id uuid REFERENCES public.organizations (id), -- Organization handling the ticket
  assigned_team uuid REFERENCES public.teams (id),  -- Optional reference to a team
  assigned_employee uuid REFERENCES public.profiles (user_id), -- Optional single assignee
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------------
-- 5. TICKET_MESSAGES / CONVERSATION
--    - Tracks each note, reply, or internal message on a ticket.
--    - Internal vs. public notes can be toggled by a boolean if needed.
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles (user_id),
  message_type text NOT NULL DEFAULT 'public',  -- 'public' or 'internal'
  body text NOT NULL,                           -- The actual message text
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------------
-- 6. (OPTIONAL) KNOWLEDGE BASE TABLE
--    - Minimal MVP placeholder for help articles or FAQ entries.
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  org_id uuid REFERENCES public.organizations (id), -- Organization-specific articles
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------------
-- 7. RLS (Row-Level Security) POLICIES
--    - Organization-aware policies for data access control
------------------------------------------------------------------------

-- Enable RLS on all tables:
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Organization-specific policies are defined in the migrations
-- See: supabase/migrations/20240122000000_add_organizations.sql

------------------------------------------------------------------------
-- The above schema covers:
--   - Organizations and their structure
--   - User profiles & roles with org context
--   - Team assignments within orgs
--   - Tickets with org handling
--   - Ticket messages
--   - Knowledge base with org context
-- Adjust or extend this outline as your MVP evolves.
------------------------------------------------------------------------