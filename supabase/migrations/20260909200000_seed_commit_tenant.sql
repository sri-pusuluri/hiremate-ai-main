-- 1. Create the default Commit client if not already present
INSERT INTO public.clients (id, name, slug, theme_color)
VALUES (
  '00000000-0000-0000-0000-000000000004', 
  'Commit', 
  'commit',
  '#10b981'
) ON CONFLICT (slug) DO UPDATE SET 
  id = '00000000-0000-0000-0000-000000000004',
  name = 'Commit',
  theme_color = '#10b981';

-- 2. Ensure all existing users with comm-it or commit email belong to the Commit tenant
UPDATE public.user_roles ur
SET client_id = '00000000-0000-0000-0000-000000000004'
FROM public.profiles p
WHERE ur.user_id = p.id
  AND (p.email ILIKE '%commit%' OR p.email ILIKE '%comm-it%');
