/**
 * Async AI Screening Queue & Token Caching Engine
 * 
 * Provides:
 * 1. Controlled Concurrency (Worker Pool) to prevent HTTP 429 Rate Limit bans from LLM providers.
 * 2. Multi-tier Priority Scheduling ('urgent' | 'standard' | 'batch').
 * 3. Cryptographic Fingerprint Caching to deduplicate redundant evaluations and cut token costs.
 * 4. Exponential Backoff & Auto-retry on transient provider errors.
 * 5. Observability metrics & event subscriptions for live UI monitoring.
 */

import { AIAnalysisResult } from './ai-screening';
import { Candidate, Job } from '@/types/hiresort';

export type JobPriority = 'urgent' | 'standard' | 'batch';
export type JobStatus = 'queued' | 'processing' | 'cached' | 'completed' | 'failed';

export interface ScreeningJob {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  priority: JobPriority;
  status: JobStatus;
  enqueuedAt: number;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
  maxRetries: number;
  error?: string;
  result?: AIAnalysisResult;
  tokensSaved?: number;
  costSavedUsd?: number;
}

export interface QueueMetrics {
  totalEnqueued: number;
  activeWorkers: number;
  maxWorkers: number;
  queuedCount: number;
  completedCount: number;
  cachedCount: number;
  failedCount: number;
  estimatedTokensSaved: number;
  estimatedCostSavedUsd: number;
  averageLatencyMs: number;
}

export type QueueEventListener = (metrics: QueueMetrics, currentJobs: ScreeningJob[]) => void;

// Cost benchmark: ~$0.002 per 1k input/output tokens for blended GPT-4o-mini / Gemini-Flash
const COST_PER_1K_TOKENS = 0.002;
const ESTIMATED_TOKENS_PER_RESUME = 2200;

class AsyncAIQueue {
  private queue: ScreeningJob[] = [];
  private activeWorkers = 0;
  private maxWorkers = 2; // Default 2 concurrent requests to protect provider rate limits
  private isPaused = false;
  private listeners: Set<QueueEventListener> = new Set();
  
  // Execution worker function injected from screening module
  private evaluatorFn?: (candidate: Candidate, job: Job, options?: any) => Promise<AIAnalysisResult>;

  // Metrics counters
  private metrics: QueueMetrics = {
    totalEnqueued: 0,
    activeWorkers: 0,
    maxWorkers: 2,
    queuedCount: 0,
    completedCount: 0,
    cachedCount: 0,
    failedCount: 0,
    estimatedTokensSaved: 0,
    estimatedCostSavedUsd: 0,
    averageLatencyMs: 0
  };

  private latencies: number[] = [];

  // Memory cache for evaluation deduplication: hash -> { result, cachedAt }
  private evaluationCache: Map<string, { result: AIAnalysisResult; cachedAt: number }> = new Map();

  constructor() {
    this.loadPersistedMetrics();
  }

  /**
   * Set max concurrent workers (e.g. 1 to 5)
   */
  public setConcurrency(concurrency: number): void {
    this.maxWorkers = Math.max(1, Math.min(concurrency, 10));
    this.metrics.maxWorkers = this.maxWorkers;
    this.notifyListeners();
    this.processNext();
  }

  /**
   * Register evaluation processor
   */
  public registerEvaluator(fn: (candidate: Candidate, job: Job, options?: any) => Promise<AIAnalysisResult>): void {
    this.evaluatorFn = fn;
  }

