-- Ensure Zool uses the official proper full logo instead of icon
UPDATE public.clients
SET logo_url = '/logos/zool-logo-dark.png'
WHERE slug = 'zool';
