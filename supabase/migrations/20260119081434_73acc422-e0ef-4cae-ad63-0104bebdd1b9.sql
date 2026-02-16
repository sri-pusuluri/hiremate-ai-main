-- Fix 1: Update profiles SELECT policy to restrict access
-- Users can only view their own profile, admins can view all

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 2: Update get_user_role function to add authorization checks
-- Users can only query their own role, admins can query any role

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id OR has_role(auth.uid(), 'admin') THEN
      (SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1)
    ELSE NULL
  END
$$;