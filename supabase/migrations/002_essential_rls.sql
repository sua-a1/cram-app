-- Essential RLS Policies for Core Functionality

-- Profiles: Additional policies
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users cannot change their own role"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Teams: Essential policies
CREATE POLICY "Everyone can view teams"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage teams"
  ON public.teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Tickets: Additional policies
CREATE POLICY "Users can update their own tickets"
  ON public.tickets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employees can update assigned tickets"
  ON public.tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('employee', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Employees can create tickets on behalf of users"
  ON public.tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('employee', 'admin')
    )
  );

-- Ticket Messages: Additional policies
CREATE POLICY "Users can create messages on their tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can create messages on any ticket"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.ticket_messages FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Knowledge Base: Basic policies (minimal for MVP)
CREATE POLICY "Anyone can read knowledge articles"
  ON public.knowledge_articles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage knowledge articles"
  ON public.knowledge_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  ); 