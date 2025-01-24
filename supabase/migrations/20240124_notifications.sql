-- Create notifications table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update read status of their own notifications" ON public.notifications;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update read status of their own notifications"
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        -- Only allow updating the read status
        auth.uid() = user_id
    );

-- Grant necessary permissions
GRANT SELECT, UPDATE(read) ON public.notifications TO authenticated;
GRANT SELECT, UPDATE ON public.tickets TO authenticated;
GRANT SELECT ON public.ticket_messages TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Function to create status update notification
CREATE OR REPLACE FUNCTION public.handle_ticket_status_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _old_status text;
    _new_status text;
    _ticket_owner_id uuid;
    _current_user_id uuid;
    _affected_rows integer;
BEGIN
    -- Get current user ID
    _current_user_id := auth.uid();
    RAISE NOTICE 'Current user ID: %', _current_user_id;
    
    -- Get ticket owner ID
    SELECT user_id INTO _ticket_owner_id
    FROM tickets
    WHERE id = NEW.id;
    RAISE NOTICE 'Ticket owner ID: %', _ticket_owner_id;
    
    _old_status := OLD.status;
    _new_status := NEW.status;
    
    -- Debug logs
    RAISE NOTICE 'Trigger fired for ticket: %', NEW.id;
    RAISE NOTICE 'Status change: % -> %', _old_status, _new_status;
    
    -- Only proceed if status has actually changed
    IF _old_status IS DISTINCT FROM _new_status THEN
        RAISE NOTICE 'Valid status change detected, creating notification';
        
        -- Insert notification for all status changes
        INSERT INTO notifications (
            user_id,
            ticket_id,
            type,
            message,
            metadata
        ) VALUES (
            _ticket_owner_id,
            NEW.id,
            'status_update',
            CASE 
                WHEN _new_status = 'in-progress' THEN 'Your ticket is now being processed'
                WHEN _new_status = 'closed' THEN 'Your ticket has been resolved'
                ELSE 'Your ticket status has been updated to ' || _new_status
            END,
            jsonb_build_object(
                'old_status', _old_status,
                'new_status', _new_status,
                'updated_by', _current_user_id
            )
        );
        
        GET DIAGNOSTICS _affected_rows := ROW_COUNT;
        RAISE NOTICE 'Notifications inserted: %', _affected_rows;
    ELSE
        RAISE NOTICE 'No status change detected';
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in trigger: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Function to create new message notification
CREATE OR REPLACE FUNCTION public.handle_new_ticket_message()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert notification for the ticket owner if they're a customer
    INSERT INTO notifications (
        user_id,
        ticket_id,
        type,
        message,
        message_id,
        metadata
    )
    SELECT 
        t.user_id,
        NEW.ticket_id,
        'new_message',
        CASE 
            WHEN p_author.role = 'employee' THEN 'Support staff replied to your ticket'
            WHEN p_author.role = 'admin' THEN 'Support staff replied to your ticket'
            ELSE 'New message in your ticket'
        END,
        NEW.id,
        jsonb_build_object(
            'author_id', NEW.author_id,
            'author_role', NEW.author_role,
            'author_name', p_author.display_name,
            'message_preview', substring(NEW.body from 1 for 100)
        )
    FROM tickets t
    JOIN profiles p ON p.user_id = t.user_id
    JOIN profiles p_author ON p_author.user_id = NEW.author_id
    WHERE t.id = NEW.ticket_id
    AND p.role = 'customer'  -- Only notify customers
    AND NEW.author_id != t.user_id  -- Don't notify if the message is from the ticket owner
    AND NEW.message_type = 'public';  -- Only notify for public messages
    
    RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_ticket_status_change ON public.tickets;
DROP TRIGGER IF EXISTS on_new_ticket_message ON public.ticket_messages;

-- Create trigger for ticket status changes
CREATE TRIGGER on_ticket_status_change
    AFTER UPDATE OF status
    ON public.tickets
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.handle_ticket_status_update();

-- Create trigger for new messages
CREATE TRIGGER on_new_ticket_message
    AFTER INSERT ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_ticket_message();

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete read notifications older than 30 days
    DELETE FROM notifications
    WHERE read = true
    AND created_at < now() - INTERVAL '30 days';
    
    -- Delete unread notifications older than 90 days
    DELETE FROM notifications
    WHERE read = false
    AND created_at < now() - INTERVAL '90 days';
END;
$$;

-- Create a scheduled job to clean up old notifications (if pg_cron is available)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        SELECT cron.schedule(
            'cleanup-old-notifications',
            '0 0 * * *', -- Run daily at midnight
            'SELECT public.cleanup_old_notifications()'
        );
    END IF;
END $$; 