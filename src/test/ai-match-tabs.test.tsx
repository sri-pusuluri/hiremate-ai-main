import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIMatchAnalysis } from '@/components/flows/AIMatchAnalysis';
import { Candidate, Job } from '@/types/hiresort';

const testJob: Job = {
  id: 'job-senior-fe',
  title: 'Senior Frontend Engineer',
  department: 'Engineering',
  location: 'Dubai, UAE',
  type: 'Full-time',
  status: 'active',
  experienceLevel: 'Senior',
  candidatesCount: 15,
  applicantsCount: 15,
  createdAt: '2026-03-01T00:00:00Z',
  shortlistedCount: 4,
  description: 'Looking for a Senior React Engineer with TypeScript and Next.js experience.',
  requirements: ['React', 'TypeScript', 'Next.js', 'TailwindCSS', 'REST APIs', 'GraphQL']
};

const testCandidate: Candidate = {
  id: 'cand-001',
  jobId: 'job-senior-fe',
  name: 'Sara Chen',
  email: 'sara.chen@example.com',
  currentRole: 'Senior React Developer',
  company: 'TechFlow Systems',
  experience: 6,
  status: 'applied',
  appliedDate: '2026-03-10T00:00:00Z',
  cosineSimilarity: 0.88,
  aiScore: 'high',
  aiExplanation: 'Strong cognitive match for frontend leadership with proven architectural capability.',
  matchedSkills: ['React', 'TypeScript', 'Next.js', 'REST APIs'],
  missingSkills: ['GraphQL', 'TailwindCSS'],
  resumeText: '6 years of React, TypeScript, Next.js web application architecture.',
  predictiveInsights: {
    interviewPassProbability: 86,
    offerAcceptanceProbability: 80,
    onboardingSuccessProbability: 92,
    retentionRisk: 'low',
    retentionRiskFactor: 'Stable 3+ year tenures across tier-1 software companies.',
    timeToJoinDays: '15–30 days',
    assessmentSummary: 'Outstanding frontend engineering candidate.',
    provider: 'openai',
    model: 'gpt-4o-mini',
    executionMode: 'external_llm'
  }
};

describe('AIMatchAnalysis Dual-Engine Two-Tab Layout', () => {
  it('renders persistent summary scores above the tabs', () => {
    render(<AIMatchAnalysis candidate={testCandidate} job={testJob} />);

    // Top persistent scores
    expect(screen.getByText('Dual-Engine Match Analysis')).toBeDefined();
    expect(screen.getByText('Semantic Math Score')).toBeDefined();
    expect(screen.getAllByText('88%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/LLM Cognitive Score|LLM Fit Score/i)).toBeDefined();
    expect(screen.getAllByText(/high/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders both Tab triggers with proper badges', () => {
    render(<AIMatchAnalysis candidate={testCandidate} job={testJob} />);

    // Tab 1 trigger
    expect(screen.getByText(/1\. Semantic Math/i)).toBeDefined();
    expect(screen.getAllByText('88%').length).toBeGreaterThanOrEqual(2);

    // Tab 2 trigger
    expect(screen.getByText(/2\. LLM (?:Reasoning|Recruiter)/i)).toBeDefined();

    // Tab 3 trigger
    expect(screen.getByText(/3\. Comparison/i)).toBeDefined();
  });

  it('contains vector metrics and skills inside Semantic Math tab', () => {
    render(<AIMatchAnalysis candidate={testCandidate} job={testJob} />);

    // Vector banner
    expect(screen.getByText('Vector Math & Hard Skill Verification')).toBeDefined();
    expect(screen.getByText(/1536-dimensional cosine similarity/i)).toBeDefined();

    // Skills & experience
    expect(screen.getByText('Skills Match')).toBeDefined();
    expect(screen.getByText('Skills Found in Resume (4)')).toBeDefined();
    expect(screen.getAllByText(/React/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/TypeScript/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Not Found in Resume (2)')).toBeDefined();
    expect(screen.getAllByText(/GraphQL/i).length).toBeGreaterThanOrEqual(1);

    // Multi-dimensional screening coverage
    expect(screen.getByText(/Full Screening Coverage Dimensions/i)).toBeDefined();
    expect(screen.getByText(/5\/5 Dimensions Evaluated/i)).toBeDefined();
  });

  it('contains engine selector, assessment narrative, and difference analysis in LLM Recruiter tab', () => {
    const handleReanalyze = vi.fn();
    render(
      <AIMatchAnalysis 
        candidate={testCandidate} 
        job={testJob} 
        onReanalyze={handleReanalyze} 
      />
    );

    // Qualitative assessment
    expect(screen.getByText('AI Recruiter Assessment')).toBeDefined();
    expect(screen.getByText('Strong cognitive match for frontend leadership with proven architectural capability.')).toBeDefined();

    // Consensus Difference Analysis
    expect(screen.getByText(/Difference Analysis \(Consensus vs Divergence\)/i)).toBeDefined();
    expect(screen.getByText(/Strong Consensus: Both the mathematical vector distance and the LLM's qualitative reasoning/i)).toBeDefined();

    // Active Screening Engine selector & button
    expect(screen.getByText('Active Screening Engine')).toBeDefined();
    const rescreenBtn = screen.getByRole('button', { name: /Re-screen/i });
    expect(rescreenBtn).toBeDefined();

    // Click Re-screen
    fireEvent.click(rescreenBtn);
    expect(handleReanalyze).toHaveBeenCalledTimes(1);
  });

  it('renders side-by-side comparative diff with green matches and red gaps in Comparison tab', () => {
    render(<AIMatchAnalysis candidate={testCandidate} job={testJob} />);

    // Header & consensus badge
    expect(screen.getByText('Dual-Engine Comparative Diff')).toBeDefined();
    expect(screen.getAllByText(/Consensus/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Green = Agreement/i)).toBeDefined();
    expect(screen.getByText(/Red = Discrepancy/i)).toBeDefined();

    // Left vs Right Panel Titles
    expect(screen.getAllByText(/Left: Semantic Math \(Vectors\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Right: LLM Recruiter \(Cognitive\)/i).length).toBeGreaterThanOrEqual(1);

    // Dimensions
    expect(screen.getByText(/1\. Score & Fit Verdict/i)).toBeDefined();
    expect(screen.getByText(/Harmonized Agreement/i)).toBeDefined();
    expect(screen.getByText(/2\. Skill Extraction & Alias Matrix/i)).toBeDefined();
    expect(screen.getByText(/3\. Experience & Seniority Calibration/i)).toBeDefined();
    expect(screen.getByText(/4\. Retention & Behavioral Stability/i)).toBeDefined();

    // Actionable Recruiter Guidance
    expect(screen.getByText(/🎯 Recruiter Action Plan: Resolving Engine Discrepancies/i)).toBeDefined();
  });
});
