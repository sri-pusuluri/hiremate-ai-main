import { describe, it, expect, beforeEach, vi } from 'vitest';
import { asyncAIQueue } from '../lib/async-ai-queue';
import { Candidate, Job } from '@/types/hiresort';

describe('Async AI Queue & Token Caching Suite', () => {
  const dummyJob: Job = {
    id: 'job-eng-101',
    title: 'Senior Full Stack Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'full-time',
    requirements: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    responsibilities: ['Build APIs', 'Optimize UI'],
    postedDate: '2026-02-01',
    candidateCount: 5,
    isPublic: true
  };

  const dummyCandidate: Candidate = {
    id: 'cand-001',
    name: 'Alex Mercer',
    email: 'alex.mercer@example.com',
    role_title: 'Full Stack Developer',
    experience: 5,
    company: 'Acme Corp',
    applied_for: 'job-eng-101',
    match_score: 85,
    skills: ['React', 'TypeScript', 'Node.js'],
    status: 'new',
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    asyncAIQueue.clearCompleted();
    asyncAIQueue.setConcurrency(2);
    if (asyncAIQueue.isQueuePaused()) {
      asyncAIQueue.resume();
    }
  });

  it('generates consistent deterministic evaluation fingerprints for cache keying', () => {
    const resumeText = 'Experienced React, TypeScript, and Node.js developer with 5 years building web applications.';
    const hash1 = asyncAIQueue.generateEvaluationFingerprint(resumeText, dummyJob.id, dummyJob.requirements, 'auto');
    const hash2 = asyncAIQueue.generateEvaluationFingerprint(resumeText, dummyJob.id, dummyJob.requirements, 'auto');
    const differentHash = asyncAIQueue.generateEvaluationFingerprint(resumeText + ' extra text', dummyJob.id, dummyJob.requirements, 'auto');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(differentHash);
    expect(hash1).toContain('eval_cache_');
  });

  it('enqueues screening jobs and processes them with registered evaluator', async () => {
    const mockEvaluator = vi.fn().mockResolvedValue({
      currentRole: 'Full Stack Developer',
      company: 'Acme Corp',
      experience: 5,
      score: 'high',
      similarity: 0.88,
      matchedSkills: ['React', 'TypeScript'],
      missingSkills: ['PostgreSQL'],
      interviewPassProb: 80,
      offerAcceptanceProb: 75,
      onboardingSuccessProb: 85,
      retentionRisk: 'low',
      retentionRiskFactor: 'Stable tenure',
      timeToJoinEstimate: '15 days',
      assessment: 'Strong candidate profile.'
    });

    asyncAIQueue.registerEvaluator(mockEvaluator);

    const job = await asyncAIQueue.enqueue(dummyCandidate, dummyJob, {
      resumeText: 'React, TypeScript, Node.js expert with 5 years experience.'
    });

    expect(job).toBeDefined();
    expect(job.candidateId).toBe(dummyCandidate.id);
    expect(job.jobId).toBe(dummyJob.id);

    // Wait briefly for the worker to process the job
    await new Promise(r => setTimeout(r, 60));

    const jobs = asyncAIQueue.getJobs();
    const processedJob = jobs.find(j => j.id === job.id);
    expect(processedJob?.status).toBe('completed');
    expect(processedJob?.result?.score).toBe('high');
    expect(mockEvaluator).toHaveBeenCalled();
  });

  it('deduplicates identical evaluation requests and returns cached result with 0 token spend', async () => {
    const mockEvaluator = vi.fn().mockResolvedValue({
      currentRole: 'Software Engineer',
      company: 'Tech Solutions',
      experience: 4,
      score: 'medium',
      similarity: 0.75,
      matchedSkills: ['React'],
      missingSkills: ['PostgreSQL'],
      interviewPassProb: 70,
      offerAcceptanceProb: 70,
      onboardingSuccessProb: 75,
      retentionRisk: 'low',
      retentionRiskFactor: 'Standard risk',
      timeToJoinEstimate: '30 days',
      assessment: 'Meets primary frontend qualifications.'
    });

    asyncAIQueue.registerEvaluator(mockEvaluator);

    const identicalResume = 'Software Engineer with React experience looking for full stack opportunities.';

    // First evaluation: misses cache, executes evaluator
    const firstJob = await asyncAIQueue.enqueue(dummyCandidate, dummyJob, {
      resumeText: identicalResume
    });

    await new Promise(r => setTimeout(r, 60));
    const initialCallCount = mockEvaluator.mock.calls.length;

    // Second evaluation with identical resume and job: hits cache directly
    const cachedJob = await asyncAIQueue.enqueue(dummyCandidate, dummyJob, {
      resumeText: identicalResume
    });

    expect(cachedJob.status).toBe('cached');
    expect(cachedJob.tokensSaved).toBeGreaterThan(0);
    expect(cachedJob.costSavedUsd).toBeGreaterThan(0);
    expect(cachedJob.result).toBeDefined();
    expect(cachedJob.result?.score).toBe('medium');

    // Evaluator should not have been called a second time
    expect(mockEvaluator.mock.calls.length).toBe(initialCallCount);
  });

  it('honors task priority scheduling (urgent ahead of batch)', async () => {
    asyncAIQueue.pause(); // Pause so jobs accumulate in the queue

    const candidateA: Candidate = { ...dummyCandidate, id: 'cand-batch', name: 'Batch Candidate' };
    const candidateB: Candidate = { ...dummyCandidate, id: 'cand-urgent', name: 'Urgent Candidate' };

    await asyncAIQueue.enqueue(candidateA, dummyJob, {
      priority: 'batch',
      resumeText: 'Unique resume for batch candidate'
    });

    await asyncAIQueue.enqueue(candidateB, dummyJob, {
      priority: 'urgent',
      resumeText: 'Unique resume for urgent candidate'
    });

    const jobs = asyncAIQueue.getJobs();
    const urgentIndex = jobs.findIndex(j => j.candidateId === 'cand-urgent');
    const batchIndex = jobs.findIndex(j => j.candidateId === 'cand-batch');

    expect(urgentIndex).toBeLessThan(batchIndex);
    asyncAIQueue.resume();
  });

  it('retries on simulated rate-limiting (429) errors with backoff', async () => {
    let callAttempts = 0;
    const rateLimitThenSuccessEvaluator = vi.fn().mockImplementation(async () => {
      callAttempts++;
      if (callAttempts === 1) {
        const err: any = new Error('HTTP 429: Too Many Requests / Rate limit reached');
        err.status = 429;
        throw err;
      }
      return {
        currentRole: 'Reliability Engineer',
        company: 'Cloud Corp',
        experience: 6,
        score: 'high',
        similarity: 0.92,
        matchedSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        missingSkills: [],
        interviewPassProb: 90,
        offerAcceptanceProb: 85,
        onboardingSuccessProb: 90,
        retentionRisk: 'low',
        retentionRiskFactor: 'None',
        timeToJoinEstimate: 'Immediate',
        assessment: 'Flawless candidate match.'
      };
    });

    asyncAIQueue.registerEvaluator(rateLimitThenSuccessEvaluator);

    const job = await asyncAIQueue.enqueue(
      { ...dummyCandidate, id: 'cand-retry' },
      dummyJob,
      { resumeText: 'Unique candidate text for rate limit test.' }
    );

    // Give time for initial attempt + backoff + successful second attempt
    await new Promise(r => setTimeout(r, 1600));

    const jobs = asyncAIQueue.getJobs();
    const finalJob = jobs.find(j => j.id === job.id);
    expect(callAttempts).toBe(2);
    expect(finalJob?.status).toBe('completed');
    expect(finalJob?.retryCount).toBe(1);
    expect(finalJob?.result?.similarity).toBe(0.92);
  });
});
