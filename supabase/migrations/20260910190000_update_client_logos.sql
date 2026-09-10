-- Ensure default client logos are cleanly populated and not pointing to dead localhost
UPDATE public.clients
SET logo_url = '/logos/zool-icon.png'
WHERE slug = 'zool' AND (logo_url IS NULL OR logo_url LIKE '%localhost%');

UPDATE public.clients
SET logo_url = '/logos/commit-logo.png'
WHERE slug = 'commit' AND (logo_url IS NULL OR logo_url LIKE '%localhost%');
