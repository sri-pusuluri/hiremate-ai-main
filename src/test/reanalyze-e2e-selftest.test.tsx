import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CandidateDetail } from '@/components/flows/CandidateDetail';
import { RankedCandidatesList } from '@/components/flows/RankedCandidatesList';
import { HireSortApp } from '@/components/HireSortApp';
import { analyzeCandidateWithAI } from '@/lib/ai-screening';
import { Candidate, Job } from '@/types/hiresort';

// Spy on analyzeCandidateWithAI
vi.mock('@/lib/ai-screening', async () => {
  const actual = await vi.importActual<any>('@/lib/ai-screening');
  return {
    ...actual,
    analyzeCandidateWithAI: vi.fn(actual.analyzeCandidateWithAI)
  };
});

// Mock fetch for resume URLs
beforeEach(() => {
  global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status: 404,
      headers: new Headers(),
      text: () => Promise.resolve(''),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
    })
  );
});

// Mock Supabase with realistic candidate & job data
const mockDbCandidates: any[] = [
  {
    id: '86a45f75-e2db-436b-ae66-87c8f2e80474',
    job_id: 'test-job-wordpress',
    full_name: 'Adlin Yona Ui Ux',
    role_title: 'UI/UX Designer',
    company: 'Life Designer Pvt Ltd',
    experience: 5,
    location: 'Remote',
    ai_score: 'low',
    cosine_similarity: 0.29,
    source: 'applied',
    skills: ['Figma', 'UI Design'],
    matched_skills: ['Figma'],
    missing_skills: ['PHP', 'WordPress'],
    resume_text: null, // Note: resume_text is null, exactly like the user's screenshot!
    resume_url: 'https://example.com/resumes/adlin-yona.pdf',
    predictive_insights: {
      isUnprocessed: true,
      error: 'Data Not Processed: Missing or unparseable resume text.' // Previous error
    }
  },
  {
    id: 'cand-2-tariq',
    job_id: 'test-job-wordpress',
    full_name: 'Tariq Al-Mansoor',
    role_title: 'Senior WordPress Architect',
    company: 'DigitalCraft Solutions',
    experience: 5,
    location: 'Remote',
    ai_score: 'high',
    cosine_similarity: 0.82,
    source: 'applied',
    skills: ['PHP', 'WordPress Core', 'HTML5/CSS3'],
    matched_skills: ['PHP', 'WordPress Core'],
    missing_skills: [],
    resume_text: 'Senior WordPress architect with 5 years experience in plugins and headless WordPress',
    resume_url: null,
    predictive_insights: null
  }
];

const mockJob: Job = {
  id: 'test-job-wordpress',
  title: 'WordPress Developer (Custom Themes, Plugins & Headless)',
  department: 'Engineering',
  location: 'Remote',
  type: 'full-time',
  salary: '$120,000',
  description: 'Seeking experienced WordPress Developer for custom themes and headless setups.',
  responsibilities: ['Develop custom themes', 'Build custom plugins', 'Headless WP REST API'],
  requirements: ['PHP', 'WordPress Core', 'JavaScript', 'HTML5/CSS3'],
  hireSortEnabled: true,
  aiProcessingStatus: 'complete',
  candidateCount: 2,
  status: 'active'
};

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'candidates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn((field: string, val: any) => {
                const found = mockDbCandidates.find(c => c.id === val);
                return {
                  maybeSingle: vi.fn().mockResolvedValue({ data: found || mockDbCandidates[0], error: null }),
                  single: vi.fn().mockResolvedValue({ data: found || mockDbCandidates[0], error: null }),
                  order: vi.fn().mockResolvedValue({ data: mockDbCandidates, error: null }),
                  then: (resolve: any) => Promise.resolve({ data: mockDbCandidates, error: null }).then(resolve)
                };
              }),
              single: vi.fn().mockResolvedValue({ data: mockDbCandidates[0], error: null }),
              order: vi.fn().mockResolvedValue({ data: mockDbCandidates, error: null }),
              then: (resolve: any) => Promise.resolve({ data: mockDbCandidates, error: null }).then(resolve)
            })),
            update: vi.fn((updateData: any) => ({
              eq: vi.fn((field: string, val: any) => {
                const target = mockDbCandidates.find(c => c.id === val);
                if (target) {
                  Object.assign(target, updateData);
                }
                return Promise.resolve({ error: null });
              })
            })),
            upsert: vi.fn().mockResolvedValue({ error: null })
          };
        }

        // Default: jobs or others
        return {
          select: vi.fn(() => ({
            eq: vi.fn((field: string, val: any) => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
              single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
              order: vi.fn().mockResolvedValue({ data: [mockJob], error: null }),
              then: (resolve: any) => Promise.resolve({ data: [mockJob], error: null }).then(resolve)
            })),
            single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
            order: vi.fn().mockResolvedValue({ data: [mockJob], error: null }),
            then: (resolve: any) => Promise.resolve({ data: [mockJob], error: null }).then(resolve)
          })),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null })
          })),
          upsert: vi.fn().mockResolvedValue({ error: null })
        };
      })
    }
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-id', email: 'admin@zool.in' },
    clientId: 'zool-inc',
    client: { id: 'zool-inc', name: 'Zool Inc', slug: 'zool' },
    role: 'client_admin',
    isSuperAdmin: false
  }),
  DEFAULT_ZOOL_CLIENT: { id: 'zool-inc', name: 'Zool Inc', slug: 'zool' }
}));

