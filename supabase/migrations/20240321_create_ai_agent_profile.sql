-- Create AI agent user and profile
-- First, create the user in auth.users
INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at
)
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    'ai.agent@mywork.support',
    jsonb_build_object('name', 'MyWork AI Assistant'),
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = '00000000-0000-0000-0000-000000000000'::uuid
);

-- Then create the profile
INSERT INTO public.profiles (
    user_id,
    email,
    display_name,
    role,
    org_id,
    department,
    position
)
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    'ai.agent@mywork.support',
    'MyWork AI Assistant',
    'employee',
    (SELECT id FROM public.organizations LIMIT 1),
    'AI Services',
    'Support Assistant'
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
); 