import { useState, useEffect } from 'react';
import { Job } from '@/types/hiresort';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AIBadge } from '@/components/ui/ai-badges';
import { JobDescriptionModal } from './JobDescriptionModal';
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
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobDashboardProps {
  onSelectJob: (job: Job) => void;
  onEnableHireSort: (job: Job) => void;
}

export function JobDashboard({ onSelectJob, onEnableHireSort }: JobDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobForJD, setSelectedJobForJD] = useState<Job | null>(null);
  const [showJDModal, setShowJDModal] = useState(false);
  const [importingSample, setImportingSample] = useState(false);
  const { toast } = useToast();

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
            last_ranked_at: new Date().toISOString()
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
        let { data: jobData } = await supabase.from('jobs').select('*');
        
        // Auto-seed default jobs if database starts empty
        if (!jobData || jobData.length === 0) {
          await seedDefaultJobsIfEmpty();
          const { data: reloaded } = await supabase.from('jobs').select('*');
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
              candidateCount: count,
              postedDate: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            };
          });
          setJobs(mappedJobs);
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error("Error loading jobs in dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const handleViewJD = (job: Job) => {
    setSelectedJobForJD(job);
    setShowJDModal(true);
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
            ai_processing_status: 'pending'
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
              ai_score: 'medium'
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

      // Reload jobs
      const { data: jobData } = await supabase.from('jobs').select('*');
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
        description: err.message || "Could not complete import.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setImportingSample(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
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
          <h2 className="text-2xl font-semibold text-foreground mb-1">Active Jobs</h2>
          <p className="text-muted-foreground">
            Manage your job postings and review candidates
          </p>
        </div>
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
      </div>

      {/* Jobs Grid / Empty State */}
      {jobs.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-dashed border-border p-8">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No Active Jobs Yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            You can upload a custom ATS webhook payload in Settings, or click below to import the default template payload instantly.
          </p>
          <Button 
            onClick={handleImportSample} 
            disabled={importingSample}
            className="mt-2"
          >
            {importingSample ? "Importing sample..." : "Import Sample Webhook Data (1-Click)"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              onSelect={() => onSelectJob(job)}
              onEnableHireSort={() => onEnableHireSort(job)}
              onViewJD={() => handleViewJD(job)}
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
    </div>
  );
}

interface JobCardProps {
  job: Job;
  onSelect: () => void;
  onEnableHireSort: () => void;
  onViewJD: () => void;
}

function JobCard({ job, onSelect, onEnableHireSort, onViewJD }: JobCardProps) {
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
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-card-hover transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {job.title}
            </h3>
            {job.hireSortEnabled && <AIBadge size="sm" />}
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
            {job.screeningEndDate && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Screening ends {job.screeningEndDate}
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
            {!job.hireSortEnabled && (
              <Button 
                variant="ai" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnableHireSort();
                }}
              >
                <Sparkles className="w-4 h-4" />
                Enable Hiresort GenAI
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
