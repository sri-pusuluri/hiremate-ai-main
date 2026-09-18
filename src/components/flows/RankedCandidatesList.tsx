import { useState, useMemo, useEffect } from 'react';
import { Candidate, Job } from '@/types/hiresort';
import { mockCandidates } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { getAppBaseUrl } from '@/lib/app-url';
import { Button } from '@/components/ui/button';
import { AIBadge, RankBadge, RelevanceLabel, OverrideIndicator } from '@/components/ui/ai-badges';
import { ResumeViewerModal } from './ResumeViewerModal';
import { JobDescriptionModal } from './JobDescriptionModal';
import { AddCandidateModal } from './AddCandidateModal';
import { analyzeCandidateWithAI } from '@/lib/ai-screening';
import { 
  ArrowUpDown, 
  GripVertical, 
  Pin, 
  ArrowUp, 
  ArrowDown,
  ArrowLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Sparkles,
  RefreshCw,
  FileText,
  Users,
  Database,
  Clock,
  Info,
  ExternalLink,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RankedCandidatesListProps {
  onSelectCandidate: (candidate: Candidate) => void;
  onCreateShortlist: (candidates: Candidate[]) => void;
  selectedJob?: Job;
  onBack?: () => void;
}

type SortMode = 'ai-rank' | 'name' | 'experience' | 'date';
type FilterMode = 'all' | 'high' | 'medium' | 'low';
type CandidateTab = 'all' | 'applied' | 'talent-pool';

export function RankedCandidatesList({ onSelectCandidate, onCreateShortlist, selectedJob, onBack }: RankedCandidatesListProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('ai-rank');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [resumeCandidate, setResumeCandidate] = useState<Candidate | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showJDModal, setShowJDModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<CandidateTab>('all');
  const [isReanalyzingAll, setIsReanalyzingAll] = useState(false);
  const [reanalyzingProgress, setReanalyzingProgress] = useState<{ current: number; total: number } | null>(null);
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCandidates() {
      const targetJobId = selectedJob?.id || (selectedJob as any)?._id;
      if (!targetJobId) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .eq('job_id', targetJobId);

        if (!error && data && data.length > 0) {
          const mapped: Candidate[] = data.map((c: any, index: number) => ({
            id: c.id,
            jobId: c.job_id,
            name: c.full_name,
            email: c.email,
            phone: c.phone || '',
            experience: c.experience,
            location: c.location || 'Remote',
            appliedDate: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            matchedSkills: (() => {
              const ms = c.matched_skills || c.matchedSkills || [];
              if (ms.length > 0) return ms;
              if (c.resume_text) {
                const match = c.resume_text.match(/Skills:\s*([^\n]+)/i);
                if (match) return match[1].split(',').map((s: string) => s.trim().replace(/\.$/, ''));
              }
              return [];
            })(),
            missingSkills: (() => {
              const ms = c.missing_skills || c.missingSkills || [];
              if (ms.length > 0) return ms;
              return [];
            })(),
            evaluationStatus: (c.cosine_similarity === null && c.cosineSimilarity === null)
              ? 'pending'
              : ((c.predictive_insights as any)?.isUnprocessed ? 'failed' : 'completed'),
            evaluationError: (c.predictive_insights as any)?.error,
            aiScore: (c.cosine_similarity !== null && c.cosine_similarity !== undefined) 
              ? c.ai_score 
              : ((c.cosineSimilarity !== null && c.cosineSimilarity !== undefined) ? c.aiScore : 'pending'),
            cosineSimilarity: (c.cosine_similarity !== null && c.cosine_similarity !== undefined) 
              ? c.cosine_similarity 
              : ((c.cosineSimilarity !== null && c.cosineSimilarity !== undefined) ? c.cosineSimilarity : null),
            predictiveInsights: (() => {
              const pi = c.predictive_insights || c.predictiveInsights || {};
              const score = c.ai_score || c.aiScore || 'medium';
              // Backfill missing fields for old DB records that predate these columns
              return {
                interviewPassProb: pi.interviewPassProb ?? (score === 'high' ? 82 : score === 'medium' ? 65 : 45),
                offerAcceptanceProb: pi.offerAcceptanceProb ?? (score === 'high' ? 78 : score === 'medium' ? 60 : 40),
                onboardingSuccessProb: pi.onboardingSuccessProb ?? (score === 'high' ? 92 : score === 'medium' ? 78 : 55),
                retentionRisk: pi.retentionRisk ?? (score === 'high' ? 'low' : score === 'medium' ? 'medium' : 'high'),
                retentionRiskFactor: pi.retentionRiskFactor || (score === 'high' ? 'Strong role alignment' : 'Flight risk based on tenure history'),
                timeToJoinEstimate: pi.timeToJoinEstimate || (score === 'high' ? '15-30 Days' : '30-45 Days'),
                assessment: pi.assessment,
                isUnprocessed: Boolean(pi.isUnprocessed),
                error: pi.error || null
              };
            })(),
            aiExplanation: (c.predictive_insights as any)?.assessment || c.aiExplanation || '',
            isPinned: Boolean(c.is_pinned),
            company: (c as any).company || (c.predictive_insights as any)?.company || 'Independent',
            currentRole: (c as any).role_title || (c.predictive_insights as any)?.currentRole || c.current_role || 'Software Engineer',
            resumeText: c.resume_text || c.resumeText || '',
            resumeUrl: c.resume_url || c.resumeUrl || null,
            source: c.source || (c.email.length % 3 === 0 ? 'talent-pool' : 'applied')
          }));
          setCandidates(mapped);
        } else {
          setCandidates([]);
        }
      } catch (err) {
        console.error("Error loading candidates from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCandidates();
  }, [selectedJob]);

  const handleReanalyzeSingleCandidate = async (cand: Candidate) => {
    if (!selectedJob) return;
    setReanalyzingId(cand.id);
    try {
      const result = await analyzeCandidateWithAI(
        {
          id: cand.id,
          name: cand.name,
          resumeText: cand.resumeText,
          resumeUrl: cand.resumeUrl,
          currentRole: cand.currentRole,
          company: cand.company
        },
        selectedJob
      );

      if (result && !result.isUnprocessed) {
        setCandidates(prev => prev.map(c => {
          if (c.id !== cand.id) return c;
          return {
            ...c,
            aiScore: result.score,
            cosineSimilarity: result.similarity,
            matchedSkills: result.matchedSkills,
            missingSkills: result.missingSkills,
            evaluationStatus: 'completed',
            evaluationError: undefined,
            currentRole: result.currentRole || c.currentRole,
            company: result.company || c.company,
            predictiveInsights: {
              ...(c.predictiveInsights || {} as any),
              interviewPassProb: result.interviewPassProb,
              offerAcceptanceProb: result.offerAcceptanceProb,
              onboardingSuccessProb: result.onboardingSuccessProb,
              retentionRisk: result.retentionRisk,
              retentionRiskFactor: result.retentionRiskFactor,
              timeToJoinEstimate: result.timeToJoinEstimate,
              assessment: result.assessment,
              provider: result.provider,
              model: result.model,
              executionMode: result.executionMode,
              isUnprocessed: false,
              error: null
            }
          };
        }));

        toast({
          title: "Profile Re-analyzed ✨",
          description: `${cand.name} evaluated: ${Math.round((result.similarity || 0) * 100)}% match score.`,
        });
      } else {
        toast({
          title: "Screening Incomplete",
          description: result?.error || "Could not complete evaluation.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error("Single re-analyze error:", err);
      toast({
        title: "Error Re-analyzing Candidate",
        description: err.message || "Failed to re-screen candidate.",
        variant: "destructive"
      });
    } finally {
      setReanalyzingId(null);
    }
  };

  const handleReanalyzeAllCandidates = async () => {
    if (!selectedJob || candidates.length === 0 || isReanalyzingAll) return;
    setIsReanalyzingAll(true);
    setReanalyzingProgress({ current: 0, total: candidates.length });

    let successCount = 0;
    try {
      for (let i = 0; i < candidates.length; i++) {
        const cand = candidates[i];
        setReanalyzingProgress({ current: i + 1, total: candidates.length });
        try {
          const result = await analyzeCandidateWithAI(
            {
              id: cand.id,
              name: cand.name,
              resumeText: cand.resumeText,
              resumeUrl: cand.resumeUrl,
              currentRole: cand.currentRole,
              company: cand.company
            },
            selectedJob
          );

          if (result && !result.isUnprocessed) {
            successCount++;
            setCandidates(prev => prev.map(c => {
              if (c.id !== cand.id) return c;
              return {
                ...c,
                aiScore: result.score,
                cosineSimilarity: result.similarity,
                matchedSkills: result.matchedSkills,
                missingSkills: result.missingSkills,
                evaluationStatus: 'completed',
                evaluationError: undefined,
                currentRole: result.currentRole || c.currentRole,
                company: result.company || c.company,
                predictiveInsights: {
                  ...(c.predictiveInsights || {} as any),
                  interviewPassProb: result.interviewPassProb,
                  offerAcceptanceProb: result.offerAcceptanceProb,
                  onboardingSuccessProb: result.onboardingSuccessProb,
                  retentionRisk: result.retentionRisk,
                  retentionRiskFactor: result.retentionRiskFactor,
                  timeToJoinEstimate: result.timeToJoinEstimate,
                  assessment: result.assessment,
                  provider: result.provider,
                  model: result.model,
                  executionMode: result.executionMode,
                  isUnprocessed: false,
                  error: null
                }
              };
            }));
          }
        } catch (e) {
          console.warn(`Error re-analyzing candidate ${cand.name}:`, e);
        }
      }

      toast({
        title: "Batch Re-analysis Complete ✨",
        description: `Successfully re-analyzed ${successCount} of ${candidates.length} candidates against ${selectedJob.title}.`,
      });
    } catch (err: any) {
      console.error("Batch re-analyze error:", err);
      toast({
        title: "Batch Re-analysis Issue",
        description: err.message || "Failed to complete all re-analyses.",
        variant: "destructive"
      });
    } finally {
      setIsReanalyzingAll(false);
      setReanalyzingProgress(null);
    }
  };

  // Filter candidates by source (applied vs talent pool)
  const { appliedCandidates, talentPoolCandidates } = useMemo(() => {
    const applied = candidates.filter(c => c.source === 'applied' || !c.source);
    const talentPool = candidates.filter(c => c.source === 'talent-pool');
    
    // Filter talent pool by last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const freshTalentPool = talentPool.filter(c => {
      if (!c.lastUpdated) return false;
      return new Date(c.lastUpdated) >= threeMonthsAgo;
    });
    
    return { appliedCandidates: applied, talentPoolCandidates: freshTalentPool };
  }, [candidates]);

  const currentCandidates = activeTab === 'all' 
    ? candidates 
    : activeTab === 'applied' 
      ? appliedCandidates 
      : talentPoolCandidates;

  const filteredCandidates = currentCandidates.filter((c) => {
    if (filterMode === 'all') return true;
    return c.aiScore === filterMode;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    // Pinned candidates always on top
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    switch (sortMode) {
      case 'ai-rank':
        // Sort by cosineSimilarity descending - higher match % = higher rank
        const simA = a.cosineSimilarity || 0;
        const simB = b.cosineSimilarity || 0;
        return simB - simA;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'experience':
        return b.experience - a.experience;
      case 'date':
        const dateA = a.lastUpdated || a.appliedDate || '';
        const dateB = b.lastUpdated || b.appliedDate || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      default:
        return 0;
    }
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleViewResume = (candidate: Candidate) => {
    setResumeCandidate(candidate);
    setShowResumeModal(true);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground animate-pulse">Loading candidates...</p>
        </div>
      </div>
    );
  }

  const selectedCandidates = currentCandidates.filter((c) => selectedIds.has(c.id));

  return (
    <div className="p-4 sm:p-5 animate-fade-in">
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center flex-wrap gap-2 min-w-0">
          {onBack && (
            <button 
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted px-2.5 py-1.5 rounded-md border border-border/50 transition-colors cursor-pointer shrink-0"
              title="Back to Jobs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Jobs</span>
            </button>
          )}
          {onBack && <div className="h-4 w-px bg-border/60 hidden sm:block" />}
          
          <div className="flex items-center gap-1.5 shrink-0">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Candidates</h2>
            {selectedJob?.hireSortEnabled && <AIBadge />}
          </div>

          <span className="text-muted-foreground/40 text-xs hidden sm:inline">•</span>

          {selectedJob && (
            <div className="flex items-center flex-wrap gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/90 truncate max-w-[200px] sm:max-w-xs md:max-w-sm" title={selectedJob.title}>
                {selectedJob.title}
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span>{candidates.length} total candidates</span>
              <span className="text-muted-foreground/60">•</span>
              <span>{sortedCandidates.length} shown</span>
              <button 
                onClick={() => setShowJDModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full border border-primary/20 transition-all cursor-pointer shadow-2xs ml-0.5"
                title="View Job Description, Responsibilities & Requirements"
              >
                <FileText className="w-3 h-3" />
                View JD
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {selectedIds.size > 0 && (
            <Button 
              variant="ai-primary"
              size="sm"
              className="h-8 text-xs px-3"
              onClick={() => onCreateShortlist(selectedCandidates)}
            >
              <CheckSquare className="w-3.5 h-3.5 mr-1" />
              Create Shortlist ({selectedIds.size})
            </Button>
          )}
          {selectedJob && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReanalyzeAllCandidates}
              disabled={isReanalyzingAll || candidates.length === 0}
              className="h-8 text-xs px-2.5 sm:px-3 gap-1.5 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
              title="Re-analyze all candidates against current job requirements"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-primary", isReanalyzingAll && "animate-spin")} />
              <span>
                {isReanalyzingAll 
                  ? (reanalyzingProgress ? `Analyzing (${reanalyzingProgress.current}/${reanalyzingProgress.total})...` : "Analyzing...")
                  : "Re-analyze All"}
              </span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowAddCandidateModal(true)}
            className="h-8 text-xs px-3 gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Candidate
          </Button>
        </div>
      </div>

      {selectedJob?.aiProcessingStatus === 'processing' && (
        <div className="mb-3 p-3 bg-ai-surface/50 border border-ai-accent/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-ai-surface flex items-center justify-center animate-pulse-soft">
              <Sparkles className="w-4 h-4 text-ai-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">AI is ranking candidates</h3>
              <p className="text-xs text-muted-foreground">Evaluating resumes in the background. Results will appear automatically.</p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Unified Toolbar: Source Tabs + Sort + Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 bg-card border border-border/80 rounded-lg p-1.5 mb-2.5 shadow-2xs">
        {/* Source Tabs */}
        <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-md text-xs font-medium w-fit shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded transition-all text-xs font-medium cursor-pointer",
              activeTab === 'all'
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Candidates</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-semibold",
              activeTab === 'all' ? "bg-primary/15 text-primary" : "bg-muted-foreground/15 text-muted-foreground"
            )}>
              {candidates.length}
            </span>
          </button>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('applied')}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded transition-all text-xs font-medium cursor-pointer",
                activeTab === 'applied'
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Applied</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-semibold",
                activeTab === 'applied' ? "bg-primary/15 text-primary" : "bg-muted-foreground/15 text-muted-foreground"
              )}>
                {appliedCandidates.length}
              </span>
            </button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="p-0.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help">
                    <Info className="w-3 h-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] text-center text-xs">
                  Candidates who directly applied to this active job posting.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('talent-pool')}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded transition-all text-xs font-medium cursor-pointer",
                activeTab === 'talent-pool'
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Talent Pool</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-semibold",
                activeTab === 'talent-pool' ? "bg-primary/15 text-primary" : "bg-muted-foreground/15 text-muted-foreground"
              )}>
                {talentPoolCandidates.length}
              </span>
            </button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="p-0.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help">
                    <Info className="w-3 h-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-center text-xs">
                  Candidates sourced from past jobs and talent network in the last 3 months.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
          {/* Sort Controls */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-muted-foreground mr-0.5">Sort by:</span>
            <div className="flex items-center gap-0.5">
              {selectedJob?.hireSortEnabled && (
                <SortButton 
                  active={sortMode === 'ai-rank'} 
                  onClick={() => setSortMode('ai-rank')}
                  icon={<Sparkles className="w-3 h-3 text-ai-accent" />}
                >
                  AI Rank
                </SortButton>
              )}
              <SortButton 
                active={sortMode === 'experience'} 
                onClick={() => setSortMode('experience')}
              >
                Experience
              </SortButton>
              <SortButton 
                active={sortMode === 'date'} 
                onClick={() => setSortMode('date')}
              >
                Date Applied
              </SortButton>
              <SortButton 
                active={sortMode === 'name'} 
                onClick={() => setSortMode('name')}
              >
                Name
              </SortButton>
            </div>
          </div>

          {/* Filter Controls */}
          {selectedJob?.hireSortEnabled && (
            <>
              <div className="h-4 w-px bg-border/70 hidden sm:block" />
              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-muted-foreground/70" />
                <div className="flex items-center gap-0.5">
                  <FilterButton active={filterMode === 'all'} onClick={() => setFilterMode('all')}>
                    All
                  </FilterButton>
                  <FilterButton active={filterMode === 'high'} onClick={() => setFilterMode('high')} color="success">
                    Strong
                  </FilterButton>
                  <FilterButton active={filterMode === 'medium'} onClick={() => setFilterMode('medium')} color="warning">
                    Potential
                  </FilterButton>
                  <FilterButton active={filterMode === 'low'} onClick={() => setFilterMode('low')}>
                    Low
                  </FilterButton>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Talent Pool Notice */}
      {activeTab === 'talent-pool' && (
        <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-md px-3 py-1.5 mb-2.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <p>
            Candidates available in the <span className="font-medium text-foreground">Talent Pool Database</span> from the last 3 months.
          </p>
        </div>
      )}

      {/* AI Ranking Notice */}
      {selectedJob?.hireSortEnabled && (
        <div className="flex items-center gap-2 bg-ai-surface/60 border border-ai-border/40 rounded-md px-3 py-1.5 mb-2.5 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-ai-accent shrink-0" />
          <p>
            <span className="font-medium text-foreground">Rankings are suggestions.</span>
            <span className="ml-1">Drag to reorder, pin favorites, or use filters to focus your review.</span>
          </p>
        </div>
      )}

      {/* Candidate List */}
      <div className="space-y-2">
        {sortedCandidates.map((candidate, index) => (
          <CandidateRow
            key={candidate.id}
            candidate={candidate}
            displayRank={index + 1}
            isSelected={selectedIds.has(candidate.id)}
            onSelect={() => toggleSelect(candidate.id)}
            onClick={() => onSelectCandidate({ ...candidate, aiRank: index + 1 })}
            onViewResume={() => handleViewResume(candidate)}
            onReanalyze={() => handleReanalyzeSingleCandidate(candidate)}
            isReanalyzing={reanalyzingId === candidate.id}
            isAIEnabled={selectedJob?.hireSortEnabled || false}
          />
        ))}
      </div>

      {sortedCandidates.length === 0 && (
        <div className="p-12 text-center bg-card border border-border rounded-xl space-y-4 max-w-lg mx-auto my-8 animate-fade-in shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-foreground">No Applicants Yet</h3>
            <p className="text-sm text-muted-foreground">
              {candidates.length === 0
                ? "This job is active and waiting for applicants. Candidates who apply via your public careers link or embed widget will appear here and be ranked by HireSort AI."
                : "No candidates match the active filter or search criteria."}
            </p>
          </div>
          {selectedJob?.slug && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => {
                const url = `${getAppBaseUrl()}/careers/zool/${selectedJob.slug}`;
                navigator.clipboard.writeText(url);
                toast({ title: 'Link Copied', description: 'Public job application URL copied to clipboard.' });
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Copy Careers Application Link
            </Button>
          )}
        </div>
      )}

      {/* Resume Modal */}
      <ResumeViewerModal 
        candidate={resumeCandidate}
        open={showResumeModal}
        onOpenChange={setShowResumeModal}
      />

      {/* JD Modal */}
      <JobDescriptionModal 
        job={selectedJob}
        open={showJDModal}
        onOpenChange={setShowJDModal}
      />

      {/* Add Candidate Modal */}
      <AddCandidateModal
        open={showAddCandidateModal}
        onOpenChange={setShowAddCandidateModal}
        targetJob={selectedJob}
        onCandidateAdded={() => {
          // Re-fetch candidate list
          const targetJobId = selectedJob?.id;
          if (targetJobId) {
            supabase
              .from('candidates')
              .select('*')
              .eq('job_id', targetJobId)
              .then(({ data }) => {
                if (data) {
                  const mapped: Candidate[] = data.map((c: any, index: number) => ({
                    id: c.id,
                    jobId: c.job_id,
                    name: c.full_name,
                    email: c.email,
                    phone: c.phone || '',
                    experience: c.experience,
                    location: c.location || 'Remote',
                    appliedDate: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    matchedSkills: c.matched_skills || [],
                    missingSkills: c.missing_skills || [],
                    evaluationStatus: (c.cosine_similarity === null) ? 'unprocessed' : 'evaluated',
                    currentRole: c.role_title,
                    currentCompany: c.company,
                    aiScore: c.ai_score,
                    aiRank: index + 1,
                    cosineSimilarity: c.cosine_similarity,
                    source: c.source || 'applied',
                    status: c.status || 'new',
                    resumeUrl: c.resume_url,
                    resumeText: c.resume_text,
                    predictiveInsights: c.predictive_insights
                  }));
                  setCandidates(mapped);
                }
              });
          }
        }}
      />
    </div>
  );
}

interface CandidateRowProps {
  candidate: Candidate;
  displayRank: number;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onViewResume: () => void;
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
  isAIEnabled: boolean;
}

function CandidateRow({ candidate, displayRank, isSelected, onSelect, onClick, onViewResume, onReanalyze, isReanalyzing, isAIEnabled }: CandidateRowProps) {
  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-4 transition-all duration-200 group",
        isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50",
        candidate.isOverridden && "border-l-2 border-l-warning"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
            isSelected 
              ? "bg-primary border-primary text-primary-foreground" 
              : "border-border hover:border-primary"
          )}
        >
          {isSelected && <CheckSquare className="w-3 h-3" />}
        </button>

        {isAIEnabled && (
          <>
            {/* Rank Badge - use displayRank for consistent numbering */}
            <RankBadge rank={displayRank} score={candidate.aiScore || 'low'} />

            {candidate.cosineSimilarity !== null && candidate.cosineSimilarity !== undefined ? (
              <div className="flex flex-col items-center min-w-[60px]">
                <span className={cn(
                  "text-sm font-bold tabular-nums",
                  candidate.cosineSimilarity >= 0.8 && "text-success",
                  candidate.cosineSimilarity >= 0.5 && candidate.cosineSimilarity < 0.8 && "text-warning",
                  candidate.cosineSimilarity < 0.5 && "text-muted-foreground"
                )}>
                  {(candidate.cosineSimilarity * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] text-muted-foreground">match</span>
              </div>
            ) : (
              <div className="flex flex-col items-center min-w-[70px]">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                  Unprocessed
                </span>
                <span className="text-[9px] text-muted-foreground mt-0.5">Awaiting ATS</span>
              </div>
            )}
          </>
        )}

        {/* Candidate Info */}
        <div className="flex-1 min-w-0" onClick={onClick}>
          <div className="flex items-center gap-2 mb-1 cursor-pointer">
            <h3 className="font-medium text-foreground truncate">{candidate.name}</h3>
            {isAIEnabled && (
              candidate.cosineSimilarity !== null && candidate.cosineSimilarity !== undefined ? (
                <RelevanceLabel score={candidate.aiScore || 'low'} />
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground font-medium border border-border">
                  {candidate.evaluationError ? 'Format Error' : 'Not Screened'}
                </span>
              )
            )}
            {candidate.isPinned && <OverrideIndicator type="pinned" />}
            {candidate.isBoosted && <OverrideIndicator type="boosted" />}
            {/* Source Badge */}
            <span className={cn(
              "px-2 py-0.5 text-xs rounded-full font-medium",
              candidate.source === 'talent-pool' 
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" 
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            )}>
              {candidate.source === 'talent-pool' ? 'Talent Pool' : 'Applied'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {candidate.currentRole} at {candidate.company} • {candidate.experience} yrs • {candidate.location}
          </p>
          
          {/* Matched Skills Preview */}
          {candidate.matchedSkills && candidate.matchedSkills.length > 0 ? (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Matched:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {candidate.matchedSkills.slice(0, 4).map((skill) => (
                  <span 
                    key={skill} 
                    className="px-1.5 py-0.5 bg-success-muted text-success text-xs rounded"
                  >
                    {skill}
                  </span>
                ))}
                {candidate.matchedSkills.length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{candidate.matchedSkills.length - 4} more
                  </span>
                )}
              </div>
            </div>
          ) : (candidate.cosineSimilarity !== null && candidate.cosineSimilarity !== undefined) ? (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/70 italic">
              No direct required skill overlap found
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
              {candidate.evaluationError || 'Data not processed: awaiting ATS screening'}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={cn(
          "flex items-center gap-1 transition-opacity",
          isReanalyzing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {onReanalyze && (
            <Button 
              variant="ghost" 
              size="icon-sm" 
              title="Re-analyze Candidate with AI"
              disabled={isReanalyzing}
              onClick={(e) => {
                e.stopPropagation();
                onReanalyze();
              }}
              className={cn("hover:text-primary hover:bg-primary/10", isReanalyzing && "text-primary")}
            >
              <RefreshCw className={cn("w-4 h-4", isReanalyzing && "animate-spin")} />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon-sm" 
            title="View Resume"
            onClick={(e) => {
              e.stopPropagation();
              onViewResume();
            }}
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Pin candidate">
            <Pin className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Boost ranking">
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Demote ranking">
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>

        {/* View Details */}
        <Button variant="ghost" size="sm" onClick={onClick}>
          View
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

interface SortButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function SortButton({ active, onClick, children, icon }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
        active 
          ? "bg-primary text-primary-foreground shadow-2xs font-semibold" 
          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: 'success' | 'warning';
}

function FilterButton({ active, onClick, children, color }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
        active && !color && "bg-secondary text-secondary-foreground font-semibold shadow-2xs",
        active && color === 'success' && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30",
        active && color === 'warning' && "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30",
        !active && "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
