import { useState, useMemo, useEffect } from 'react';
import { mockCandidates, mockJobs } from '@/data/mockData';
import { Candidate, Job } from '@/types/hiresort';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RankBadge, RelevanceLabel } from '@/components/ui/ai-badges';
import { CandidateDetail } from '@/components/flows/CandidateDetail';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Search, 
  Filter, 
  Download,
  Mail,
  MapPin,
  Briefcase,
  Info,
  Calendar,
  SlidersHorizontal,
  Eye,
  FileText,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type TabType = 'all' | 'applied' | 'talent-pool';

const jobUuidMap: Record<string, string> = {
  'job-1': '11111111-1111-1111-1111-111111111111',
  'job-2': '22222222-2222-2222-2222-222222222222',
  'job-3': '33333333-3333-3333-3333-333333333333',
  'job-4': '44444444-4444-4444-4444-444444444444',
  'job-5': '55555555-5555-5555-5555-555555555555',
};

const candidateUuidMap: Record<string, string> = {
  'cand-1': 'a1111111-1111-1111-1111-111111111111',
  'cand-2': 'a2222222-2222-2222-2222-222222222222',
  'cand-3': 'a3333333-3333-3333-3333-333333333333',
  'cand-4': 'a4444444-4444-4444-4444-444444444444',
  'cand-5': 'a5555555-5555-5555-5555-555555555555',
  'cand-6': 'a6666666-6666-6666-6666-666666666666',
  'cand-7': 'a7777777-7777-7777-7777-777777777777',
  'cand-8': 'a8888888-8888-8888-8888-888888888888',
  'cand-9': 'a9999999-9999-9999-9999-999999999999',
  'cand-10': 'b1111111-1111-1111-1111-111111111111',
  'cand-11': 'b2222222-2222-2222-2222-222222222222',
  'cand-12': 'b3333333-3333-3333-3333-333333333333',
  'cand-13': 'b4444444-4444-4444-4444-444444444444',
  'cand-14': 'b5555555-5555-5555-5555-555555555555',
  'cand-15': 'b6666666-6666-6666-6666-666666666666',
  'cand-16': 'b7777777-7777-7777-7777-777777777777',
};

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: dbJobs } = await supabase.from('jobs').select('*');
        const { data: dbCandidates } = await supabase.from('candidates').select('*');

        const mappedMockJobs = mockJobs.map(j => ({
          ...j,
          id: jobUuidMap[j.id] || j.id
        }));

        const mappedMockCandidates = mockCandidates.map(c => ({
          ...c,
          id: candidateUuidMap[c.id] || c.id,
          jobId: jobUuidMap[c.jobId] || c.jobId
        }));

        if (dbJobs && dbJobs.length > 0) {
          const mappedJobs = dbJobs.map((j: any) => ({
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
            candidateCount: j.candidate_count || 0
          }));
          setJobs(mappedJobs);
        } else {
          setJobs([]);
        }

        if (dbCandidates && dbCandidates.length > 0) {
          const mappedCandidates = dbCandidates.map((c: any) => ({
            id: c.id,
            jobId: c.job_id,
            name: c.full_name,
            email: c.email,
            phone: c.phone || '',
            experience: c.experience,
            location: c.location || 'Remote',
            appliedDate: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            matchedSkills: c.matched_skills || c.matchedSkills || [],
            missingSkills: c.missing_skills || c.missingSkills || [],
            aiScore: (c.cosine_similarity !== null && c.cosine_similarity !== undefined) 
              ? c.ai_score 
              : ((c.cosineSimilarity !== null && c.cosineSimilarity !== undefined) ? c.aiScore : 'pending'),
            cosineSimilarity: (c.cosine_similarity !== null && c.cosine_similarity !== undefined) 
              ? c.cosine_similarity 
              : ((c.cosineSimilarity !== null && c.cosineSimilarity !== undefined) ? c.cosineSimilarity : null),
            predictiveInsights: (() => {
              const pi = c.predictive_insights || c.predictiveInsights || {};
              const score = c.ai_score || c.aiScore || 'medium';
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
            company: c.company || 'Tech Solutions',
            currentRole: c.current_role || c.currentRole || 'Software Engineer',
            source: c.source || (c.email.length % 3 === 0 ? 'talent-pool' : 'applied'),
            pipelineStage: c.pipeline_stage || (c.pipelineStage || 'applied'),
          }));
          setCandidates(mappedCandidates);
        } else {
          setCandidates([]);
        }
      } catch (err) {
        console.error('Error fetching Supabase data:', err);
        setJobs([]);
        setCandidates([]);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [filterJob, setFilterJob] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const handleStageChange = async (candidateId: string, newStage: any) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, pipelineStage: newStage } : c));
    try {
      await supabase.from('candidates').update({ pipeline_stage: newStage } as any).eq('id', candidateId);
      toast({ 
        title: 'Stage Updated', 
        description: `Candidate moved to ${newStage.replace('_', ' ').toUpperCase()}` 
      });
    } catch (err) {
      console.warn('Could not update stage in db:', err);
    }
  };

  // Create a job lookup map for efficient access
  const jobMap = useMemo(() => {
    const map: Record<string, Job> = {};
    jobs.forEach(job => { map[job.id] = job; });
    return map;
  }, [jobs]);

  const selectedJob = filterJob !== 'all' ? jobMap[filterJob] : undefined;

  // Count candidates by source
  const candidateCounts = useMemo(() => {
    const applied = candidates.filter(c => c.source === 'applied' || !c.source).length;
    const talentPool = candidates.filter(c => c.source === 'talent-pool').length;
    return {
      all: candidates.length,
      applied,
      talentPool,
    };
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesSearch = 
        (candidate.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (candidate.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (candidate.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (candidate.currentRole || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        filterScore === 'all' || 
        candidate.aiScore === filterScore;

      // Filter by job if selected
      const matchesJob = filterJob === 'all' || candidate.jobId === filterJob;

      // Filter by tab
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'applied' && candidate.source === 'applied') ||
        (activeTab === 'talent-pool' && candidate.source === 'talent-pool');

      // Filter by pipeline stage
      const matchesStage = 
        filterStage === 'all' || 
        (candidate.pipelineStage || 'applied') === filterStage;

      return matchesSearch && matchesFilter && matchesJob && matchesTab && matchesStage;
    });
  }, [candidates, searchQuery, filterScore, filterJob, filterStage, activeTab]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ data: filteredCandidates, itemsPerPage: 10 });

  // Reset to page 1 when filters change
  useEffect(() => {
    goToPage(1);
  }, [searchQuery, filterScore, filterJob, activeTab]);

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleCloseDetail = () => {
    setSelectedCandidate(null);
  };

  const handleToggleShortlist = (candidateId: string, isShortlisted: boolean) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, isPinned: isShortlisted, status: isShortlisted ? 'shortlisted' : 'pending' } : c));
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => prev ? { ...prev, isPinned: isShortlisted, status: isShortlisted ? 'shortlisted' : 'pending' } : null);
    }
  };

  const handleFeedback = (type: 'good' | 'poor') => {
    console.log('Feedback:', type, 'for candidate:', selectedCandidate?.id);
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">All Candidates</h1>
          <p className="text-muted-foreground">
            {selectedJob 
              ? `${filteredCandidates.length} candidates matching "${selectedJob.title}"`
              : `${filteredCandidates.length} candidates across all jobs`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedJob && (
            <Badge variant="secondary" className="px-3 py-1">
              Filtering: {selectedJob.title}
            </Badge>
          )}
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-muted/50 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'all'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All Candidates
          <Badge variant="secondary" className="ml-1 bg-background/50">
            {candidateCounts.all}
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab('applied')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'applied'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
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
          <Badge variant="secondary" className="ml-1 bg-background/50">
            {candidateCounts.applied}
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab('talent-pool')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'talent-pool'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
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
          <Badge variant="secondary" className="ml-1 bg-background/50">
            {candidateCounts.talentPool}
          </Badge>
        </button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, company..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Job Filter */}
          <Select value={filterJob} onValueChange={setFilterJob}>
            <SelectTrigger className="w-[200px]">
              <Briefcase className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by Job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterScore} onValueChange={setFilterScore}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="AI Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="high">High Match</SelectItem>
              <SelectItem value="medium">Medium Match</SelectItem>
              <SelectItem value="low">Low Match</SelectItem>
            </SelectContent>
          </Select>

          {/* Pipeline Stage Filter */}
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Pipeline Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="ai_screened">AI Screened</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="offered">Offered</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <SlidersHorizontal className="w-4 h-4" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Candidates Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Candidate</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Applied For</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Current Role</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Experience</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Location</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Pipeline Stage</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">AI Score</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Applied</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((candidate) => (
              <tr 
                key={candidate.id}
                className={cn(
                  "hover:bg-muted/30 transition-colors cursor-pointer",
                  selectedCandidate?.id === candidate.id && "bg-muted/50"
                )}
                onClick={() => setSelectedCandidate(candidate)}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {candidate.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-foreground">
                    {candidate.jobId ? jobMap[candidate.jobId]?.title || 'Unknown Job' : 'Not specified'}
                  </p>
                  {candidate.jobId && jobMap[candidate.jobId] && (
                    <p className="text-xs text-muted-foreground">{jobMap[candidate.jobId].department}</p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm text-foreground">{candidate.currentRole}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {candidate.company}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="secondary">{candidate.experience} years</Badge>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {candidate.location}
                  </p>
                </td>
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <Select 
                    value={candidate.pipelineStage || 'applied'} 
                    onValueChange={(val) => handleStageChange(candidate.id, val)}
                  >
                    <SelectTrigger className={cn(
                      "h-7 text-xs font-semibold px-2 py-0 border rounded-md w-[130px]",
                      candidate.pipelineStage === 'offered' && "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
                      candidate.pipelineStage === 'interviewing' && "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
                      candidate.pipelineStage === 'ai_screened' && "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
                      candidate.pipelineStage === 'rejected' && "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400",
                      (!candidate.pipelineStage || candidate.pipelineStage === 'applied') && "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="ai_screened">AI Screened</SelectItem>
                      <SelectItem value="interviewing">Interviewing</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-4">
                  {candidate.jobId && jobMap[candidate.jobId]?.hireSortEnabled && candidate.aiScore && candidate.aiScore !== 'pending' ? (
                    <div className="flex items-center gap-2">
                      {candidate.cosineSimilarity !== null && candidate.cosineSimilarity !== undefined && (
                        <span className={cn(
                          "text-sm font-bold tabular-nums",
                          candidate.cosineSimilarity >= 0.8 && "text-success",
                          candidate.cosineSimilarity >= 0.5 && candidate.cosineSimilarity < 0.8 && "text-warning",
                          candidate.cosineSimilarity < 0.5 && "text-muted-foreground"
                        )}>
                          {Math.round(candidate.cosineSimilarity * 100)}%
                        </span>
                      )}
                      <RelevanceLabel score={candidate.aiScore} />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">--</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {candidate.appliedDate}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCandidate(candidate);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCandidates.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No candidates found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onNextPage={nextPage}
        onPrevPage={prevPage}
        onGoToPage={goToPage}
      />

      {/* Candidate Detail Slide-over */}
      {selectedCandidate && (
        <CandidateDetail 
          candidate={selectedCandidate}
          job={selectedCandidate.jobId ? jobMap[selectedCandidate.jobId] : undefined}
          onClose={handleCloseDetail}
          onFeedback={handleFeedback}
          onToggleShortlist={handleToggleShortlist}
        />
      )}
    </div>
  );
}
