-- Add author_role column to ticket_messages
ALTER TABLE public.ticket_messages
ADD COLUMN author_role text NOT NULL DEFAULT 'customer'
CHECK (author_role IN ('customer', 'employee', 'admin'));

-- Update existing messages with author roles from profiles
UPDATE public.ticket_messages tm
SET author_role = p.role
FROM public.profiles p
WHERE tm.author_id = p.user_id;

-- Add trigger to automatically set author_role from profiles
CREATE OR REPLACE FUNCTION public.set_message_author_role()
RETURNS TRIGGER AS $$
BEGIN
  SELECT role INTO NEW.author_role
  FROM public.profiles
  WHERE user_id = NEW.author_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_author_role_trigger
BEFORE INSERT ON public.ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.set_message_author_role(); 