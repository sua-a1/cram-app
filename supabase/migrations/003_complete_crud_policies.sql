-- Complete CRUD Policies

-- Profiles: Missing Create/Delete policies
CREATE POLICY "System can create profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);  -- Allow creation during signup

CREATE POLICY "Only admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Tickets: Missing Delete policy
CREATE POLICY "Users can delete their own tickets"
  ON public.tickets FOR DELETE
  USING (
    user_id = auth.uid() AND
    status = 'open' -- Only allow deletion of open tickets
  );

CREATE POLICY "Admins can delete any ticket"
  ON public.tickets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Ticket Messages: Missing Delete policy
CREATE POLICY "Users can delete their own messages"
  ON public.ticket_messages FOR DELETE
  USING (
    author_id = auth.uid() AND
    created_at > now() - interval '1 hour' -- Only allow deletion within 1 hour of creation
  );

CREATE POLICY "Admins can delete any message"
  ON public.ticket_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  ); 