describe('Self-Test: Complete Re-Analyze Functionality & Persistence Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST 1: Direct analyzeCandidateWithAI call succeeds on candidate with null resume_text without throwing error', async () => {
    const candidateData = {
      candidateName: 'Adlin Yona Ui Ux',
      experience: 5,
      skills: ['Figma', 'UI/UX'],
      resumeText: null as any,
      resumeUrl: 'https://example.com/adlin.pdf',
      currentRole: 'UI/UX Designer',
      company: 'Life Designer Pvt Ltd'
    };

    // Simulate clicking with MouseEvent passed into options or provider
    const dummyClickEvent = { stopPropagation: vi.fn(), preventDefault: vi.fn() };
    const result = await analyzeCandidateWithAI(candidateData, mockJob, dummyClickEvent as any);

    expect(result).toBeDefined();
    // It must NOT be unprocessed
    expect(result.isUnprocessed).toBe(false);
    expect(result.score).toBeDefined();
    expect(typeof result.similarity).toBe('number');
    expect(result.assessment).toBeDefined();
  });

  it('TEST 2: CandidateDetail "Re-analyze Profile" button click does NOT throw error and clears stale error', async () => {
    const candidateWithPreviousError: Candidate = {
      id: '86a45f75-e2db-436b-ae66-87c8f2e80474',
      jobId: 'test-job-wordpress',
      name: 'Adlin Yona Ui Ux',
      email: 'adlin@example.com',
      currentRole: 'UI/UX Designer',
      company: 'Life Designer Pvt Ltd',
      experience: 5,
      location: 'Remote',
      aiScore: 'low',
      cosineSimilarity: 0.29,
      evaluationStatus: 'evaluated',
      source: 'applied',
      resumeText: '',
      evaluationError: 'Previous test error',
      predictiveInsights: {
        isUnprocessed: true,
        error: 'Data Not Processed: Missing or unparseable resume text.'
      } as any
    };

    const handleCandidateUpdate = vi.fn();

    render(
      <CandidateDetail
        candidate={candidateWithPreviousError}
        job={mockJob}
        onClose={vi.fn()}
        onFeedback={vi.fn()}
        onCandidateUpdate={handleCandidateUpdate}
      />
    );

    // Locate the "Re-analyze Profile" button
    const reanalyzeBtn = screen.getByRole('button', { name: /re-analyze profile/i });
    expect(reanalyzeBtn).toBeInTheDocument();

    // Click "Re-analyze Profile"
    fireEvent.click(reanalyzeBtn);

    // Wait for the re-analysis to complete and update candidate
    await waitFor(() => {
      expect(handleCandidateUpdate).toHaveBeenCalled();
    });

    const updatedCandidate = handleCandidateUpdate.mock.calls[0][0];
    expect(updatedCandidate.evaluationError).toBeUndefined();
    expect(updatedCandidate.predictiveInsights?.error).toBeNull();
    expect(updatedCandidate.predictiveInsights?.isUnprocessed).toBe(false);
  });

  it('TEST 3: RankedCandidatesList renders "Re-analyze All" button and executes batch re-analysis', async () => {
    render(
      <MemoryRouter>
        <RankedCandidatesList
          selectedJob={mockJob}
          onSelectCandidate={vi.fn()}
          onCreateShortlist={vi.fn()}
        />
      </MemoryRouter>
    );

    // Header Re-analyze All button
    const reanalyzeAllBtn = await screen.findByTitle('Re-analyze all candidates against current job requirements');
    expect(reanalyzeAllBtn).toBeInTheDocument();
    expect(reanalyzeAllBtn).not.toBeDisabled();

    // Click Re-analyze All
    fireEvent.click(reanalyzeAllBtn);

    // Verify analyzeCandidateWithAI was triggered for candidates
    await waitFor(() => {
      expect(analyzeCandidateWithAI).toHaveBeenCalled();
    });
  });

  it('TEST 4: RankedCandidatesList individual card Re-analyze button triggers single candidate re-analysis', async () => {
    render(
      <MemoryRouter>
        <RankedCandidatesList
          selectedJob={mockJob}
          onSelectCandidate={vi.fn()}
          onCreateShortlist={vi.fn()}
        />
      </MemoryRouter>
    );

    // Locate individual Re-analyze buttons on candidate rows
    const cardReanalyzeBtns = await screen.findAllByTitle('Re-analyze Candidate with AI');
    expect(cardReanalyzeBtns.length).toBeGreaterThan(0);

    // Click the first candidate's Re-analyze button
    fireEvent.click(cardReanalyzeBtns[0]);

    await waitFor(() => {
      expect(analyzeCandidateWithAI).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String)
        }),
        mockJob
      );
    });
  });

  it('TEST 5: Directly loading /jobs/:jobId route restores candidate list on refresh', async () => {
    render(
      <MemoryRouter initialEntries={['/jobs/test-job-wordpress']}>
        <Routes>
          <Route path="/jobs/:jobId" element={<HireSortApp />} />
          <Route path="/jobs" element={<HireSortApp />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify it stays on the job's candidate list directly
    await waitFor(() => {
      expect(screen.getByText('WordPress Developer (Custom Themes, Plugins & Headless)')).toBeInTheDocument();
      expect(screen.getByText('Candidates')).toBeInTheDocument();
    });
  });
});
