-- Add experience_level column to public.jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT '3-5 Years';
