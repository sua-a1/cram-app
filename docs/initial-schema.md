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
  email text NOT NULL UNIQUE REFERENCES auth.users(email) ON UPDATE CASCADE,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'customer', -- 'customer', 'employee', 'admin'
  org_id uuid REFERENCES public.organizations (id), -- Required for employees/admins, NULL for customers
  department text, -- For org employees
  position text,  -- Job title/position
  organization_name text, -- For display purposes
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_org_id_role_validation CHECK (
    (role = 'customer' AND org_id IS NULL) OR  -- Customers never have org_id
    (role IN ('admin', 'employee') AND (org_id IS NULL OR org_id IS NOT NULL))  -- Admins/employees can have org_id null initially
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
  author_role text NOT NULL CHECK (author_role IN ('customer', 'employee', 'admin')),
  author_name text,  -- For external senders (email, API)
  author_email text,  -- For external senders (email, API)
  body text NOT NULL,
  message_type text NOT NULL DEFAULT 'public' CHECK (message_type IN ('public', 'internal')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_email boolean DEFAULT false,  -- Indicates if message was sent/received via email
  metadata jsonb DEFAULT '{}'::jsonb,  -- Additional message metadata (e.g., email headers, attachments)
  template_id uuid REFERENCES public.ticket_message_templates (id),  -- Optional reference to template used
  parent_message_id uuid REFERENCES public.ticket_messages (id),  -- For threaded conversations
  source text NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'email', 'api')),
  external_id text  -- For tracking external message IDs (e.g., email message-id)
);

------------------------------------------------------------------------
-- 6. TICKET MESSAGE TEMPLATES
--    - Reusable templates for common ticket responses
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_message_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  content text NOT NULL,
  category text,  -- Optional category for organization
  is_shared boolean DEFAULT false,  -- Whether template is shared across org
  created_by uuid NOT NULL REFERENCES public.profiles (user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------------------
-- 7. INTERNAL NOTES TABLE
--    - Private notes on tickets visible only to employees/admins
------------------------------------------------------------------------
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

------------------------------------------------------------------------
-- 8. NOTIFICATIONS TABLE
--    - Stores user notifications for ticket updates and messages
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('status_update', 'new_message')),
    message text NOT NULL,
    read boolean DEFAULT false,
    message_id uuid REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT valid_notification_type CHECK (
        (type = 'status_update' AND message_id IS NULL) OR
        (type = 'new_message' AND message_id IS NOT NULL)
    )
);

------------------------------------------------------------------------
-- 9. TICKET FEEDBACK TABLE
--    - Stores customer feedback and ratings after ticket closure
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 0 AND rating <= 5),
    feedback text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT one_feedback_per_ticket UNIQUE (ticket_id)
);

------------------------------------------------------------------------
-- 10. INDEXES
------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_teams_org_id ON public.teams(org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_handling_org_id ON public.tickets(handling_org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_parent_id ON public.ticket_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_template_id ON public.ticket_messages(template_id);
CREATE INDEX IF NOT EXISTS idx_templates_org_id ON public.ticket_message_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_external_id ON public.ticket_messages(external_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_customer_email ON public.ticket_messages(author_email);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_feedback_ticket_id ON public.ticket_feedback(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_feedback_user_id ON public.ticket_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_feedback_rating ON public.ticket_feedback(rating);

------------------------------------------------------------------------
-- 11. TRIGGERS
------------------------------------------------------------------------
-- Auto-update updated_at columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.ticket_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.internal_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-set message author info from profiles
CREATE OR REPLACE FUNCTION public.set_message_author_info()
RETURNS TRIGGER AS $$
BEGIN
  SELECT 
    display_name,
    email,
    role
  INTO 
    NEW.author_name,
    NEW.author_email,
    NEW.author_role
  FROM public.profiles
  WHERE user_id = NEW.author_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_author_info_trigger
  BEFORE INSERT ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_message_author_info();

------------------------------------------------------------------------
-- 12. RLS POLICIES
------------------------------------------------------------------------
-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_feedback ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "profiles_read_policy" ON public.profiles 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      (role = 'customer' AND org_id IS NULL) OR
      (role IN ('admin', 'employee'))
    )
  );

CREATE POLICY "profiles_update_policy" ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    (
      CASE
        WHEN role = 'customer' THEN 
          org_id IS NULL
        WHEN role IN ('admin', 'employee') THEN 
          TRUE
        ELSE FALSE
      END
    )
  );

-- Team Policies
CREATE POLICY "Users can view their organization's teams"
  ON teams FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Ticket Policies
CREATE POLICY "Customers can view their own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'customer'
    )
  );

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

-- Message Policies
CREATE POLICY "Users can read messages for tickets they have access to"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.org_id = tickets.handling_org_id
          AND profiles.role IN ('admin', 'employee')
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
        tickets.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.org_id = tickets.handling_org_id
          AND profiles.role IN ('admin', 'employee')
        )
      )
    )
  );

-- Template Policies
CREATE POLICY "Users can view org templates"
  ON ticket_message_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = ticket_message_templates.org_id
    )
  );

CREATE POLICY "Employees can create templates"
  ON ticket_message_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = ticket_message_templates.org_id
      AND profiles.role IN ('employee', 'admin')
    )
  );

-- Internal Notes Policies
CREATE POLICY "Employees and admins can view internal notes"
  ON internal_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE t.id = internal_notes.ticket_id
      AND t.handling_org_id = p.org_id
      AND p.role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Employees and admins can create internal notes"
  ON internal_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE t.id = internal_notes.ticket_id
      AND t.handling_org_id = p.org_id
      AND p.role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Author or admin can update internal notes"
  ON internal_notes FOR UPDATE
  TO authenticated
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

CREATE POLICY "Author or admin can delete internal notes"
  ON internal_notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE t.id = internal_notes.ticket_id
      AND t.handling_org_id = p.org_id
      AND (p.role = 'admin' OR auth.uid() = internal_notes.author_id)
    )
  );

-- Notification Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update read status of their own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notification Triggers
CREATE OR REPLACE FUNCTION public.handle_ticket_status_update()
RETURNS TRIGGER AS $$
// ... function body as in migration ...
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_ticket_message()
RETURNS TRIGGER AS $$
// ... function body as in migration ...
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_ticket_status_change
    AFTER UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ticket_status_update();

CREATE TRIGGER on_new_ticket_message
    AFTER INSERT ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_ticket_message();

-- Cleanup function for old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
// ... function body as in migration ...
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant access to authenticated users
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.teams TO authenticated;
GRANT ALL ON public.tickets TO authenticated;
GRANT ALL ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_message_templates TO authenticated;
GRANT ALL ON public.internal_notes TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.ticket_feedback TO authenticated;

------------------------------------------------------------------------
-- The above schema covers:
-- 1. Multi-tenant organization support
-- 2. Role-based access control (customers, employees, admins)
-- 3. Team management within organizations
-- 4. Ticket creation and management
-- 5. Message threading and templates
-- 6. Internal notes for employees/admins
-- 7. Email integration support
-- 8. Notification support
-- 9. Ticket feedback support
-- 10. Row Level Security policies
------------------------------------------------------------------------