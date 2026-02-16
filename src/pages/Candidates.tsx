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
  Search, 
  Filter, 
  Download,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  SlidersHorizontal,
  Eye,
  FileText,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'all' | 'applied' | 'talent-pool';

export default function Candidates() {
  const [candidates] = useState<Candidate[]>(mockCandidates);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [filterJob, setFilterJob] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Create a job lookup map for efficient access
  const jobMap = useMemo(() => {
    const map: Record<string, Job> = {};
    mockJobs.forEach(job => { map[job.id] = job; });
    return map;
  }, []);

  const selectedJob = filterJob !== 'all' ? jobMap[filterJob] : undefined;

  // Count candidates by source
  const candidateCounts = useMemo(() => {
    const applied = candidates.filter(c => c.source === 'applied').length;
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
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.currentRole.toLowerCase().includes(searchQuery.toLowerCase());
      
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

      return matchesSearch && matchesFilter && matchesJob && matchesTab;
    });
  }, [candidates, searchQuery, filterScore, filterJob, activeTab]);

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
              {mockJobs.map((job) => (
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
                <td className="px-4 py-4">
                  {candidate.source === 'applied' && candidate.aiRank && candidate.aiScore ? (
                    <div className="flex items-center gap-2">
                      <RankBadge rank={candidate.aiRank} score={candidate.aiScore} />
                      <RelevanceLabel score={candidate.aiScore} />
                    </div>
                  ) : candidate.source === 'talent-pool' ? (
                    <span className="text-sm text-muted-foreground">—</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not ranked</span>
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
          onClose={handleCloseDetail}
          onFeedback={handleFeedback}
        />
      )}
    </div>
  );
}
