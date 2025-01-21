-- Drop existing policies
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_org_id_role_validation;

-- Add constraint for org_id based on role
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_org_id_role_validation
CHECK (
  (role = 'customer' AND org_id IS NULL) OR
  (role IN ('admin', 'employee'))
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a single policy for all operations
CREATE POLICY "profiles_user_access" ON public.profiles
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated; 