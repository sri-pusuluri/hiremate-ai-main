import { supabase } from '@/integrations/supabase/client';

/**
 * Normalizes a candidate resume reference into an authenticated, time-limited signed URL.
 * 
 * Prevents unauthorized public enumeration of candidate resumes by enforcing
 * short-lived (default: 15 minutes) cryptographic tokens.
 *
 * @param urlOrPath - Supabase storage relative path or public storage URL
 * @param expiresInSeconds - Expiration duration in seconds (default: 900 = 15 minutes)
 * @returns Resolves to an authenticated signed URL or safe original fallback
 */
export async function getSecureResumeUrl(
  urlOrPath: string | null | undefined,
  expiresInSeconds = 900
): Promise<string> {
  if (!urlOrPath || typeof urlOrPath !== 'string') {
    return '';
  }

  const trimmed = urlOrPath.trim();

  // If already a pre-signed URL with signature query param or blob URL, return as-is
  if (trimmed.startsWith('blob:') || trimmed.includes('token=') || trimmed.includes('Signature=')) {
    return trimmed;
  }

  // Extract relative storage path inside the 'resumes' bucket
  let storagePath = trimmed;

  // Pattern A: Full Supabase Storage URL
  // e.g. https://xyz.supabase.co/storage/v1/object/public/resumes/job-1/resume-123.pdf
  const supabaseStoragePrefix = /\/storage\/v1\/object\/(?:public|authenticated|sign)\/resumes\/(.+)$/i;
  const match = trimmed.match(supabaseStoragePrefix);
  if (match && match[1]) {
    storagePath = decodeURIComponent(match[1]);
  } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it's a generic non-Supabase external URL (e.g., Google Drive, AWS S3 external, CDN)
    return trimmed;
  }

  try {
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, expiresInSeconds);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err) {
    console.warn('[Resume Storage] Could not generate signed URL for path:', storagePath, err);
  }

  // Fallback to original URL/path so user is not blocked
  return trimmed;
}

/**
 * Triggers a secure download of a candidate resume file using an authenticated signed URL.
 */
export async function downloadSecureResume(
  urlOrPath: string,
  candidateName = 'candidate'
): Promise<void> {
  const secureUrl = await getSecureResumeUrl(urlOrPath);
  if (!secureUrl) return;

  const safeName = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const ext = urlOrPath.split('.').pop()?.split('?')[0] || 'pdf';

  const anchor = document.createElement('a');
  anchor.href = secureUrl;
  anchor.download = `${safeName}-resume.${ext}`;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
