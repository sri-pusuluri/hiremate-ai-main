-- Ensure created_by column on jobs and enable reassignment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Backfill legacy jobs where created_by IS NULL to the primary platform or tenant admin
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles WHERE email IN ('admin@hiremate.ai', 'srini@zool.in', 'admin@zool.in') LIMIT 1;
  IF v_admin_id IS NOT NULL THEN
    UPDATE public.jobs SET created_by = v_admin_id WHERE created_by IS NULL;
  END IF;
END $$;

-- Ensure authenticated team members can read profiles so job creator details can be resolved
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
