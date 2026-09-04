import { useState, useEffect } from 'react';
import { Job } from '@/types/hiresort';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, DEFAULT_ZOOL_CLIENT } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIBadge } from '@/components/ui/ai-badges';
import { JobDescriptionModal } from './JobDescriptionModal';
import { JobEmbedModal } from '@/components/ats/JobEmbedModal';
import { CreateJobModal } from '@/components/ats/CreateJobModal';
import { useToast } from '@/components/ui/use-toast';
import samplePayload from '../../../samples/ats_import_payload.json';
import { 
  Briefcase, 
  MapPin, 
  Users, 
  Calendar,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle2,
  FileText,
  RefreshCw,
  Loader2,
  Code2,
  Plus,
  Globe,
  Trash2,
  Building2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface JobDashboardProps {
  onSelectJob: (job: Job) => void;
  onEnableHireSort: (job: Job) => void;
}

export function JobDashboard({ onSelectJob, onEnableHireSort }: JobDashboardProps) {
  const { client, clientId } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobForJD, setSelectedJobForJD] = useState<Job | null>(null);
  const [showJDModal, setShowJDModal] = useState(false);
  const [selectedJobForEmbed, setSelectedJobForEmbed] = useState<Job | null>(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState(false);
  const [importingSample, setImportingSample] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { toast } = useToast();

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    setDeletingJob(true);
    try {
      // 1. Delete associated candidates first
      await supabase.from('candidates').delete().eq('job_id', jobToDelete.id);

      // 2. Delete the job from Supabase
      const { error } = await supabase.from('jobs').delete().eq('id', jobToDelete.id);
      if (error) throw error;

      // 3. Clear from mock localStorage if present
      try {
        const rawMock = localStorage.getItem('hiremate_mock_jobs');
        if (rawMock) {
          const parsed = JSON.parse(rawMock);
          const cleaned = parsed.filter((j: any) => j.id !== jobToDelete.id);
          localStorage.setItem('hiremate_mock_jobs', JSON.stringify(cleaned));
        }
      } catch (e) {}

      // 4. Update state
      setJobs(prev => prev.filter(j => j.id !== jobToDelete.id));

      toast({
        title: 'Job Deleted',
        description: `"${jobToDelete.title || 'Job'}" has been permanently removed.`,
      });
      setJobToDelete(null);
    } catch (err: any) {
      console.error('Delete job error:', err);
      toast({
        title: 'Failed to Delete Job',
        description: err.message || 'Could not delete the job.',
        variant: 'destructive',
      });
    } finally {
      setDeletingJob(false);
    }
  };

  const seedDefaultJobsIfEmpty = async () => {
    try {
      const firstThreeJobs = samplePayload.jobs.slice(0, 3);
      for (const job of firstThreeJobs) {
        await supabase
          .from('jobs')
          .upsert({
            id: job.id,
            title: job.title,
            department: job.department,
            location: job.location,
            type: job.type,
            salary: job.salary,
            description: job.description,
            requirements: job.requirements || [],
            responsibilities: job.responsibilities || [],
            nice_to_have: job.niceToHave || [],
            hire_sort_enabled: true,
            ai_processing_status: 'complete',
            last_ranked_at: new Date().toISOString(),
            client_id: DEFAULT_ZOOL_CLIENT.id
          });
      }

      const firstThreeCandidates = samplePayload.candidates.filter(c => 
        c.job_id === '11111111-1111-1111-1111-111111111111' ||
        c.job_id === '22222222-2222-2222-2222-222222222222' ||
        c.job_id === '33333333-3333-3333-3333-333333333333'
      );

      for (const cand of firstThreeCandidates) {
        let score = 'medium';
        let similarity = 0.65;
        if (cand.full_name.includes('Priya') || cand.full_name.includes('David') || cand.full_name.includes('Elena')) {
          score = 'high';
          similarity = 0.88;
        } else if (cand.full_name.includes('Amit') || cand.full_name.includes('Sofia') || cand.full_name.includes('Hiroshi')) {
          score = 'low';
          similarity = 0.42;
        }

        await supabase
          .from('candidates')
          .upsert({
            job_id: cand.job_id,
            full_name: cand.full_name,
            email: cand.email,
            experience: cand.experience || 0,
            ai_score: score,
            cosine_similarity: similarity,
            resume_text: cand.resume_text,
            skills: cand.resume_text.match(/Skills: (.*)/)?.[1]?.split(', ') || [],
            matched_skills: cand.resume_text.match(/Skills: (.*)/)?.[1]?.split(', ')?.slice(0, 3) || [],
            client_id: DEFAULT_ZOOL_CLIENT.id,
            predictive_insights: {
              interviewPassProb: score === 'high' ? 92 : (score === 'medium' ? 78 : 45),
              offerAcceptanceProb: score === 'high' ? 88 : (score === 'medium' ? 70 : 50),
              onboardingSuccessProb: score === 'high' ? 95 : (score === 'medium' ? 82 : 60),
              retentionRisk: score === 'high' ? 'low' : (score === 'medium' ? 'medium' : 'high'),
              retentionRiskFactor: score === 'high' ? 'Stable 3+ year average tenure' : 'Previous short tenure',
              timeToJoinEstimate: score === 'high' ? '15 days' : '30 days',
              assessment: `${cand.full_name} has strong experience alignment for this position. Mapped skills match job requirements.`
            }
          });
      }
    } catch (err) {
      console.error("Auto-seeding default jobs failed:", err);
    }
  };

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        let query = supabase.from('jobs').select('*');
        if (clientId) {
          query = query.eq('client_id', clientId);
        }
        let { data: jobData } = await query;
        
        // Auto-seed default jobs ONLY if on default Zool tenant and it has 0 jobs
        if ((!jobData || jobData.length === 0) && clientId === DEFAULT_ZOOL_CLIENT.id) {
          await seedDefaultJobsIfEmpty();
          const { data: reloaded } = await supabase.from('jobs').select('*').eq('client_id', clientId);
          jobData = reloaded;
        }

        // Auto-cleanup existing duplicates in the background
        const { data: allCands } = await supabase.from('candidates').select('id, email, job_id');
        if (allCands) {
          const seen = new Set();
          const toDelete = [];
          for (const c of allCands) {
            const key = `${c.email}-${c.job_id}`;
            if (seen.has(key)) {
              toDelete.push(c.id);
            } else {
              seen.add(key);
            }
          }
          if (toDelete.length > 0) {
            console.log(`Cleaning up ${toDelete.length} duplicate candidates...`);
            for (let i = 0; i < toDelete.length; i += 50) {
               await supabase.from('candidates').delete().in('id', toDelete.slice(i, i + 50));
            }
          }
        }

        const { data: candData } = await supabase.from('candidates').select('job_id');

        if (jobData && jobData.length > 0) {
          // Clean up any phantom/empty jobs from mock localStorage cache
          try {
            const rawMock = localStorage.getItem('hiremate_mock_jobs');
            if (rawMock) {
              const parsed = JSON.parse(rawMock);
              const cleaned = parsed.filter((j: any) => j.title && j.title.trim().length > 0);
              if (cleaned.length !== parsed.length) {
                localStorage.setItem('hiremate_mock_jobs', JSON.stringify(cleaned));
              }
            }
          } catch (e) {}

          const mappedJobs = jobData
            .filter((j: any) => j.title && j.title.trim().length > 0)
            .map((j: any) => {
              const count = candData ? candData.filter((c: any) => c.job_id === j.id).length : 0;
              const isExpired = j.expires_at ? new Date(j.expires_at) < new Date() : false;
              const resolvedStatus = isExpired ? 'inactive' : (j.status || 'active');

              if (isExpired && j.status !== 'inactive') {
                supabase.from('jobs').update({ status: 'inactive' }).eq('id', j.id).then();
              }

              return {
                id: j.id,
                title: j.title,
                department: j.department || 'Engineering',
                location: j.location || 'Remote',
                type: j.type || 'full-time',
                salary: j.salary,
                description: j.description || '',
                responsibilities: j.responsibilities || [],
                requirements: j.requirements || [],
                niceToHave: j.nice_to_have || j.niceToHave || [],
                hireSortEnabled: j.hire_sort_enabled ?? j.hireSortEnabled,
                aiProcessingStatus: j.ai_processing_status || j.aiProcessingStatus,
                lastRankedAt: j.last_ranked_at || j.lastRankedAt,
                candidateCount: count,
                isPublic: j.is_public ?? j.isPublic,
                slug: j.slug,
                status: resolvedStatus,
                expiresAt: j.expires_at || undefined,
                postedDate: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
              };
            });
          setJobs(mappedJobs);
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error("Failed fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [clientId]);

  const handleViewJD = (job: Job) => {
    setSelectedJobForJD(job);
    setShowJDModal(true);
  };

  const handleToggleJobStatus = async (job: Job) => {
    const isCurrentlyActive = job.status === 'active' || job.status === 'published' || !job.status;
    const nextStatus = isCurrentlyActive ? 'inactive' : 'active';

    // If reactivating an expired job, extend expiry by 30 days
    const isExpired = job.expiresAt ? new Date(job.expiresAt) < new Date() : false;
    const nextExpiresAt = (!isCurrentlyActive && isExpired)
      ? new Date(Date.now() + 30 * 86400000).toISOString()
      : job.expiresAt;

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: nextStatus,
          expires_at: nextExpiresAt || null,
        })
        .eq('id', job.id);

      if (error) throw error;

      setJobs(prev => prev.map(j => {
        if (j.id === job.id) {
          return {
            ...j,
            status: nextStatus,
            expiresAt: nextExpiresAt,
          };
        }
        return j;
      }));

      toast({
        title: nextStatus === 'active' ? '🟢 Job Posting Activated' : '🔴 Job Marked Inactive',
        description: nextStatus === 'active'
          ? `"${job.title}" is now active and published for applications.`
          : `"${job.title}" is now inactive. Candidate applications are closed.`,
      });
    } catch (err: any) {
      toast({
        title: 'Status Update Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleImportSample = async () => {
    setImportingSample(true);
    setLoading(true);
    try {
      // Only import the last 2 jobs (Full Stack Developer and Marketing Manager) via the webhook sync simulation
      const importedJobs = samplePayload.jobs.slice(3);
      const importedCandidates = samplePayload.candidates.filter(c => 
        c.job_id === 'e98c56c2-0731-482a-bc91-236b2f42a11b' ||
        c.job_id === 'f87b45b1-0620-471a-ab80-125a1e31a00a'
      );

      // 1. Ingest Jobs
      for (const job of importedJobs) {
        const { error: jobError } = await supabase
          .from('jobs')
          .upsert({
            id: job.id,
            title: job.title,
            department: job.department,
            location: job.location,
            type: job.type,
            salary: job.salary,
            description: job.description,
            requirements: job.requirements || [],
            responsibilities: job.responsibilities || [],
            nice_to_have: job.niceToHave || [],
            hire_sort_enabled: false,
            ai_processing_status: 'pending',
            client_id: clientId || DEFAULT_ZOOL_CLIENT.id
          });

        if (jobError) throw jobError;
      }

      // 2. Ingest Candidates
      for (const cand of importedCandidates) {
        // Check for existing candidate to prevent duplicates
        const { data: existingCand } = await supabase
          .from('candidates')
          .select('id')
          .eq('email', cand.email)
          .eq('job_id', cand.job_id)
          .maybeSingle();

        let candData = existingCand;

        if (!existingCand) {
          const { data: newCand, error: dbError } = await supabase
            .from('candidates')
            .insert({
              job_id: cand.job_id,
              full_name: cand.full_name,
              email: cand.email,
              experience: cand.experience || 0,
              ai_score: 'medium',
              client_id: clientId || DEFAULT_ZOOL_CLIENT.id
            })
            .select()
            .single();

          if (dbError) throw dbError;
          candData = newCand;
        }

        if (candData) {
          // Trigger Edge Function (non-blocking)
          supabase.functions.invoke('ingest-resume', {
            body: {
              candidateId: candData.id,
              resumeText: cand.resume_text,
              jobId: cand.job_id
            }
          }).catch(e => console.warn("Failed invoking edge function:", e));
        }
      }

      toast({
        title: "Sample Imported Successfully",
        description: `Imported ${importedJobs.length} Jobs and ${importedCandidates.length} Candidates to Supabase.`
      });

      // Reload jobs for current tenant
      let reloadQuery = supabase.from('jobs').select('*');
      if (clientId) {
        reloadQuery = reloadQuery.eq('client_id', clientId);
      }
      const { data: jobData } = await reloadQuery;
      const { data: candData } = await supabase.from('candidates').select('job_id');
      
      if (jobData && jobData.length > 0) {
        const mappedJobs = jobData.map((j: any) => {
          const count = candData ? candData.filter((c: any) => c.job_id === j.id).length : 0;
          return {
            id: j.id,
            title: j.title,
            department: j.department,
            location: j.location,
            type: j.type,
            salary: j.salary,
            description: j.description,
            responsibilities: j.responsibilities || [],
            requirements: j.requirements || [],
            niceToHave: j.nice_to_have || [],
            hireSortEnabled: j.hire_sort_enabled,
            aiProcessingStatus: j.ai_processing_status,
            lastRankedAt: j.last_ranked_at,
            candidateCount: count
          };
        });
        setJobs(mappedJobs);
      } else {
        setJobs([]);
      }
    } catch (err: any) {
      console.error("Import sample failed:", err);
      toast({
        title: "Import Failed",
        description: err.message || "Failed to import sample jobs",
        variant: "destructive",
      });
    } finally {
      setImportingSample(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse text-sm">Loading active jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-2xl font-semibold text-foreground">Active Jobs & ATS</h2>
            {client && (
              <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-primary/30 text-primary bg-primary/5 font-medium">
                <Building2 className="w-3 h-3 mr-1" />
                {client.name}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Manage your job postings, candidate pipelines, and public web embed listings for {client?.name || 'this workspace'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            onClick={handleImportSample} 
            disabled={importingSample}
            className="flex items-center gap-2"
          >
            {importingSample ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing ATS...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync with ATS
              </>
            )}
          </Button>

          <Button 
            onClick={() => setShowCreateModal(true)}
            className="gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 bg-muted/40 p-1 rounded-lg w-fit border border-border">
        <Button
          variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter('all')}
          className="text-xs h-7 px-3"
        >
          All Postings ({jobs.length})
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter('active')}
          className="text-xs h-7 px-3 text-emerald-600 dark:text-emerald-400"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Active ({jobs.filter(j => (j.status === 'active' || j.status === 'published' || !j.status) && !(j.expiresAt && new Date(j.expiresAt) < new Date())).length})
        </Button>
        <Button
          variant={statusFilter === 'inactive' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter('inactive')}
          className="text-xs h-7 px-3 text-rose-600 dark:text-rose-400"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
          Inactive / Expired ({jobs.filter(j => j.status === 'inactive' || j.status === 'closed' || (j.expiresAt && new Date(j.expiresAt) < new Date())).length})
        </Button>
      </div>

      {/* Jobs Grid / Empty State */}
      {jobs.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-dashed border-border p-8">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No Active Jobs for {client?.name || 'this Workspace'}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            This workspace is brand new. Post a new custom job opening with ATS screening questions, or import sample data to get started.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Post First Job
            </Button>
            <Button 
              variant="outline"
              onClick={handleImportSample} 
              disabled={importingSample}
            >
              {importingSample ? "Importing sample..." : "Import Sample Webhook Data"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs
            .filter(j => {
              const isExp = j.expiresAt ? new Date(j.expiresAt) < new Date() : false;
              const isAct = (j.status === 'active' || j.status === 'published' || !j.status) && !isExp;
              if (statusFilter === 'active') return isAct;
              if (statusFilter === 'inactive') return !isAct;
              return true;
            })
            .map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                onSelect={() => onSelectJob(job)}
                onEnableHireSort={() => onEnableHireSort(job)}
                onViewJD={() => handleViewJD(job)}
                onToggleStatus={() => handleToggleJobStatus(job)}
                onEmbed={() => {
                  setSelectedJobForEmbed(job);
                  setShowEmbedModal(true);
                }}
                onDelete={() => setJobToDelete(job)}
              />
            ))}
        </div>
      )}

      {/* JD Modal */}
      <JobDescriptionModal 
        job={selectedJobForJD}
        open={showJDModal}
        onOpenChange={setShowJDModal}
      />

      {/* Embed / Share Modal */}
      <JobEmbedModal
        job={selectedJobForEmbed}
        open={showEmbedModal}
        onOpenChange={setShowEmbedModal}
        onJobUpdated={(updated) => {
          setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
        }}
      />

      {/* Create Job Modal */}
      <CreateJobModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onJobCreated={(newJob) => {
          setJobs(prev => [newJob, ...prev]);
        }}
      />

      {/* Delete Job Confirmation Dialog */}
      <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Job Posting?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{jobToDelete?.title || 'this role'}"</strong>? This will permanently remove the job posting, its public careers listing, and all associated candidate records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingJob}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              disabled={deletingJob}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deletingJob ? 'Deleting...' : 'Delete Job'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface JobCardProps {
  job: Job;
  onSelect: () => void;
  onEnableHireSort: () => void;
  onViewJD: () => void;
  onEmbed: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

function JobCard({ job, onSelect, onEnableHireSort, onViewJD, onEmbed, onDelete, onToggleStatus }: JobCardProps) {
  const isExpired = job.expiresAt ? new Date(job.expiresAt) < new Date() : false;
  const isActive = (job.status === 'active' || job.status === 'published' || !job.status) && !isExpired;

  const getAIStatusDisplay = () => {
    if (!job.hireSortEnabled) {
      return null;
    }
    
    switch (job.aiProcessingStatus) {
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-ai-accent">
              <Clock className="w-4 h-4 animate-pulse-soft" />
              <span className="font-medium">Ranking in progress...</span>
            </div>
            <div className="w-24 h-1.5 bg-ai-surface rounded-full overflow-hidden">
              <div 
                className="h-full bg-ai-accent rounded-full transition-all duration-500"
                style={{ width: `${job.aiProcessingProgress || 0}%` }}
              />
            </div>
            <span className="text-muted-foreground text-xs">{job.aiProcessingProgress}%</span>
          </div>
        );
      case 'complete':
        return (
          <div className="flex items-center gap-1.5 text-success text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">Ranked</span>
            <span className="text-muted-foreground ml-1">• Updated {job.lastRankedAt}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "bg-card border rounded-xl p-5 hover:shadow-card-hover transition-all duration-200 group",
      isActive ? "border-border" : "border-border/60 opacity-85 bg-muted/20"
    )}>
      <div className="flex items-start justify-between gap-4">
        {/* Left: Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {job.title}
            </h3>

            {/* Status Badge & Interactive Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus();
              }}
              className={cn(
                "px-2.5 py-0.5 text-[11px] font-semibold rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs",
                isActive 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300" 
                  : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300"
              )}
              title={isActive ? "Click to manually make job Inactive" : "Click to Reactivate job"}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-rose-500")} />
              {isActive ? "Active" : isExpired ? "Expired / Inactive" : "Inactive"}
              <span className="text-[9px] opacity-70 underline ml-0.5 font-normal">
                {isActive ? "(Set Inactive)" : "(Reactivate)"}
              </span>
            </button>

            {job.hireSortEnabled && <AIBadge size="sm" />}
            {job.isPublic && (
              <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 flex items-center gap-1 font-medium">
                <Globe className="w-3 h-3" /> Public Careers
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              {job.department}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Posted {job.postedDate}
            </span>
            {job.expiresAt && (
              <span className={cn(
                "flex items-center gap-1.5",
                isExpired ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-muted-foreground"
              )}>
                <Clock className="w-4 h-4" />
                {isExpired ? `Expired on ${new Date(job.expiresAt).toLocaleDateString()}` : `Expires ${new Date(job.expiresAt).toLocaleDateString()}`}
              </span>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onViewJD();
              }}
              className="flex items-center gap-1.5 text-primary hover:underline cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              View JD
            </button>
          </div>

          {/* AI Status */}
          {getAIStatusDisplay()}
        </div>

        {/* Right: Candidate Count & Actions */}
        <div className="flex flex-col items-end gap-3">
          {/* Candidate Count */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-semibold text-foreground">{job.candidateCount}</span>
            <span className="text-sm text-muted-foreground">candidates</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEmbed();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Code2 className="w-4 h-4 mr-1 text-primary" />
              Embed & Share
            </Button>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete Job"
            >
              <Trash2 className="w-4 h-4 mr-1 text-destructive/80" />
              Delete
            </Button>

            {job.hireSortEnabled ? (
              <Button 
                variant="outline" 
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnableHireSort();
                }}
              >
                <Sparkles className="w-4 h-4 mr-1 text-ai-accent" />
                Re-enable HireSortAi
              </Button>
            ) : (
              <Button 
                variant="ai" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnableHireSort();
                }}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Enable HireSortAi
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSelect}
              className="group-hover:border-primary group-hover:text-primary"
            >
              View Candidates
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
