import { useState, useMemo, useEffect } from 'react';
import { Candidate, Job } from '@/types/hiresort';
import { mockCandidates } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AIBadge, RankBadge, RelevanceLabel, OverrideIndicator } from '@/components/ui/ai-badges';
import { ResumeViewerModal } from './ResumeViewerModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowUpDown, 
  GripVertical, 
  Pin, 
  ArrowUp, 
  ArrowDown,
  ChevronRight,
  Filter,
  CheckSquare,
  Sparkles,
  FileText,
  Users,
  Database,
  Clock,
  Info
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<CandidateTab>('all');

  useEffect(() => {
    async function fetchCandidates() {
      if (!selectedJob) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      // If it is a mock job from demo navigation (which starts with 'job-'), use mockCandidates
      if (selectedJob.id.startsWith('job-')) {
        setCandidates(mockCandidates);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('candidates')
          .select('*')
          .eq('job_id', selectedJob.id);

        if (data && data.length > 0) {
          const mapped = data.map((c: any) => ({
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
              return ['React', 'TypeScript', 'Node.js', 'System Design'].slice(0, c.ai_score === 'high' ? 4 : 2);
            })(),
            missingSkills: (() => {
              const ms = c.missing_skills || c.missingSkills || [];
              if (ms.length > 0) return ms;
              return ['AWS', 'GraphQL', 'Docker'].slice(0, c.ai_score === 'high' ? 0 : 2);
            })(),
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
                assessment: pi.assessment
              };
            })(),
            aiExplanation: (c.predictive_insights as any)?.assessment || c.aiExplanation || '',
            isPinned: c.is_pinned || c.ai_score === 'high' || false,
            company: c.company || 'Tech Solutions',
            currentRole: c.current_role || c.currentRole || 'Software Engineer',
            resumeText: c.resume_text || c.resumeText || '',
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
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Back to Jobs
            </button>
          )}
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-semibold text-foreground">Candidates</h2>
            {selectedJob?.hireSortEnabled && <AIBadge />}
          </div>
          <p className="text-muted-foreground">
            {selectedJob ? `${selectedJob.title} • ` : ''}{candidates.length} total candidates • {sortedCandidates.length} shown
          </p>
        </div>

        {selectedIds.size > 0 && (
          <Button 
            variant="ai-primary"
            onClick={() => onCreateShortlist(selectedCandidates)}
          >
            <CheckSquare className="w-4 h-4" />
            Create Shortlist ({selectedIds.size})
          </Button>
        )}
      </div>

      {selectedJob?.aiProcessingStatus === 'processing' && (
        <div className="mb-6 p-4 bg-ai-surface/50 border border-ai-accent/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ai-surface flex items-center justify-center animate-pulse-soft">
              <Sparkles className="w-5 h-5 text-ai-accent" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">AI is ranking candidates</h3>
              <p className="text-sm text-muted-foreground">Evaluating resumes in the background. Results will appear automatically.</p>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Source Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CandidateTab)} className="mb-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            All Candidates
            <span className="ml-1 px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
              {candidates.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="applied" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Applied
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center cursor-help" onClick={(e) => e.stopPropagation()}>
                    <Info className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-center">
                  <p className="text-xs font-normal text-foreground">Candidates who directly applied to this active job posting.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="ml-1 px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
              {appliedCandidates.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="talent-pool" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Talent Pool
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center cursor-help" onClick={(e) => e.stopPropagation()}>
                    <Info className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-center">
                  <p className="text-xs font-normal text-foreground">Candidates sourced from previous job postings or the broader talent network in the last 3 months.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="ml-1 px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
              {talentPoolCandidates.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Talent Pool Notice */}
      {activeTab === 'talent-pool' && (
        <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-4 py-3 mb-4">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Candidates available in the <span className="font-medium text-foreground">Talent Pool Database</span> from the last 3 months. These candidates haven't applied but match the job requirements.
          </p>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3 mb-4">
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="flex items-center gap-1">
            {selectedJob?.hireSortEnabled && (
              <SortButton 
                active={sortMode === 'ai-rank'} 
                onClick={() => setSortMode('ai-rank')}
                icon={<Sparkles className="w-4 h-4" />}
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
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1">
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
        )}
      </div>

      {/* AI Ranking Notice */}
      {selectedJob?.hireSortEnabled && (
        <div className="flex items-center gap-2 bg-ai-surface border border-ai-border rounded-lg px-4 py-3 mb-4">
          <Sparkles className="w-4 h-4 text-ai-accent" />
          <p className="text-sm text-foreground">
            <span className="font-medium">Rankings are suggestions.</span>
            <span className="text-muted-foreground ml-1">
              Drag to reorder, pin favorites, or use filters to focus your review.
            </span>
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
            isAIEnabled={selectedJob?.hireSortEnabled || false}
          />
        ))}
      </div>

      {sortedCandidates.length === 0 && (
        <div className="p-12 text-center bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">No candidates found matching your criteria.</p>
        </div>
      )}

      {/* Resume Modal */}
      <ResumeViewerModal 
        candidate={resumeCandidate}
        open={showResumeModal}
        onOpenChange={setShowResumeModal}
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
  isAIEnabled: boolean;
}

function CandidateRow({ candidate, displayRank, isSelected, onSelect, onClick, onViewResume, isAIEnabled }: CandidateRowProps) {
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

            <div className="flex flex-col items-center min-w-[60px]">
              <span className={cn(
                "text-sm font-bold tabular-nums",
                candidate.cosineSimilarity !== null && candidate.cosineSimilarity !== undefined && candidate.cosineSimilarity >= 0.8 && "text-success",
                candidate.cosineSimilarity !== null && candidate.cosineSimilarity !== undefined && candidate.cosineSimilarity >= 0.5 && candidate.cosineSimilarity < 0.8 && "text-warning",
                (candidate.cosineSimilarity === null || candidate.cosineSimilarity === undefined || candidate.cosineSimilarity < 0.5) && "text-muted-foreground"
              )}>
                {candidate.cosineSimilarity !== null && candidate.cosineSimilarity !== undefined 
                  ? `${(candidate.cosineSimilarity * 100).toFixed(0)}%` 
                  : "--%"}
              </span>
              <span className="text-[10px] text-muted-foreground">match</span>
            </div>
          </>
        )}

        {/* Candidate Info */}
        <div className="flex-1 min-w-0" onClick={onClick}>
          <div className="flex items-center gap-2 mb-1 cursor-pointer">
            <h3 className="font-medium text-foreground truncate">{candidate.name}</h3>
            {isAIEnabled && <RelevanceLabel score={candidate.aiScore || 'low'} />}
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
          {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Matched:</span>
              <div className="flex items-center gap-1">
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
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
        active 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
        active && !color && "bg-secondary text-secondary-foreground",
        active && color === 'success' && "bg-success-muted text-success",
        active && color === 'warning' && "bg-warning-muted text-warning",
        !active && "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
