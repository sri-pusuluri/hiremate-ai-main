-- Allow public job applicants to submit applications and upload resumes
DROP POLICY IF EXISTS "Allow public application submission" ON public.candidates;
CREATE POLICY "Allow public application submission"
  ON public.candidates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure public applicants can upload resumes to the storage bucket
DROP POLICY IF EXISTS "Allow public resume upload" ON storage.objects;
CREATE POLICY "Allow public resume upload"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'resumes');

-- Allow reading resumes for authenticated users and public access
DROP POLICY IF EXISTS "Allow read resumes" ON storage.objects;
CREATE POLICY "Allow read resumes"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'resumes');
