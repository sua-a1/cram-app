-- Add organization-related fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS organization_name text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')); 