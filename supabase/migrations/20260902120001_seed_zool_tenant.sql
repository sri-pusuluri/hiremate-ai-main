-- 1. Create the default Zool client
INSERT INTO public.clients (id, name, slug, theme_color)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'Zool', 
  'zool',
  '#2563eb'
) ON CONFLICT (slug) DO NOTHING;

-- 2. Assign all existing users to Zool
UPDATE public.user_roles 
SET client_id = '00000000-0000-0000-0000-000000000001'
WHERE client_id IS NULL;

-- 3. Assign all existing jobs to Zool
UPDATE public.jobs 
SET client_id = '00000000-0000-0000-0000-000000000001'
WHERE client_id IS NULL;

-- 4. Assign all existing candidates to Zool
UPDATE public.candidates 
SET client_id = '00000000-0000-0000-0000-000000000001'
WHERE client_id IS NULL;
