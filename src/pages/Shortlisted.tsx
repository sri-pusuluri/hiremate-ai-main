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
import { RelevanceLabel, AIBadge } from '@/components/ui/ai-badges';
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

export default function Shortlisted() {
  // For demo, shortlisted candidates are those with high AI score or isPinned
  const shortlistedCandidates = useMemo(() => 
    mockCandidates.filter(c => c.aiScore === 'high' || c.isPinned),
  []);
  
  const [candidates] = useState<Candidate[]>(shortlistedCandidates);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJob, setFilterJob] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Create a job lookup map for efficient access
  const jobMap = useMemo(() => {
    const map: Record<string, Job> = {};
    mockJobs.forEach(job => { map[job.id] = job; });
    return map;
  }, []);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesSearch = 
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.currentRole.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesJob = filterJob === 'all' || candidate.jobId === filterJob;

      return matchesSearch && matchesJob;
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
              {mockJobs.map(job => (
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
                {mockJobs.filter(j => j.hireSortEnabled).length}
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
            {paginatedData.map((candidate) => (
              <tr 
                key={candidate.id}
                className={cn(
                  "hover:bg-muted/30 transition-colors cursor-pointer",
                  selectedCandidate?.id === candidate.id && "bg-muted/50"
                )}
                onClick={() => handleViewCandidate(candidate)}
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
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-bold tabular-nums",
                      (candidate.cosineSimilarity || 0) >= 0.8 && "text-success",
                      (candidate.cosineSimilarity || 0) >= 0.5 && (candidate.cosineSimilarity || 0) < 0.8 && "text-warning",
                      (candidate.cosineSimilarity || 0) < 0.5 && "text-muted-foreground"
                    )}>
                      {((candidate.cosineSimilarity || 0) * 100).toFixed(0)}%
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
          onClose={handleCloseDetail}
          onFeedback={handleFeedback}
        />
      )}
    </div>
  );
}
