-- Add subscription tier to clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Add pipeline stage to candidates
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'applied';

-- Create an index for faster querying by pipeline stage
CREATE INDEX IF NOT EXISTS idx_candidates_pipeline_stage ON public.candidates(pipeline_stage);
