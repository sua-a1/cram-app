-- Initial Supabase Schema for Cram
-- Based on @prd.md, @App Description.md, and @roadmap-overview.md

-- NOTE: This schema assumes you are using Supabase Auth for user authentication.
-- Each user will have a record in auth.users. We'll store additional profile
-- information in the "profiles" table and reference auth.users by user_id.

------------------------------------------------------------------------
-- 1. PROFILES TABLE
--    - Stores role-based info for employees, admins, or customers.
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'customer', -- 'customer', 'employee', 'admin'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- We can expand 'profiles' to reference a team if needed (for employees):
-- ALTER TABLE public.profiles ADD COLUMN team_id uuid REFERENCES public.teams (id);

------------------------------------------------------------------------
-- 2. TEAMS TABLE
--    - Manages team groupings, used primarily for employees.
--      (E.g., "Billing", "Support", "Sales", etc.)
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------------
-- 3. TICKETS TABLE
--    - Core record for customer support tickets.
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,                -- Could store a brief overview of the issue
  status text NOT NULL DEFAULT 'open',   -- e.g., 'open', 'in-progress', 'closed'
  priority text NOT NULL DEFAULT 'medium',  -- e.g., 'low', 'medium', 'high'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  assigned_team uuid REFERENCES public.teams (id),  -- Optional reference to a team
  assigned_employee uuid REFERENCES public.profiles (user_id) -- Optional single assignee
);

------------------------------------------------------------------------
-- 4. TICKET_MESSAGES / CONVERSATION
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
-- 5. (OPTIONAL) KNOWLEDGE BASE TABLE
--    - Minimal MVP placeholder for help articles or FAQ entries.
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------------
-- 6. RLS (Row-Level Security) POLICIES (Minimal Illustrations)
--    - Enforce so customers see only their tickets, employees see assigned/team tickets,
--      admins see all. This is a simplified example; refine as needed.
------------------------------------------------------------------------

-- Enable RLS on relevant tables:
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Example RLS for tickets (customize to your needs):
-- CREATE POLICY "Allow ticket owner read" ON public.tickets
--   FOR SELECT USING (user_id = auth.uid());
-- CREATE POLICY "Allow ticket owner write" ON public.tickets
--   FOR UPDATE USING (user_id = auth.uid());
-- CREATE POLICY "Allow admin read all" ON public.tickets
--   FOR SELECT TO role_admin USING (true);
-- CREATE POLICY "Allow admin write all" ON public.tickets
--   FOR UPDATE TO role_admin USING (true);

-- You would create similar policies for ticket_messages, ensuring that both
-- the author of a message or an admin can select/update, etc.

------------------------------------------------------------------------
-- The above schema covers:
--   - User profiles & roles
--   - Team assignments
--   - Tickets (basic fields, with optional team + employee assignments)
--   - Ticket messages for conversation history
--   - (Optional) Knowledge base content
-- Adjust or extend this outline as your MVP evolves.
------------------------------------------------------------------------