import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CandidateReportModal } from '@/components/reports/CandidateReportModal';
import { Candidate, Job } from '@/types/hiresort';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    client: { id: 'test-client', name: 'Zool HQ', slug: 'zool' },
    isSuperAdmin: true,
  }),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockCandidate: Candidate = {
  id: 'cand-dossier-test-1',
  name: 'Adlin Yona Ui Ux',
  email: 'adlin@example.com',
  currentRole: 'Senior Product Designer',
  company: 'Life Designer Pvt Ltd',
  experience: 5,
  location: 'Bangalore, India',
  appliedDate: '2026-09-15',
  aiScore: 'high',
  cosineSimilarity: 0.88,
  matchedSkills: ['Figma', 'User Research', 'Design Systems', 'Prototyping'],
  missingSkills: ['Design Tokens Architecture'],
  isPinned: true,
  predictiveInsights: {
    interviewPassProb: 88,
    offerAcceptanceProb: 82,
    retentionRisk: 'low',
    retentionRiskFactor: 'High career stability and strong role alignment',
    timeToJoinEstimate: '15 - 30 Days',
    assessment: 'Candidate exhibits mastery in UI/UX and product architecture.',
  },
};

const mockJob: Job = {
  id: 'job-dossier-1',
  title: 'Lead Product Designer',
  department: 'Design & Engineering',
  location: 'Remote',
  type: 'Full-time',
  status: 'active',
  hireSortEnabled: true,
  createdAt: '2026-09-01',
  experienceRequired: '4-7 yrs',
};

describe('Candidate Executive Report & PDF Dossier Suite', () => {
  it('renders CandidateReportModal with candidate profile, KPI metrics, and skills gap analysis', () => {
    const handleClose = vi.fn();

    render(
      <CandidateReportModal
        candidate={mockCandidate}
        job={mockJob}
        open={true}
        onOpenChange={handleClose}
      />
    );

    // Verify modal title and candidate information
    expect(screen.getByText(/Candidate Executive Dossier/i)).toBeInTheDocument();
    expect(screen.getByText('Adlin Yona Ui Ux')).toBeInTheDocument();
    expect(screen.getAllByText(/Senior Product Designer/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Life Designer Pvt Ltd/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Lead Product Designer/i)).toBeInTheDocument();

    // Verify match score
    expect(screen.getAllByText(/88%/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/ATS Match Fit/i)).toBeInTheDocument();

    // Verify validated skills and missing skills
    expect(screen.getByText('Figma')).toBeInTheDocument();
    expect(screen.getByText('User Research')).toBeInTheDocument();
    expect(screen.getByText('Design Tokens Architecture')).toBeInTheDocument();

    // Verify Download / Print PDF button
    const printBtn = screen.getByRole('button', { name: /Download \/ Print PDF/i });
    expect(printBtn).toBeInTheDocument();

    // Trigger print
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
