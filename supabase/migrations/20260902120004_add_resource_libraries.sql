-- 1. Create Departments Library
CREATE TABLE public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(client_id, name)
);

-- 2. Create Positions Library
CREATE TABLE public.positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(client_id, title)
);

-- 3. Create Question Bank Library
CREATE TABLE public.question_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- e.g., 'text', 'multiple_choice', 'boolean'
  options JSONB DEFAULT '[]'::jsonb, -- For multiple choice
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS and setup multi-tenant isolation
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

-- Departments Policy
CREATE POLICY "Recruiters can manage their client's departments"
  ON public.departments FOR ALL TO authenticated
  USING (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()));

-- Positions Policy
CREATE POLICY "Recruiters can manage their client's positions"
  ON public.positions FOR ALL TO authenticated
  USING (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()));

-- Question Bank Policy
CREATE POLICY "Recruiters can manage their client's question bank"
  ON public.question_bank FOR ALL TO authenticated
  USING (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT client_id FROM public.user_roles WHERE user_id = auth.uid()));

-- 5. Link Jobs to the new Libraries
ALTER TABLE public.jobs
DROP COLUMN IF EXISTS department,
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL;
