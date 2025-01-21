-- First, disable RLS on all tables temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies from ALL tables
DO $$ 
DECLARE 
    _tbl text;
    _pol text;
BEGIN 
    FOR _tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        FOR _pol IN 
            SELECT policyname FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = _tbl
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', _pol, 'public', _tbl);
        END LOOP;
    END LOOP;
END $$;

-- Create new, non-recursive policies for profiles
CREATE POLICY "profiles_read_policy"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_policy"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create new policies for tickets using auth.uid() directly
CREATE POLICY "tickets_read_policy"
ON public.tickets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "tickets_insert_policy"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "tickets_update_policy"
ON public.tickets FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Create new policies for ticket messages - using author_id instead of joins
CREATE POLICY "messages_read_policy"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "messages_insert_policy"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- Create basic policies for teams and knowledge articles
CREATE POLICY "teams_read_policy"
ON public.teams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "knowledge_read_policy"
ON public.knowledge_articles FOR SELECT
TO authenticated
USING (true);

-- Re-enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;
GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.knowledge_articles TO authenticated;

-- Verify no recursive policies exist
DO $$ 
BEGIN 
    ASSERT NOT EXISTS (
        SELECT 1 FROM pg_policy p
        JOIN pg_class c ON p.polrelid = c.oid
        WHERE c.relnamespace = 'public'::regnamespace
        AND pg_get_expr(p.polqual, p.polrelid) LIKE '%profiles%role%'
    ), 'Found potentially recursive policy';
END $$;

