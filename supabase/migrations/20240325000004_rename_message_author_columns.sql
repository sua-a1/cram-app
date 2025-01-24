-- Rename customer-specific columns to generic author columns
ALTER TABLE public.ticket_messages
  RENAME COLUMN customer_name TO author_name;

ALTER TABLE public.ticket_messages
  RENAME COLUMN customer_email TO author_email;

-- Update existing messages with author info from profiles
UPDATE public.ticket_messages tm
SET 
  author_name = p.display_name,
  author_email = p.email
FROM public.profiles p
WHERE tm.author_id = p.user_id;

-- Add trigger to automatically set author info from profiles
CREATE OR REPLACE FUNCTION public.set_message_author_info()
RETURNS TRIGGER AS $$
BEGIN
  SELECT 
    display_name,
    email,
    role
  INTO 
    NEW.author_name,
    NEW.author_email,
    NEW.author_role
  FROM public.profiles
  WHERE user_id = NEW.author_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS set_message_author_role_trigger ON public.ticket_messages;

-- Create new trigger for author info
CREATE TRIGGER set_message_author_info_trigger
BEFORE INSERT ON public.ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.set_message_author_info(); 