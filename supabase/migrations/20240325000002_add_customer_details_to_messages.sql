-- Add customer details columns to ticket_messages
ALTER TABLE public.ticket_messages
ADD COLUMN customer_name text,
ADD COLUMN customer_email text,
ADD COLUMN source text NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'email', 'api')),
ADD COLUMN external_id text; -- For tracking external message IDs (e.g., email message IDs)

-- Update existing messages with customer details from profiles
UPDATE public.ticket_messages tm
SET 
  customer_name = p.display_name,
  customer_email = p.email
FROM public.profiles p
WHERE tm.author_id = p.user_id
AND tm.author_role = 'customer';

-- Add index for external_id to optimize lookups when integrating with email
CREATE INDEX idx_ticket_messages_external_id ON public.ticket_messages(external_id);

-- Add index for customer_email to optimize customer message history lookups
CREATE INDEX idx_ticket_messages_customer_email ON public.ticket_messages(customer_email); 