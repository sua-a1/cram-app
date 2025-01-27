-- Create ticket feedback table
CREATE TABLE IF NOT EXISTS public.ticket_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(ticket_id) -- Ensure one feedback per ticket
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ticket_feedback_ticket_id ON public.ticket_feedback(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_feedback_user_id ON public.ticket_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_feedback_rating ON public.ticket_feedback(rating);

-- Enable RLS
ALTER TABLE public.ticket_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Allow customers to view their own feedback
CREATE POLICY "Customers can view their own feedback"
    ON public.ticket_feedback
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
    );

-- Allow employees to view feedback for their organization's tickets
CREATE POLICY "Employees can view feedback for their org's tickets"
    ON public.ticket_feedback
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            JOIN public.organizations o ON t.handling_org_id = o.id
            JOIN public.profiles p ON o.id = p.org_id
            WHERE t.id = ticket_feedback.ticket_id
            AND p.user_id = auth.uid()
            AND p.role IN ('employee', 'admin')
        )
    );

-- Allow customers to create feedback for their closed tickets
CREATE POLICY "Customers can create feedback for their closed tickets"
    ON public.ticket_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_id
            AND t.user_id = auth.uid()
            AND t.status = 'closed'
        )
    );

-- Allow customers to update their own feedback
CREATE POLICY "Customers can update their own feedback"
    ON public.ticket_feedback
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.ticket_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 