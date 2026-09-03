-- Add status column to jobs table for ATS workflow (active, draft, archived, closed)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
UPDATE public.jobs SET status = 'active' WHERE status IS NULL;
