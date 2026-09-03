-- Add text department column for public careers queries and embed plugins
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS department TEXT;

UPDATE public.jobs SET department = 'Engineering' WHERE (title ILIKE '%Engineer%' OR title ILIKE '%Developer%') AND department IS NULL;
UPDATE public.jobs SET department = 'Product' WHERE (title ILIKE '%Product%' OR title ILIKE '%UX%' OR title ILIKE '%Design%') AND department IS NULL;
UPDATE public.jobs SET department = 'Marketing' WHERE title ILIKE '%Marketing%' AND department IS NULL;
