import { describe, it, expect } from 'vitest';
import { calculateDisparateImpact } from '@/lib/disparate-impact';
import { Candidate } from '@/types/hiresort';

describe('Disparate Impact & EEOC 4/5ths Rule Suite', () => {
  const mockCandidates: Candidate[] = [
    // Early career (2 yrs): 2 applicants, 1 selected (50% rate)
    { id: 'c1', name: 'Alice', email: 'a@ex.com', experience: 1, aiScore: 'high', status: 'shortlisted' } as any,
    { id: 'c2', name: 'Bob', email: 'b@ex.com', experience: 2, aiScore: 'low', status: 'applied' } as any,

    // Mid-level (4 yrs): 2 applicants, 1 selected (50% rate)
    { id: 'c3', name: 'Charlie', email: 'c@ex.com', experience: 4, aiScore: 'high', status: 'shortlisted' } as any,
    { id: 'c4', name: 'Diana', email: 'd@ex.com', experience: 4, aiScore: 'low', status: 'applied' } as any,

    // Senior (8 yrs): 2 applicants, 2 selected (100% rate) - benchmark
    { id: 'c5', name: 'Evan', email: 'e@ex.com', experience: 8, aiScore: 'high', status: 'shortlisted' } as any,
    { id: 'c6', name: 'Fiona', email: 'f@ex.com', experience: 10, aiScore: 'high', status: 'interviewing' } as any,
  ];

  it('calculates cohort metrics and benchmark group accurately', () => {
    const report = calculateDisparateImpact(mockCandidates);

    expect(report.totalApplicantsEvaluated).toBe(6);
    expect(report.totalShortlisted).toBe(4);
    expect(report.benchmarkGroup).toBe('Senior / Lead (6+ Yrs)');
    expect(report.benchmarkSelectionRate).toBe(100);
  });

  it('evaluates adverse impact ratio against benchmark rate (50% / 100% = 0.50 -> action_required)', () => {
    const report = calculateDisparateImpact(mockCandidates);

    const earlyCareer = report.cohortMetrics.find(m => m.groupName === 'Early Career (0–2 Yrs)');
    expect(earlyCareer).toBeDefined();
    expect(earlyCareer?.selectionRate).toBe(50);
    expect(earlyCareer?.adverseImpactRatio).toBe(0.5);
    expect(earlyCareer?.status).toBe('adverse_impact');

    expect(report.lowestImpactRatio).toBe(0.5);
    expect(report.overallStatus).toBe('action_required');
  });

  it('reports compliant when all groups meet or exceed 80% threshold', () => {
    const balancedCandidates: Candidate[] = [
      { id: 'c1', name: 'Alice', email: 'a@ex.com', experience: 1, aiScore: 'high', status: 'shortlisted' } as any,
      { id: 'c2', name: 'Bob', email: 'b@ex.com', experience: 4, aiScore: 'high', status: 'shortlisted' } as any,
      { id: 'c3', name: 'Charlie', email: 'c@ex.com', experience: 8, aiScore: 'high', status: 'shortlisted' } as any,
    ];

    const report = calculateDisparateImpact(balancedCandidates);
    expect(report.overallStatus).toBe('compliant');
    expect(report.lowestImpactRatio).toBe(1.0);
  });

  it('handles empty candidates list safely', () => {
    const report = calculateDisparateImpact([]);
    expect(report.totalApplicantsEvaluated).toBe(0);
    expect(report.overallStatus).toBe('compliant');
  });
});
