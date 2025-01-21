-- Team Assignment Policies
CREATE POLICY "Employees can view their team assignments"
ON public.team_members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage team assignments"
ON public.team_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Knowledge Base Article Policies
CREATE POLICY "Anyone can read published knowledge articles"
ON public.knowledge_articles FOR SELECT
USING (status = 'published');

CREATE POLICY "Employees and admins can read all knowledge articles"
ON public.knowledge_articles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'employee')
  )
);

CREATE POLICY "Only admins can manage knowledge articles"
ON public.knowledge_articles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update knowledge articles"
ON public.knowledge_articles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete knowledge articles"
ON public.knowledge_articles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
); 