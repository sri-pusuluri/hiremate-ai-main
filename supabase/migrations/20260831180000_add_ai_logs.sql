-- Create AI analysis logs table
CREATE TABLE IF NOT EXISTS public.ai_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    candidate_name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    input_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0.000000,
    output_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0.000000,
    analyzed_prompt TEXT NOT NULL,
    output_received JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.ai_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to simplify testing
CREATE POLICY "Allow public access to AI logs" 
ON public.ai_analysis_logs FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);
