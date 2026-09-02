-- 1. Add Stripe Customer ID to Clients for SaaS Billing
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- 2. Add per-job custom questions to Jobs
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

-- 3. Create Candidate Notes Table for internal recruiter collaboration
CREATE TABLE public.candidate_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS and setup multi-tenant isolation for notes
ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can manage notes for their candidates"
  ON public.candidate_notes
  FOR ALL
  TO authenticated
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

-- Index for performance when fetching notes for a specific candidate
CREATE INDEX IF NOT EXISTS idx_candidate_notes_candidate_id ON public.candidate_notes(candidate_id);
