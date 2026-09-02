-- 1. Create Clients Table
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  theme_color TEXT DEFAULT '#2563eb',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add client_id to user_roles
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- 3. Add ATS Module & client_id to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 4. Add ATS Module & client_id to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}'::jsonb;

-- Create resumes storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Authenticated users can upload resumes"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can read resumes"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes');

-- 5. RLS Policies for Multi-Tenancy

-- Clients Table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on clients"
  ON public.clients FOR SELECT
  USING (true);

-- Drop old permissive policies for jobs and candidates
DROP POLICY IF EXISTS "Allow select on jobs for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Allow insert on jobs for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Allow update/delete on jobs for authenticated users" ON public.jobs;

DROP POLICY IF EXISTS "Allow select on candidates for authenticated users" ON public.candidates;
DROP POLICY IF EXISTS "Allow insert/update/delete on candidates for authenticated users" ON public.candidates;

-- New strict Multi-Tenant Policies for Jobs
CREATE POLICY "Recruiters can manage their client's jobs"
  ON public.jobs
  FOR ALL
  TO authenticated
  USING (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Allow public read on public jobs"
  ON public.jobs
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- New strict Multi-Tenant Policies for Candidates
CREATE POLICY "Recruiters can manage their client's candidates"
  ON public.candidates
  FOR ALL
  TO authenticated
  USING (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()));