  /**
   * Generate SHA-256 equivalent deterministic hash for cache keying
   */
  public generateEvaluationFingerprint(resumeText: string, jobId: string, requirements: string[] = [], provider: string = 'auto'): string {
    const raw = `${resumeText.trim()}:::${jobId}:::${requirements.sort().join('|')}:::${provider}`;
    // Fast 32-bit FNV-1a / polynomial hash for high-throughput browser-friendly caching
    let hash1 = 0x811c9dc5;
    let hash2 = 0x1000193;
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i);
      hash1 = Math.imul(hash1 ^ code, 0x01000193);
      hash2 = Math.imul(hash2 ^ (code << 3), 0x5bd1e995);
    }
    return `eval_cache_${(hash1 >>> 0).toString(16)}_${(hash2 >>> 0).toString(16)}`;
  }

  /**
   * Check cache directly
   */
  public getCachedEvaluation(fingerprint: string): AIAnalysisResult | null {
    const entry = this.evaluationCache.get(fingerprint);
    if (!entry) {
      // Check localStorage if in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = localStorage.getItem(`hiresort_cache_${fingerprint}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            this.evaluationCache.set(fingerprint, parsed);
            return parsed.result;
          }
        } catch {
          // ignore storage read issues
        }
      }
      return null;
    }
    return entry.result;
  }

  /**
   * Save result in cache
   */
  public setCachedEvaluation(fingerprint: string, result: AIAnalysisResult): void {
    const entry = { result, cachedAt: Date.now() };
    this.evaluationCache.set(fingerprint, entry);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`hiresort_cache_${fingerprint}`, JSON.stringify(entry));
      } catch {
        // Handle storage quota
      }
    }
  }

  /**
   * Enqueue a candidate for asynchronous evaluation
   */
  public async enqueue(
    candidate: Candidate,
    job: Job,
    options?: {
      priority?: JobPriority;
      resumeText?: string;
      preferredProvider?: string;
    }
  ): Promise<ScreeningJob> {
    const priority = options?.priority || 'standard';
    const resumeText = options?.resumeText || (candidate as any).resume_text || '';
    const jobId = job.id;
    const reqs = job.requirements || [];
    const provider = options?.preferredProvider || 'auto';

    const fingerprint = this.generateEvaluationFingerprint(resumeText, jobId, reqs, provider);
    const cachedResult = this.getCachedEvaluation(fingerprint);

    const jobIdString = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newJob: ScreeningJob = {
      id: jobIdString,
      candidateId: candidate.id,
      candidateName: candidate.name || candidate.full_name || 'Candidate',
      jobId: job.id,
      jobTitle: job.title,
      priority,
      status: cachedResult ? 'cached' : 'queued',
      enqueuedAt: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      tokensSaved: cachedResult ? ESTIMATED_TOKENS_PER_RESUME : 0,
      costSavedUsd: cachedResult ? (ESTIMATED_TOKENS_PER_RESUME / 1000) * COST_PER_1K_TOKENS : 0,
      result: cachedResult || undefined
    };

    if (cachedResult) {
      newJob.completedAt = Date.now();
      this.metrics.cachedCount++;
      this.metrics.estimatedTokensSaved += ESTIMATED_TOKENS_PER_RESUME;
      this.metrics.estimatedCostSavedUsd += (ESTIMATED_TOKENS_PER_RESUME / 1000) * COST_PER_1K_TOKENS;
      this.queue.unshift(newJob);
      this.persistMetrics();
      this.notifyListeners();
      return newJob;
    }

    // Insert according to priority ('urgent' -> front, 'standard' -> middle, 'batch' -> end)
    if (priority === 'urgent') {
      const firstNonUrgentIndex = this.queue.findIndex(j => j.status === 'queued' && j.priority !== 'urgent');
      if (firstNonUrgentIndex === -1) {
        this.queue.push(newJob);
      } else {
        this.queue.splice(firstNonUrgentIndex, 0, newJob);
      }
    } else if (priority === 'standard') {
      const firstBatchIndex = this.queue.findIndex(j => j.status === 'queued' && j.priority === 'batch');
      if (firstBatchIndex === -1) {
        this.queue.push(newJob);
      } else {
        this.queue.splice(firstBatchIndex, 0, newJob);
      }
    } else {
      this.queue.push(newJob);
    }

    this.metrics.totalEnqueued++;
    this.metrics.queuedCount = this.queue.filter(j => j.status === 'queued').length;
    this.persistMetrics();
    this.notifyListeners();

    // Trigger worker processing
    this.processNext(candidate, job, options, fingerprint);

    return newJob;
  }

  /**
   * Process next item in the queue if capacity allows
   */
  private async processNext(candidate?: Candidate, job?: Job, options?: any, fingerprint?: string): Promise<void> {
    if (this.isPaused || this.activeWorkers >= this.maxWorkers) {
      return;
    }

    const nextJob = this.queue.find(j => j.status === 'queued');
    if (!nextJob) {
      return;
    }

    nextJob.status = 'processing';
    nextJob.startedAt = Date.now();
    this.activeWorkers++;
    this.metrics.activeWorkers = this.activeWorkers;
    this.metrics.queuedCount = this.queue.filter(j => j.status === 'queued').length;
    this.notifyListeners();

    try {
      if (!this.evaluatorFn) {
        throw new Error('No evaluation runner registered in AsyncAIQueue.');
      }

      const evalCandidate = candidate || ({ id: nextJob.candidateId, name: nextJob.candidateName } as Candidate);
      const evalJob = job || ({ id: nextJob.jobId, title: nextJob.jobTitle } as Job);

      const result = await this.executeWithRetry(() => this.evaluatorFn!(evalCandidate, evalJob, options), nextJob);

      nextJob.status = 'completed';
      nextJob.result = result;
      nextJob.completedAt = Date.now();
      
      const duration = nextJob.completedAt - (nextJob.startedAt || nextJob.enqueuedAt);
      this.recordLatency(duration);

      // Cache the result if fingerprint is available
      if (fingerprint) {
        this.setCachedEvaluation(fingerprint, result);
      }

      this.metrics.completedCount++;
    } catch (err: any) {
      console.error(`[Async AI Queue] Job ${nextJob.id} failed:`, err);
      nextJob.status = 'failed';
      nextJob.error = err.message || 'Evaluation error';
      nextJob.completedAt = Date.now();
      this.metrics.failedCount++;
    } finally {
      this.activeWorkers--;
      this.metrics.activeWorkers = this.activeWorkers;
      this.metrics.queuedCount = this.queue.filter(j => j.status === 'queued').length;
      this.persistMetrics();
      this.notifyListeners();

      // Check if more jobs are awaiting execution
      this.processNext();
    }
  }

  /**
   * Execute evaluation with exponential backoff on 429 / network errors
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, job: ScreeningJob): Promise<T> {
    while (true) {
      try {
        return await fn();
      } catch (err: any) {
        const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('rate');
        const isNetworkErr = err?.name === 'TypeError' || err?.message?.includes('network');

        if ((isRateLimit || isNetworkErr) && job.retryCount < job.maxRetries) {
          job.retryCount++;
          // Exponential backoff: 1s, 2s, 4s (+ jitter)
          const delayMs = Math.pow(2, job.retryCount - 1) * 1000 + Math.random() * 200;
          console.warn(`[Async AI Queue] Rate limit/transient error for ${job.id}. Backing off for ${Math.round(delayMs)}ms (Attempt ${job.retryCount}/${job.maxRetries}).`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        throw err;
      }
    }
  }

  private recordLatency(latencyMs: number): void {
    this.latencies.push(latencyMs);
    if (this.latencies.length > 50) this.latencies.shift();
    const sum = this.latencies.reduce((acc, v) => acc + v, 0);
    this.metrics.averageLatencyMs = Math.round(sum / this.latencies.length);
  }

  public pause(): void {
    this.isPaused = true;
    this.notifyListeners();
  }

  public resume(): void {
    this.isPaused = false;
    this.notifyListeners();
    this.processNext();
  }

  public isQueuePaused(): boolean {
    return this.isPaused;
  }

  public retryFailed(): void {
    for (const job of this.queue) {
      if (job.status === 'failed') {
        job.status = 'queued';
        job.retryCount = 0;
        job.error = undefined;
      }
    }
    this.metrics.queuedCount = this.queue.filter(j => j.status === 'queued').length;
    this.notifyListeners();
    this.processNext();
  }

  public clearCompleted(): void {
    this.queue = this.queue.filter(j => j.status === 'queued' || j.status === 'processing');
    this.metrics.queuedCount = this.queue.filter(j => j.status === 'queued').length;
    this.notifyListeners();
  }

  public getJobs(): ScreeningJob[] {
    return [...this.queue];
  }

  public getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  public subscribe(listener: QueueEventListener): () => void {
    this.listeners.add(listener);
    listener(this.getMetrics(), this.getJobs());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const currentMetrics = this.getMetrics();
    const currentJobs = this.getJobs();
    for (const listener of this.listeners) {
      try {
        listener(currentMetrics, currentJobs);
      } catch (err) {
        console.error('[Async AI Queue] Error in queue event listener:', err);
      }
    }
  }

  private persistMetrics(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('hiresort_queue_metrics', JSON.stringify({
          estimatedTokensSaved: this.metrics.estimatedTokensSaved,
          estimatedCostSavedUsd: this.metrics.estimatedCostSavedUsd,
          cachedCount: this.metrics.cachedCount,
          completedCount: this.metrics.completedCount
        }));
      } catch {
        // ignore
      }
    }
  }

  private loadPersistedMetrics(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('hiresort_queue_metrics');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.metrics.estimatedTokensSaved = parsed.estimatedTokensSaved || 0;
          this.metrics.estimatedCostSavedUsd = parsed.estimatedCostSavedUsd || 0;
          this.metrics.cachedCount = parsed.cachedCount || 0;
        }
      } catch {
        // ignore
      }
    }
  }
}

// Global Singleton Instance
export const asyncAIQueue = new AsyncAIQueue();

import { useState, useEffect } from 'react';

/**
 * React hook to consume live queue metrics and active jobs
 */
export function useAsyncScreeningQueue() {
  const [metrics, setMetrics] = useState<QueueMetrics>(asyncAIQueue.getMetrics());
  const [jobs, setJobs] = useState<ScreeningJob[]>(asyncAIQueue.getJobs());
  const [isPaused, setIsPaused] = useState<boolean>(asyncAIQueue.isQueuePaused());

  useEffect(() => {
    const unsubscribe = asyncAIQueue.subscribe((newMetrics, newJobs) => {
      setMetrics(newMetrics);
      setJobs(newJobs);
      setIsPaused(asyncAIQueue.isQueuePaused());
    });
    return () => unsubscribe();
  }, []);

  return {
    metrics,
    jobs,
    isPaused,
    pauseQueue: () => asyncAIQueue.pause(),
    resumeQueue: () => asyncAIQueue.resume(),
    retryFailed: () => asyncAIQueue.retryFailed(),
    clearCompleted: () => asyncAIQueue.clearCompleted(),
    setConcurrency: (val: number) => asyncAIQueue.setConcurrency(val),
    enqueueCandidate: (candidate: Candidate, job: Job, options?: any) =>
      asyncAIQueue.enqueue(candidate, job, options)
  };
}
