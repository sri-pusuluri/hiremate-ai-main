import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AIMatchAnalysis } from '../components/flows/AIMatchAnalysis';
import { PredictiveInsightsPanel } from '../components/predictive/PredictiveInsightsPanel';
import { Candidate, Job } from '../types/hiresort';

describe('Candidate Screen Output Captures', () => {
  const sampleCandidate: Candidate = {
    id: 'cand-tariq-001',
    jobId: '327d29eb-2660-47be-a55a-2b42c96b0f66',
    name: 'Tariq Al-Mansoor',
    email: 'tariq.almansoor@wpdev.io',
    experience: 5,
    location: 'Austin, TX',
    appliedDate: '2026-09-13',
    currentRole: 'Senior WordPress & Headless Architect',
    currentCompany: 'Automattic Partner Agency',
    aiScore: 'high',
    cosineSimilarity: 0.82,
    matchedSkills: ['PHP', 'WordPress Core', 'Custom Themes', 'Custom Plugins', 'Gutenberg Blocks', 'ACF Pro', 'WooCommerce'],
    missingSkills: ['Vue.js', 'Redis', 'AWS'],
    predictiveInsights: {
      interviewPassProb: 81,
      offerAcceptanceProb: 84,
      onboardingSuccessProb: 83,
      retentionRisk: 'low',
      retentionRiskFactor: 'Strong technical alignment with stable career progression.',
      timeToJoinEstimate: '15–30 days',
      assessment: 'Strong match: Tariq Al-Mansoor brings 5 years of relevant experience, satisfying key requirements including PHP, WordPress Core, and Custom Themes.'
    } as any
  };

  const sampleJob: Job = {
    id: '327d29eb-2660-47be-a55a-2b42c96b0f66',
    title: 'WordPress Developer (Custom Themes, Plugins & Headless)',
    department: 'Engineering',
    location: 'Remote',
    type: 'full-time',
    requirements: ['PHP', 'WordPress Core', 'Custom Themes', 'Custom Plugins', 'Gutenberg Blocks', 'ACF Pro', 'WooCommerce'],
    responsibilities: ['Architect custom WordPress themes and headless solutions']
  };

  it('captures ai_score and cosine_similarity on screen in AIMatchAnalysis', () => {
    render(<AIMatchAnalysis candidate={sampleCandidate} job={sampleJob} />);

    // 1. Semantic Math Score (cosine_similarity * 100) -> 82%
    expect(screen.getAllByText(/82%/).length).toBeGreaterThan(0);
    expect(screen.getByText('Semantic Math Score')).toBeDefined();

    // 2. LLM Fit Score (ai_score) -> high
    expect(screen.getAllByText(/high/i).length).toBeGreaterThan(0);
    expect(screen.getByText('LLM Fit Score')).toBeDefined();
  });

  it('captures External LLM & Screening Provider Details and full coverage specification on screen', () => {
    render(<AIMatchAnalysis candidate={sampleCandidate} job={sampleJob} />);

    // External LLM details panel
    expect(screen.getByText(/External LLM & Screening Provider Details/i)).toBeDefined();
    expect(screen.getByText(/Inference pipeline, model telemetry, and multi-attribute screening coverage/i)).toBeDefined();
    expect(screen.getByText(/1536-dim Cosine/i)).toBeDefined();
    expect(screen.getByText(/0% Hardcoded/i)).toBeDefined();
    expect(screen.getByText(/What & All Does the External Provider Cover\?/i)).toBeDefined();
  });

  it('captures matched_skills and missing_skills on screen with badges', () => {
    render(<AIMatchAnalysis candidate={sampleCandidate} job={sampleJob} />);

    // Matched skills count & items
    expect(screen.getByText(/Skills Found in Resume \(7\)/i)).toBeDefined();
    expect(screen.getByText(/✓ WordPress Core/i)).toBeDefined();
    expect(screen.getByText(/✓ Custom Themes/i)).toBeDefined();
    expect(screen.getByText(/✓ Gutenberg Blocks/i)).toBeDefined();

    // Missing skills count & items
    expect(screen.getByText(/Not Found in Resume \(3\)/i)).toBeDefined();
    expect(screen.getByText('Vue.js')).toBeDefined();
    expect(screen.getByText('Redis')).toBeDefined();
    expect(screen.getByText('AWS')).toBeDefined();
  });

  it('captures all 5 screening coverage dimensions and interview exploration probes', () => {
    render(<AIMatchAnalysis candidate={sampleCandidate} job={sampleJob} />);

    // Multi-dimensional breakdown banner
    expect(screen.getByText(/Full Screening Coverage Dimensions/i)).toBeDefined();
    expect(screen.getByText(/5\/5 Dimensions Evaluated/i)).toBeDefined();

    // Dimension 1: Core Stack Alignment
    expect(screen.getByText(/1\. Core Stack Alignment/i)).toBeDefined();
    expect(screen.getByText(/Verified Primary Stack/i)).toBeDefined();

    // Dimension 2: Competency Coverage
    expect(screen.getByText(/2\. Competency Coverage/i)).toBeDefined();
    expect(screen.getByText(/7 \/ 10 \(70%\)/i)).toBeDefined();

    // Dimension 3: Seniority Trajectory
    expect(screen.getByText(/3\. Seniority Trajectory/i)).toBeDefined();
    expect(screen.getByText(/5 yrs candidate/i)).toBeDefined();

    // Dimension 4: Predictive Retention
    expect(screen.getByText(/4\. Predictive Retention/i)).toBeDefined();
    expect(screen.getByText(/LOW Risk/i)).toBeDefined();

    // Dimension 5: Suggested Interview Probe Questions
    expect(screen.getByText(/Suggested Interview Probe Questions/i)).toBeDefined();
    expect(screen.getByText(/Verify Vue\.js/i)).toBeDefined();

    // Engine Transparency confirmation
    expect(screen.getByText(/100% Explainable • Zero Hardcoded Fallbacks/i)).toBeDefined();
  });

  it('captures predictive_insights probabilities, retention risk, and assessment on screen', () => {
    render(<PredictiveInsightsPanel candidate={sampleCandidate} />);

    // Probabilities
    expect(screen.getByText('Interview Pass Probability')).toBeDefined();
    expect(screen.getByText('81%')).toBeDefined();
    expect(screen.getByText('Offer Acceptance Probability')).toBeDefined();
    expect(screen.getByText('84%')).toBeDefined();
    expect(screen.getByText('Onboarding Success Probability')).toBeDefined();
    expect(screen.getByText('83%')).toBeDefined();

    // Retention risk and time to join
    expect(screen.getByText(/low Risk/i)).toBeDefined();
    expect(screen.getByText(/Strong technical alignment with stable career progression/i)).toBeDefined();
    expect(screen.getByText('15–30 days')).toBeDefined();

    // Executive Assessment
    expect(screen.getByText(/Strong match: Tariq Al-Mansoor brings 5 years of relevant experience/i)).toBeDefined();
  });
});
