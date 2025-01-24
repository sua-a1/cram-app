-- Update the test message with customer details
UPDATE public.ticket_messages
SET 
  customer_name = 'John Doe',
  customer_email = 'john.doe@example.com',
  source = 'web'
WHERE ticket_id = 'e221e643-11cd-4b21-9ec0-296865f1458b'
AND author_id = '5281f8db-7dd3-488d-9fa4-2dc1e098ee36'; 