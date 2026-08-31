-- Enable vector search extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Jobs Table
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  type TEXT,
  salary TEXT,
  description TEXT NOT NULL,
  responsibilities TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  nice_to_have TEXT[] DEFAULT '{}',
  jd_embedding vector(1536),
  hire_sort_enabled BOOLEAN DEFAULT FALSE,
  ai_processing_status TEXT DEFAULT 'pending',
  last_ranked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Jobs Policies
CREATE POLICY "Allow select on jobs for authenticated users"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert on jobs for authenticated users"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update/delete on jobs for authenticated users"
  ON public.jobs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Candidates Table
CREATE TABLE public.candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  experience INTEGER DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  resume_url TEXT,
  resume_text TEXT,
  resume_embedding vector(1536),
  ai_score TEXT,
  cosine_similarity FLOAT,
  predictive_insights JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on candidates
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Candidates Policies
CREATE POLICY "Allow select on candidates for authenticated users"
  ON public.candidates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert/update/delete on candidates for authenticated users"
  ON public.candidates FOR ALL
  TO authenticated
  USING (true);
