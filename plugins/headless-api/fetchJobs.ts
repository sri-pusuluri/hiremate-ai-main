/**
 * HireSort AI — Headless API Data Fetcher (Option 5)
 * For clients wanting 100% control of their UI and design system.
 */

export interface HireSortJob {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  slug?: string;
  expires_at?: string;
  is_public: boolean;
  candidateCount?: number;
  created_at?: string;
}

export interface FetchJobsOptions {
  clientSlug?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  includeApplicantCounts?: boolean;
}

const DEFAULT_SUPABASE_URL = 'https://yggmodxzemxskhbtmmbn.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_f2F70SUs71K5oWOIEMwFgA_NGWkhzCh';

/**
 * Fetch active, non-expired public jobs with live applicant counts.
 */
export async function fetchHireSortJobs(options: FetchJobsOptions = {}): Promise<HireSortJob[]> {
  const url = options.supabaseUrl || DEFAULT_SUPABASE_URL;
  const key = options.supabaseAnonKey || DEFAULT_ANON_KEY;
  const clientSlug = options.clientSlug || 'zool';

  // Fetch jobs
  const jobsRes = await fetch(
    `${url}/rest/v1/jobs?select=*&is_public=eq.true&order=created_at.desc`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  );

  if (!jobsRes.ok) {
    throw new Error(`Failed to fetch jobs: ${jobsRes.statusText}`);
  }

  const rawJobs = await jobsRes.json();
  const now = new Date();

  // Filter out expired jobs
  const activeJobs = rawJobs.filter((job: any) => {
    if (!job.expires_at) return true;
    return new Date(job.expires_at) > now;
  });

  // Fetch applicant counts
  if (options.includeApplicantCounts !== false) {
    const candidatesRes = await fetch(
      `${url}/rest/v1/candidates?select=job_id`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
    );

    if (candidatesRes.ok) {
      const candidates = await candidatesRes.json();
      const countMap: Record<string, number> = {};
      candidates.forEach((c: any) => {
        if (c.job_id) countMap[c.job_id] = (countMap[c.job_id] || 0) + 1;
      });

      return activeJobs.map((j: any) => ({
        ...j,
        candidateCount: countMap[j.id] || 0,
      }));
    }
  }

  return activeJobs;
}
