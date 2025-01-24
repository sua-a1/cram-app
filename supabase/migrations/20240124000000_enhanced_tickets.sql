-- Enhanced Tickets Migration
-- Adds support for message templates, enhanced ticket messages, and bulk operations

-- 1. Create ticket_message_templates table
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

-- 2. Enhance ticket_messages table
ALTER TABLE public.ticket_messages 
    ADD COLUMN IF NOT EXISTS is_email boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.ticket_message_templates (id),
    ADD COLUMN IF NOT EXISTS parent_message_id uuid REFERENCES public.ticket_messages (id);

-- 3. Add RLS policies for ticket_message_templates
ALTER TABLE public.ticket_message_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view org templates" ON public.ticket_message_templates;
DROP POLICY IF EXISTS "Employees can create templates" ON public.ticket_message_templates;
DROP POLICY IF EXISTS "Creator/admin can update templates" ON public.ticket_message_templates;
DROP POLICY IF EXISTS "Creator/admin can delete templates" ON public.ticket_message_templates;

-- Policy: Users can view templates from their organization
CREATE POLICY "Users can view org templates"
    ON public.ticket_message_templates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.org_id = ticket_message_templates.org_id
        )
    );

-- Policy: Only employees/admins can create templates
CREATE POLICY "Employees can create templates"
    ON public.ticket_message_templates
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.org_id = ticket_message_templates.org_id
            AND profiles.role IN ('employee', 'admin')
        )
    );

-- Policy: Only template creator or admins can update templates
CREATE POLICY "Creator/admin can update templates"
    ON public.ticket_message_templates
    FOR UPDATE
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Only template creator or admins can delete templates
CREATE POLICY "Creator/admin can delete templates"
    ON public.ticket_message_templates
    FOR DELETE
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.org_id = ticket_message_templates.org_id
            AND profiles.role = 'admin'
        )
    );

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_messages_parent_id ON public.ticket_messages (parent_message_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_template_id ON public.ticket_messages (template_id);
CREATE INDEX IF NOT EXISTS idx_templates_org_id ON public.ticket_message_templates (org_id);

-- 5. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ticket_message_templates_updated_at ON public.ticket_message_templates;
CREATE TRIGGER update_ticket_message_templates_updated_at
    BEFORE UPDATE ON public.ticket_message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Add RLS policy for bulk operations on tickets
DROP POLICY IF EXISTS "Admins and employees can update tickets" ON public.tickets;

CREATE POLICY "Admins and employees can update tickets"
    ON public.tickets FOR UPDATE
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