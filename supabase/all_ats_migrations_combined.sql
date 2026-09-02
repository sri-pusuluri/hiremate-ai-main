-- =========================================================
-- HIREMATE AI / HIRESORT AI: COMBINED ATS & MULTI-TENANCY MIGRATION
-- Paste and run this script in Supabase Dashboard -> SQL Editor
-- =========================================================

-- 1. CREATE CLIENTS (TENANTS) TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  theme_color TEXT DEFAULT '#2563eb',
  subscription_tier TEXT DEFAULT 'pro',
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ADD MULTI-TENANT CLIENT_ID TO USER_ROLES
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- 3. CREATE RESOURCE LIBRARIES (DEPARTMENTS, POSITIONS, QUESTION BANK)
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(client_id, name)
);

CREATE TABLE IF NOT EXISTS public.positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(client_id, title)
);

CREATE TABLE IF NOT EXISTS public.question_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text',
  options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. UPDATE JOBS TABLE FOR ATS & MULTI-TENANCY
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

-- 5. UPDATE CANDIDATES TABLE FOR ATS & PIPELINE STAGES
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'applied',
ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_candidates_pipeline_stage ON public.candidates(pipeline_stage);

-- 6. CREATE CANDIDATE NOTES TABLE FOR RECRUITER COLLABORATION
CREATE TABLE IF NOT EXISTS public.candidate_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_candidate_notes_candidate_id ON public.candidate_notes(candidate_id);

-- 7. CREATE RESUMES STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;

-- Clients policies
DROP POLICY IF EXISTS "Allow public read on clients" ON public.clients;
CREATE POLICY "Allow public read on clients" ON public.clients FOR SELECT USING (true);

-- Departments policies
DROP POLICY IF EXISTS "Recruiters can manage their client's departments" ON public.departments;
CREATE POLICY "Recruiters can manage their client's departments" ON public.departments FOR ALL TO authenticated
USING (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()))
WITH CHECK (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()));

-- Positions policies
DROP POLICY IF EXISTS "Recruiters can manage their client's positions" ON public.positions;
CREATE POLICY "Recruiters can manage their client's positions" ON public.positions FOR ALL TO authenticated
USING (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()))
WITH CHECK (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()));

-- Question Bank policies
DROP POLICY IF EXISTS "Recruiters can manage their client's question bank" ON public.question_bank;
CREATE POLICY "Recruiters can manage their client's question bank" ON public.question_bank FOR ALL TO authenticated
USING (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()))
WITH CHECK (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()));

-- Candidate Notes policies
DROP POLICY IF EXISTS "Recruiters can manage notes for their candidates" ON public.candidate_notes;
CREATE POLICY "Recruiters can manage notes for their candidates" ON public.candidate_notes FOR ALL TO authenticated
USING (
  candidate_id IN (
    SELECT id FROM public.candidates 
    WHERE client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  candidate_id IN (
    SELECT id FROM public.candidates 
    WHERE client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid())
  )
);

-- Storage bucket policies
DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
CREATE POLICY "Authenticated users can upload resumes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Authenticated users can read resumes" ON storage.objects;
CREATE POLICY "Authenticated users can read resumes" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes');

-- 9. SEED DEFAULT ZOOL TENANT AND MIGRATE EXISTING ORPHAN DATA
INSERT INTO public.clients (id, name, slug, theme_color, subscription_tier)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'Zool', 
  'zool',
  '#2563eb',
  'pro'
) ON CONFLICT (slug) DO UPDATE SET name = 'Zool';

-- Assign existing records without client_id to Zool
UPDATE public.user_roles SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.jobs SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
UPDATE public.candidates SET client_id = '00000000-0000-0000-0000-000000000001' WHERE client_id IS NULL;
