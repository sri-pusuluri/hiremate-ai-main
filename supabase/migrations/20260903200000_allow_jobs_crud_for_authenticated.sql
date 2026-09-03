-- Allow authenticated team members to insert, update, and delete jobs
DROP POLICY IF EXISTS "Allow insert on jobs" ON public.jobs;
CREATE POLICY "Allow insert on jobs"
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete on jobs" ON public.jobs;
CREATE POLICY "Allow delete on jobs"
  ON public.jobs
  FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow update on jobs" ON public.jobs;
CREATE POLICY "Allow update on jobs"
  ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
