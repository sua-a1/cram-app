-- Drop ALL existing profiles policies to start fresh
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Employees can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Disable RLS temporarily to avoid any issues during policy changes
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_org_id_required;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_org_id_role_validation;

-- Add new constraint that allows org_id to be NULL initially
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_org_id_role_validation CHECK (
  (role = 'customer' AND org_id IS NULL) OR  -- Customers never have org_id
  (role IN ('admin', 'employee') AND (org_id IS NULL OR org_id IS NOT NULL))  -- Admins/employees can have org_id null initially
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new, non-recursive policies
CREATE POLICY "profiles_read_policy" ON public.profiles 
  FOR SELECT TO authenticated 
  USING (true);  -- All authenticated users can read profiles

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND  -- Can only insert their own profile
    (
      (role = 'customer' AND org_id IS NULL) OR  -- Customers can't have org_id
      (role IN ('admin', 'employee'))  -- Admins/employees can have org_id null initially
    )
  );

CREATE POLICY "profiles_update_policy" ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)  -- Can only update their own profile
  WITH CHECK (
    auth.uid() = user_id AND  -- Can only update their own profile
    (
      CASE
        -- Customers can't have org_id
        WHEN role = 'customer' THEN 
          org_id IS NULL
        -- Admins/employees can update org_id
        WHEN role IN ('admin', 'employee') THEN 
          TRUE
        ELSE FALSE
      END
    )
  );

CREATE POLICY "profiles_delete_policy" ON public.profiles 
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);  -- Can only delete their own profile

-- Grant access
GRANT ALL ON public.profiles TO authenticated; 