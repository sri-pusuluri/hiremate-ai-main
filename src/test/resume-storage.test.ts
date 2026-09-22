import { describe, it, expect, vi } from 'vitest';
import { getSecureResumeUrl } from '@/lib/resume-storage';
import { supabase } from '@/integrations/supabase/client';

describe('Secure Resume Storage & Signed URL Suite', () => {
  it('returns empty string when given null or empty url', async () => {
    expect(await getSecureResumeUrl(null)).toBe('');
    expect(await getSecureResumeUrl('')).toBe('');
  });

  it('returns already signed or blob URLs immediately without extra call', async () => {
    const blobUrl = 'blob:http://localhost:5173/abc-123';
    expect(await getSecureResumeUrl(blobUrl)).toBe(blobUrl);

    const alreadySigned = 'https://supabase.co/storage/v1/object/sign/resumes/my-file.pdf?token=secret123';
    expect(await getSecureResumeUrl(alreadySigned)).toBe(alreadySigned);
  });

  it('extracts relative path from Supabase storage URLs and requests a signed URL', async () => {
    const mockCreateSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://supabase.co/storage/v1/object/sign/resumes/job-1/resume.pdf?token=xyz987' },
      error: null
    });

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      createSignedUrl: mockCreateSignedUrl
    } as any);

    const publicUrl = 'https://xyz.supabase.co/storage/v1/object/public/resumes/job-1/resume.pdf';
    const signed = await getSecureResumeUrl(publicUrl, 900);

    expect(mockCreateSignedUrl).toHaveBeenCalledWith('job-1/resume.pdf', 900);
    expect(signed).toBe('https://supabase.co/storage/v1/object/sign/resumes/job-1/resume.pdf?token=xyz987');
  });

  it('handles relative storage paths directly', async () => {
    const mockCreateSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://supabase.co/signed/candidates/doc-1.pdf' },
      error: null
    });

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      createSignedUrl: mockCreateSignedUrl
    } as any);

    const result = await getSecureResumeUrl('candidates/doc-1.pdf', 600);
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('candidates/doc-1.pdf', 600);
    expect(result).toBe('https://supabase.co/signed/candidates/doc-1.pdf');
  });

  it('falls back to original url if signed URL generation fails', async () => {
    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: new Error('Storage error') })
    } as any);

    const original = 'job-101/candidate-resume.pdf';
    const result = await getSecureResumeUrl(original);
    expect(result).toBe(original);
  });
});
