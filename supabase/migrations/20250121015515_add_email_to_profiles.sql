-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN email TEXT NOT NULL;

-- Add unique constraint on email
ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Add foreign key constraint to auth.users
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_email_fkey 
  FOREIGN KEY (email) 
  REFERENCES auth.users(email) 
  ON UPDATE CASCADE;

-- Update RLS policies for email
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own email or if they are admin/employee
CREATE POLICY "Users can read their own email or if admin/employee"
  ON profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Policy to ensure email matches auth.users on insert
CREATE POLICY "Users can only insert their own email"
  ON profiles
  FOR INSERT
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy to ensure email updates match auth.users
CREATE POLICY "Users can only update their own email"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
