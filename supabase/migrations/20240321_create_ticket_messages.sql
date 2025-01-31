-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('assistant', 'user', 'system')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at);

-- Add RLS policies
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own ticket messages
CREATE POLICY "Users can view their own ticket messages"
    ON public.ticket_messages
    FOR SELECT
    USING (
        ticket_id IN (
            SELECT id FROM public.tickets
            WHERE user_id = auth.uid()
        )
    );

-- Allow organization members to view ticket messages for their org's tickets
CREATE POLICY "Organization members can view their org's ticket messages"
    ON public.ticket_messages
    FOR SELECT
    USING (
        ticket_id IN (
            SELECT id FROM public.tickets
            WHERE handling_org_id IN (
                SELECT org_id FROM public.profiles
                WHERE user_id = auth.uid()
            )
        )
    );

-- Allow the system to insert messages
CREATE POLICY "System can insert messages"
    ON public.ticket_messages
    FOR INSERT
    WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ticket_messages_updated_at
    BEFORE UPDATE ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 