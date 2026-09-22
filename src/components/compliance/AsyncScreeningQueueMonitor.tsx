import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Cpu, 
  Layers, 
  Coins, 
  Play, 
  Pause, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Activity
} from 'lucide-react';
import { useAsyncScreeningQueue, ScreeningJob } from '@/lib/async-ai-queue';
import { useToast } from '@/hooks/use-toast';

export function AsyncScreeningQueueMonitor() {
  const { toast } = useToast();
  const {
    metrics,
    jobs,
    isPaused,
    pauseQueue,
    resumeQueue,
    retryFailed,
    clearCompleted,
    setConcurrency,
    enqueueCandidate
  } = useAsyncScreeningQueue();

  const [isSimulating, setIsSimulating] = useState(false);

  // Quick interactive test to enqueue simulated candidates
  const handleSimulateBatch = async () => {
    setIsSimulating(true);
    const demoCandidates = [
      { id: 'sim-1', name: 'Sophia Chen', role_title: 'Staff Frontend Engineer' },
      { id: 'sim-2', name: 'Marcus Vance', role_title: 'Full Stack Tech Lead' },
      { id: 'sim-3', name: 'Elena Rostova', role_title: 'Backend Systems Architect' }
    ];

    const demoJob = {
      id: 'job-platform-arch',
      title: 'Platform Infrastructure Lead',
      department: 'Cloud Engineering',
      location: 'Remote',
      type: 'full-time',
      requirements: ['TypeScript', 'Kubernetes', 'Go', 'PostgreSQL', 'Microservices'],
      responsibilities: ['Architecture roadmap', 'Team mentoring'],
      postedDate: '2026-02-15',
      candidateCount: 12,
      isPublic: true
    };

    try {
      for (const cand of demoCandidates) {
        await enqueueCandidate(
          {
            ...cand,
            email: `${cand.name.toLowerCase().replace(' ', '.')}@example.com`,
            experience: 8,
            company: 'Nexus Tech',
            applied_for: demoJob.id,
            match_score: 90,
            skills: ['TypeScript', 'Kubernetes', 'Go'],
            status: 'new',
            created_at: new Date().toISOString()
          },
          demoJob,
          {
            priority: cand.id === 'sim-1' ? 'urgent' : 'standard',
            resumeText: `${cand.name} is an experienced ${cand.role_title} with 8+ years leading cloud infrastructure, microservices, TypeScript, Go, and Kubernetes.`
          }
        );
      }

      toast({
        title: 'Batch Queued for Async Processing',
        description: '3 candidates added to the background evaluation queue with rate-limit protection.',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const getPriorityBadge = (priority: ScreeningJob['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs uppercase font-mono">Urgent</Badge>;
      case 'batch':
        return <Badge variant="outline" className="text-xs uppercase font-mono text-muted-foreground">Batch</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs uppercase font-mono">Standard</Badge>;
    }
  };

  const getStatusBadge = (status: ScreeningJob['status']) => {
    switch (status) {
      case 'queued':
        return (
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" /> Queued
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20 flex items-center gap-1">
            <Activity className="w-3 h-3 animate-pulse" /> Processing
          </Badge>
        );
      case 'cached':
        return (
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" /> Cached (0 Tokens)
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Failed
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                Async AI Processing & Cost-Optimization Engine
              </CardTitle>
              <CardDescription className="mt-1">
                Controlled worker concurrency, rate-limit protection (HTTP 429 prevention), and token deduplication caching.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isPaused ? "default" : "outline"}
                size="sm"
                onClick={isPaused ? resumeQueue : pauseQueue}
                className="gap-1.5"
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume Processing' : 'Pause Queue'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateBatch}
                disabled={isSimulating}
                className="gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Simulate Batch (3x)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Active Workers */}
            <div className="p-4 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1.5">
                <span>Active Workers</span>
                <Cpu className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {metrics.activeWorkers} / {metrics.maxWorkers}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Concurrency:</span>
                {[1, 2, 3, 5].map(c => (
                  <button
                    key={c}
                    onClick={() => setConcurrency(c)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      metrics.maxWorkers === c
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {c}x
                  </button>
                ))}
              </div>
            </div>

            {/* Queue Depth */}
            <div className="p-4 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1.5">
                <span>Queue Backlog</span>
                <Layers className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {metrics.queuedCount}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {metrics.queuedCount > 0 ? 'Evaluating with priority ordering' : 'Queue idle (0 pending)'}
              </p>
            </div>

            {/* Tokens Saved */}
            <div className="p-4 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1.5">
                <span>Tokens Saved</span>
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
                {metrics.estimatedTokensSaved.toLocaleString()}
              </div>
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                {metrics.cachedCount} cache hits (deduplicated)
              </p>
            </div>

            {/* USD Saved */}
            <div className="p-4 rounded-xl bg-background/60 border border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1.5">
                <span>Cost Reduction</span>
                <Coins className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary tracking-tight font-mono">
                ${metrics.estimatedCostSavedUsd.toFixed(4)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Avg. latency: {metrics.averageLatencyMs > 0 ? `${metrics.averageLatencyMs}ms` : '<5ms (cache)'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Job Stream Card */}
      <Card className="border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Background Evaluation Stream
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time dispatch log across active, queued, cached, and completed evaluation tasks.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={retryFailed}
              disabled={metrics.failedCount === 0}
              className="h-8 text-xs gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Failed ({metrics.failedCount})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
              disabled={jobs.filter(j => j.status === 'completed' || j.status === 'cached').length === 0}
              className="h-8 text-xs gap-1 text-muted-foreground"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Completed
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl border-border/60">
              <Layers className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Screening queue is empty</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                New candidate applications and recruiter re-screenings will appear here with asynchronous execution.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateBatch}
                className="mt-4 text-xs gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Enqueue Test Candidates
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Target Role</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Score & Match</th>
                    <th className="py-2.5 px-3">Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {job.candidateName}
                        <span className="block text-[11px] text-muted-foreground font-mono">
                          {job.id}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-xs">
                        {job.jobTitle}
                      </td>
                      <td className="py-2.5 px-3">
                        {getPriorityBadge(job.priority)}
                      </td>
                      <td className="py-2.5 px-3">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="py-2.5 px-3">
                        {job.result ? (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize font-semibold ${
                                job.result.score === 'high'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : job.result.score === 'medium'
                                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              }`}
                            >
                              {job.result.score} Match
                            </Badge>
                            {job.result.similarity !== null && (
                              <span className="text-xs font-mono text-muted-foreground">
                                {Math.round(job.result.similarity * 100)}%
                              </span>
                            )}
                          </div>
                        ) : job.error ? (
                          <span className="text-xs text-destructive truncate max-w-[180px] block" title={job.error}>
                            {job.error}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">In queue...</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-xs font-mono text-muted-foreground">
                        {job.tokensSaved ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            +{job.tokensSaved.toLocaleString()} tok
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
