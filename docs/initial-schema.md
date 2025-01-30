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

## Knowledge Documents

### Knowledge Documents
```sql
CREATE TABLE public.knowledge_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  file_url text,
  file_type text,
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  metadata jsonb DEFAULT '{}'::jsonb
);
```

### Knowledge Categories
```sql
CREATE TABLE public.knowledge_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Knowledge Document Categories (Junction Table)
```sql
CREATE TABLE public.knowledge_document_categories (
  document_id uuid REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.knowledge_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, category_id)
);
```

## Storage Buckets and Policies

### Knowledge Documents Bucket
```sql
-- Create bucket for knowledge documents
INSERT INTO storage.buckets (id, name)
VALUES ('knowledge-documents', 'Knowledge Documents');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'knowledge-documents');

-- Allow public read access
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'knowledge-documents');
```

## Row Level Security (RLS) Policies

### Knowledge Documents
```sql
-- Admins have full access to their organization's documents
CREATE POLICY "Admins have full access to org documents"
  ON public.knowledge_documents
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = knowledge_documents.org_id
      AND profiles.role = 'admin'
    )
  );

-- Employees can view all documents in their organization
CREATE POLICY "Employees can view org documents"
  ON public.knowledge_documents
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = knowledge_documents.org_id
      AND profiles.role = 'employee'
    )
  );

-- Customers can only view public published documents
CREATE POLICY "Customers can view public published documents"
  ON public.knowledge_documents
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    is_public = true
    AND status = 'published'
  );
```

### Knowledge Categories
```sql
-- Admins have full access to their organization's categories
CREATE POLICY "Admins have full access to org categories"
  ON public.knowledge_categories
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = knowledge_categories.org_id
      AND profiles.role = 'admin'
    )
  );

-- Employees can view categories in their organization
CREATE POLICY "Employees can view org categories"
  ON public.knowledge_categories
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.org_id = knowledge_categories.org_id
      AND profiles.role = 'employee'
    )
  );
```

### Knowledge Document Categories
```sql
-- Admins have full access to document-category relationships
CREATE POLICY "Admins have full access to document categories"
  ON public.knowledge_document_categories
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.knowledge_documents d ON d.org_id = p.org_id
      WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
      AND d.id = knowledge_document_categories.document_id
    )
  );

-- Employees and customers can view document-category relationships
CREATE POLICY "Users can view document categories"
  ON public.knowledge_document_categories
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_documents d
      WHERE d.id = knowledge_document_categories.document_id
      AND (
        -- For public published documents
        (d.is_public = true AND d.status = 'published')
        OR
        -- For org members
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid()
          AND p.org_id = d.org_id
          AND p.role IN ('admin', 'employee')
        )
      )
    )
  );
```

## AI Agent & Embeddings

### Document Embeddings
```sql
CREATE TABLE public.document_embeddings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id uuid REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    embedding vector(1536),  -- For OpenAI embeddings
    chunk_index integer,
    chunk_text text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX ON public.document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.document_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
```

### Conversation Embeddings
```sql
CREATE TABLE public.conversation_embeddings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
    message_id uuid REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
    embedding vector(1536),
    context_window text,    -- The actual text that was embedded
    created_at timestamptz DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX ON public.conversation_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.conversation_embeddings ENABLE ROW LEVEL SECURITY;
```

### Ticket Context Embeddings
```sql
CREATE TABLE public.ticket_context_embeddings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ticket_context_embeddings_ticket_id_key UNIQUE (ticket_id)
);

-- Add index for similarity search
CREATE INDEX IF NOT EXISTS ticket_context_embeddings_embedding_idx
ON public.ticket_context_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.ticket_context_embeddings ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.ticket_context_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to match similar tickets based on context embeddings
CREATE OR REPLACE FUNCTION match_tickets(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    ticket_id uuid,
    similarity float,
    subject text,
    status text,
    priority text,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id as ticket_id,
        1 - (tce.embedding <=> query_embedding) as similarity,
        t.subject,
        t.status,
        t.priority,
        t.created_at
    FROM ticket_context_embeddings tce
    JOIN tickets t ON t.id = tce.ticket_id
    WHERE 1 - (tce.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- RLS Policies for ticket context embeddings
CREATE POLICY "Users can view embeddings for tickets they have access to"
    ON public.ticket_context_embeddings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (
                t.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.user_id = auth.uid()
                    AND p.org_id = t.handling_org_id
                    AND p.role IN ('admin', 'employee')
                )
            )
        )
    );

CREATE POLICY "Employees and admins can create/update embeddings"
    ON public.ticket_context_embeddings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            JOIN profiles p ON p.org_id = t.handling_org_id
            WHERE t.id = ticket_id
            AND p.user_id = auth.uid()
            AND p.role IN ('admin', 'employee')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tickets t
            JOIN profiles p ON p.org_id = t.handling_org_id
            WHERE t.id = ticket_id
            AND p.user_id = auth.uid()
            AND p.role IN ('admin', 'employee')
        )
    );

-- Grant access to authenticated users
GRANT ALL ON public.ticket_context_embeddings TO authenticated;
GRANT ALL ON FUNCTION match_tickets TO authenticated;
```

### Notes on Embedding Tables
- All vector columns use dimension 1536 for OpenAI embeddings
- IVFFlat indexes are used for efficient similarity search
- RLS policies ensure proper access control
- Automatic timestamp management for tracking changes
- Cascading deletes ensure referential integrity

------------------------------------------------------------------------
-- 12. CONVERSATION EMBEDDINGS
------------------------------------------------------------------------
-- Function to atomically upsert conversation embeddings
CREATE OR REPLACE FUNCTION public.upsert_embedding(
  p_message_id UUID,
  p_ticket_id UUID,
  p_embedding TEXT,
  p_context_window TEXT
) RETURNS void AS $$
BEGIN
  -- Delete any existing embedding for this message
  DELETE FROM conversation_embeddings
  WHERE message_id = p_message_id;

  -- Insert the new embedding
  INSERT INTO conversation_embeddings (
    message_id,
    ticket_id,
    embedding,
    context_window,
    created_at
  ) VALUES (
    p_message_id,
    p_ticket_id,
    p_embedding::vector,  -- Cast the text to vector type
    p_context_window,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Create conversation_embeddings table
CREATE TABLE IF NOT EXISTS public.conversation_embeddings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.ticket_messages (id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  embedding vector NOT NULL,  -- Using vector type for embeddings
  context_window TEXT NOT NULL,  -- The text used to generate the embedding
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for conversation embeddings
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_message_id ON public.conversation_embeddings(message_id);
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_ticket_id ON public.conversation_embeddings(ticket_id);