import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HireSortApp } from '@/components/HireSortApp';
import { RankedCandidatesList } from '@/components/flows/RankedCandidatesList';
import { Job } from '@/types/hiresort';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => {
  const candidateList = [
    {
      id: 'cand-1',
      job_id: 'test-job-123',
      full_name: 'Sarah Connor',
      role_title: 'Frontend Lead',
      company: 'Cyberdyne',
      experience: 8,
      ai_score: 'high',
      cosine_similarity: 0.92,
      source: 'applied',
      resume_text: 'Experienced React developer with TypeScript and Vite'
    }
  ];

  return {
    supabase: {
      from: vi.fn((table: string) => ({
        select: vi.fn(() => {
          const queryObj: any = {
            eq: vi.fn((field: string, val: any) => {
              const eqObj: any = {
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'test-job-123',
                    title: 'Principal React Engineer',
                    department: 'Engineering',
                    location: 'Remote',
                    status: 'active',
                    hire_sort_enabled: true,
                    ai_processing_status: 'complete'
                  },
                  error: null
                }),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'test-job-123',
                    title: 'Principal React Engineer',
                    department: 'Engineering',
                    location: 'Remote',
                    status: 'active',
                    hire_sort_enabled: true,
                    ai_processing_status: 'complete'
                  },
                  error: null
                }),
                order: vi.fn().mockResolvedValue({ data: candidateList, error: null }),
                then: (resolve: any) => Promise.resolve({ data: candidateList, error: null }).then(resolve)
              };
              return eqObj;
            }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockResolvedValue({ data: candidateList, error: null }),
            then: (resolve: any) => Promise.resolve({ data: candidateList, error: null }).then(resolve)
          };
          return queryObj;
        }),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        })),
        upsert: vi.fn().mockResolvedValue({ error: null })
      }))
    }
  };
});

// Mock Auth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'admin@zool.in' },
    clientId: 'zool-inc',
    client: { id: 'zool-inc', name: 'Zool Inc', slug: 'zool' },
    role: 'client_admin',
    isSuperAdmin: false
  }),
  DEFAULT_ZOOL_CLIENT: { id: 'zool-inc', name: 'Zool Inc', slug: 'zool' }
}));

describe('Job Candidates URL Navigation & Re-analyze Features', () => {
  const mockJob: Job = {
    id: 'test-job-123',
    title: 'Principal React Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'full-time',
    salary: '$180,000',
    description: 'Looking for a senior React architect',
    responsibilities: ['Build UI', 'Mentor team'],
    requirements: ['React', 'TypeScript', 'Tailwind'],
    hireSortEnabled: true,
    aiProcessingStatus: 'complete',
    candidateCount: 1,
    status: 'active'
  };

  it('renders Re-analyze All button and individual Re-analyze button on candidate card', async () => {
    render(
      <MemoryRouter>
        <RankedCandidatesList
          selectedJob={mockJob}
          onSelectCandidate={vi.fn()}
          onCreateShortlist={vi.fn()}
        />
      </MemoryRouter>
    );

    // Verify Re-analyze All button exists in header
    const reanalyzeAllBtn = await screen.findByTitle('Re-analyze all candidates against current job requirements');
    expect(reanalyzeAllBtn).toBeInTheDocument();
    expect(reanalyzeAllBtn).toHaveTextContent('Re-analyze All');

    // Verify individual Re-analyze button exists
    const singleReanalyzeBtn = await screen.findByTitle('Re-analyze Candidate with AI');
    expect(singleReanalyzeBtn).toBeInTheDocument();
  });

  it('directly mounts candidate list when accessing /jobs/:jobId route', async () => {
    render(
      <MemoryRouter initialEntries={['/jobs/test-job-123']}>
        <Routes>
          <Route path="/jobs/:jobId" element={<HireSortApp />} />
          <Route path="/jobs" element={<HireSortApp />} />
        </Routes>
      </MemoryRouter>
    );

    // Should load the job and show candidates view directly without reverting to job list
    await waitFor(() => {
      expect(screen.getByText('Principal React Engineer')).toBeInTheDocument();
    });
  });
});
