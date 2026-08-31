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
import { RelevanceLabel, AIBadge, RankBadge } from '@/components/ui/ai-badges';
import { CandidateDetail } from '@/components/flows/CandidateDetail';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { 
  Search, 
  Download,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Eye,
  Star,
  Sparkles,
  Send,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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

export default function Shortlisted() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
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

        let mappedJobs: Job[] = [];
        if (dbJobs && dbJobs.length > 0) {
          mappedJobs = dbJobs.map((j: any) => ({
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
            nice_to_have: j.nice_to_have || [],
            hireSortEnabled: j.hire_sort_enabled,
            aiProcessingStatus: j.ai_processing_status,
            lastRankedAt: j.last_ranked_at,
            candidateCount: j.candidate_count || 0
          }));
        }
        setJobs(mappedJobs);

        let mappedCandidates: Candidate[] = [];
        if (dbCandidates && dbCandidates.length > 0) {
          mappedCandidates = dbCandidates.map((c: any) => ({
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
            isPinned: c.is_pinned || c.ai_score === 'high' || c.aiScore === 'high' || false,
            company: c.company || 'Tech Solutions',
            currentRole: c.current_role || c.currentRole || 'Software Engineer'
          }));
        }
        const filteredShortlisted = mappedCandidates.filter(c => c.aiScore === 'high' || c.isPinned);
        setCandidates(filteredShortlisted);
      } catch (err) {
        console.error('Error loading shortlisted candidates:', err);
        setJobs([]);
        setCandidates([]);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJob, setFilterJob] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Create a job lookup map for efficient access
  const jobMap = useMemo(() => {
    const map: Record<string, Job> = {};
    jobs.forEach(job => { map[job.id] = job; });
    return map;
  }, [jobs]);

  const filteredCandidates = useMemo(() => {
    const filtered = candidates.filter((candidate) => {
      const matchesSearch = 
        (candidate.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (candidate.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (candidate.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (candidate.currentRole || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesJob = filterJob === 'all' || candidate.jobId === filterJob;

      return matchesSearch && matchesJob;
    });
    return [...filtered].sort((a, b) => {
      const simA = a.cosineSimilarity || 0;
      const simB = b.cosineSimilarity || 0;
      return simB - simA;
    });
  }, [candidates, searchQuery, filterJob]);

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
  }, [searchQuery, filterJob]);

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleCloseDetail = () => {
    setSelectedCandidate(null);
  };

  const handleFeedback = (type: 'good' | 'poor') => {
    console.log('Feedback:', type, 'for candidate:', selectedCandidate?.id);
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-6 h-6 text-warning fill-warning" />
            <h1 className="text-2xl font-semibold text-foreground">Shortlisted Candidates</h1>
          </div>
          <p className="text-muted-foreground">
            {filteredCandidates.length} candidates ready for next stage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="sm">
            <Send className="w-4 h-4" />
            Share with Hiring Manager
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search shortlisted candidates..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={filterJob} onValueChange={setFilterJob}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by Job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ai-surface flex items-center justify-center">
              <AIBadge size="sm" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {candidates.filter(c => c.aiScore === 'high').length}
              </p>
              <p className="text-sm text-muted-foreground">AI Suggested</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {candidates.filter(c => c.isPinned).length}
              </p>
              <p className="text-sm text-muted-foreground">Recruiter Picks</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {jobs.filter(j => j.hireSortEnabled).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Candidates Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
             <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground w-16">Rank</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Candidate</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Applied For</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Current Role</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Match</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Source</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Added</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((candidate, index) => (
              <tr 
                key={candidate.id}
                className={cn(
                  "hover:bg-muted/30 transition-colors cursor-pointer",
                  selectedCandidate?.id === candidate.id && "bg-muted/50"
                )}
                onClick={() => handleViewCandidate(candidate)}
              >
                <td className="px-4 py-4">
                  <RankBadge rank={startIndex + index + 1} score={candidate.aiScore || 'low'} />
                </td>
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
                  <div className="flex items-center gap-2">
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
                    <RelevanceLabel score={candidate.aiScore || 'low'} />
                  </div>
                </td>
                <td className="px-4 py-4">
                  {candidate.aiScore === 'high' ? (
                    <Badge 
                      variant="secondary"
                      className="bg-primary/10 text-primary border-0 gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      AI
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Recruiter Pick
                    </Badge>
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
            <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">No shortlisted candidates yet</p>
            <p className="text-sm text-muted-foreground">
              Enable Hiresort GenAI on your jobs to get candidate recommendations
            </p>
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
          job={jobs.find(j => j.id === selectedCandidate.jobId)}
          onClose={handleCloseDetail}
          onFeedback={handleFeedback}
        />
      )}
    </div>
  );
}
