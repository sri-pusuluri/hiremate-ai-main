import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Download,
  Printer,
  Search,
  Filter,
  Users,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  TrendingUp,
  FileText,
  Eye,
  ChevronRight,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { AIBadge, RelevanceLabel } from '@/components/ui/ai-badges';
import { ResumeViewerModal } from '@/components/flows/ResumeViewerModal';
import { CandidateDetail } from '@/components/flows/CandidateDetail';
import { Candidate, Job } from '@/types/hiresort';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CandidateReportRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobId: string;
  jobTitle: string;
  currentRole: string;
  company: string;
  experience: number;
  source: 'applied' | 'talent-pool';
  aiScore: 'high' | 'medium' | 'low';
  cosineSimilarity: number;
  matchedSkills: string[];
  missingSkills: string[];
  status: 'pending' | 'shortlisted' | 'interviewing' | 'offered' | 'rejected' | 'hired';
  appliedDate: string;
  resumeUrl?: string;
  resumeText?: string;
  predictiveInsights?: any;
}

export default function Reports() {
  const { client, clientId } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<CandidateReportRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Filter States
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Candidate for modals
  const [viewingResumeCandidate, setViewingResumeCandidate] = useState<Candidate | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [activeCandidateDetail, setActiveCandidateDetail] = useState<Candidate | null>(null);

  // Fetch Jobs and Candidates
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch Jobs for client
        let jobQuery = supabase.from('jobs').select('*');
        if (clientId) {
          jobQuery = jobQuery.eq('client_id', clientId);
        }
        const { data: jobsData } = await jobQuery;
        
        const mappedJobs: Job[] = (jobsData || []).map((j: any) => ({
          id: j.id,
          title: j.title,
          department: j.department || 'Engineering',
          location: j.location || 'Remote',
          type: j.type || 'Full-time',
          salary: j.salary || '',
          description: j.description || '',
          responsibilities: j.responsibilities || [],
          requirements: j.requirements || [],
          niceToHave: j.nice_to_have || [],
          hireSortEnabled: Boolean(j.hire_sort_enabled),
          status: j.status || 'published',
          postedDate: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : '',
          candidateCount: 0,
          isPublic: Boolean(j.is_public),
          slug: j.slug || '',
        }));
        setJobs(mappedJobs);

        // Job Title Lookup Map
        const jobTitleMap: Record<string, string> = {};
        mappedJobs.forEach(j => {
          jobTitleMap[j.id] = j.title;
        });

        // Fetch Candidates for client
        let candQuery = supabase.from('candidates').select('*').order('created_at', { ascending: false });
        if (clientId) {
          candQuery = candQuery.eq('client_id', clientId);
        }
        const { data: candData } = await candQuery;

        if (candData) {
          const mappedCands: CandidateReportRecord[] = candData.map((c: any) => {
            const pi = c.predictive_insights || {};
            const sim = typeof c.cosine_similarity === 'number' 
              ? c.cosine_similarity 
              : (c.ai_score === 'high' ? 0.85 : c.ai_score === 'medium' ? 0.65 : 0.25);
            
            // Map status
            let normalizedStatus: CandidateReportRecord['status'] = 'pending';
            const rawStatus = (c.status || c.pipeline_stage || '').toLowerCase();
            if (rawStatus.includes('shortlist')) normalizedStatus = 'shortlisted';
            else if (rawStatus.includes('interview')) normalizedStatus = 'interviewing';
            else if (rawStatus.includes('offer')) normalizedStatus = 'offered';
            else if (rawStatus.includes('reject')) normalizedStatus = 'rejected';
            else if (rawStatus.includes('hire')) normalizedStatus = 'hired';
            else if (c.is_pinned) normalizedStatus = 'shortlisted';

            return {
              id: c.id,
              name: c.full_name || 'Anonymous Candidate',
              email: c.email || '',
              phone: c.phone || '',
              jobId: c.job_id || '',
              jobTitle: jobTitleMap[c.job_id] || 'General Application',
              currentRole: c.role_title || pi.currentRole || c.current_role || 'Candidate',
              company: c.company || pi.company || 'Independent',
              experience: c.experience || 3,
              source: c.source === 'talent-pool' ? 'talent-pool' : 'applied',
              aiScore: (c.ai_score === 'high' || c.ai_score === 'medium' || c.ai_score === 'low') 
                ? c.ai_score 
                : (sim >= 0.75 ? 'high' : sim >= 0.50 ? 'medium' : 'low'),
              cosineSimilarity: sim,
              matchedSkills: c.matched_skills || [],
              missingSkills: c.missing_skills || [],
              status: normalizedStatus,
              appliedDate: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : 'Recent',
              resumeUrl: c.resume_url,
              resumeText: c.resume_text,
              predictiveInsights: pi,
            };
          });

          setCandidates(mappedCands);
        }
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [clientId]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Job Filter
      if (selectedJobFilter !== 'all' && c.jobId !== selectedJobFilter) return false;

      // Status Filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      // Score Filter
      if (scoreFilter !== 'all') {
        if (scoreFilter === 'high' && c.aiScore !== 'high') return false;
        if (scoreFilter === 'medium' && c.aiScore !== 'medium') return false;
        if (scoreFilter === 'low' && c.aiScore !== 'low') return false;
      }

      // Source Filter
      if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;

      // Date Range Filter
      if (dateRangeFilter !== 'all' && c.appliedDate) {
        const appDate = new Date(c.appliedDate);
        const now = new Date();
        const diffDays = (now.getTime() - appDate.getTime()) / (1000 * 3600 * 24);
        if (dateRangeFilter === '7d' && diffDays > 7) return false;
        if (dateRangeFilter === '30d' && diffDays > 30) return false;
        if (dateRangeFilter === '90d' && diffDays > 90) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.currentRole.toLowerCase().includes(q) ||
          c.jobTitle.toLowerCase().includes(q) ||
          c.matchedSkills.some(s => s.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [candidates, selectedJobFilter, statusFilter, scoreFilter, sourceFilter, dateRangeFilter, searchQuery]);

  // Aggregate Metrics & Analytics
  const metrics = useMemo(() => {
    const total = filteredCandidates.length;
    const highMatch = filteredCandidates.filter(c => c.aiScore === 'high').length;
    const mediumMatch = filteredCandidates.filter(c => c.aiScore === 'medium').length;
    const lowMatch = filteredCandidates.filter(c => c.aiScore === 'low').length;

    const shortlisted = filteredCandidates.filter(c => c.status === 'shortlisted').length;
    const interviewing = filteredCandidates.filter(c => c.status === 'interviewing').length;
    const offered = filteredCandidates.filter(c => c.status === 'offered' || c.status === 'hired').length;
    const rejected = filteredCandidates.filter(c => c.status === 'rejected').length;
    const pending = filteredCandidates.filter(c => c.status === 'pending').length;

    const avgScore = total > 0
      ? Math.round((filteredCandidates.reduce((acc, c) => acc + c.cosineSimilarity, 0) / total) * 100)
      : 0;

    return {
      total,
      highMatch,
      mediumMatch,
      lowMatch,
      shortlisted,
      interviewing,
      offered,
      rejected,
      pending,
      avgScore,
    };
  }, [filteredCandidates]);

  // Chart Data: AI Match Distribution
  const scoreChartData = useMemo(() => {
    const ranges = [
      { name: '90-100%', count: 0 },
      { name: '80-89%', count: 0 },
      { name: '70-79%', count: 0 },
      { name: '60-69%', count: 0 },
      { name: '< 60%', count: 0 },
    ];

    filteredCandidates.forEach(c => {
      const pct = Math.round(c.cosineSimilarity * 100);
      if (pct >= 90) ranges[0].count++;
      else if (pct >= 80) ranges[1].count++;
      else if (pct >= 70) ranges[2].count++;
      else if (pct >= 60) ranges[3].count++;
      else ranges[4].count++;
    });

    return ranges;
  }, [filteredCandidates]);

  // Chart Data: Pipeline Funnel / Status
  const statusPieData = useMemo(() => {
    return [
      { name: 'Pending Review', value: metrics.pending, color: '#94a3b8' },
      { name: 'Shortlisted', value: metrics.shortlisted, color: '#3b82f6' },
      { name: 'Interviewing', value: metrics.interviewing, color: '#8b5cf6' },
      { name: 'Offered / Hired', value: metrics.offered, color: '#10b981' },
      { name: 'Rejected', value: metrics.rejected, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [metrics]);

  // Chart Data: Top Matched Skills Frequency
  const topSkillsData = useMemo(() => {
    const freq: Record<string, number> = {};
    filteredCandidates.forEach(c => {
      c.matchedSkills.forEach(s => {
        const clean = s.trim();
        if (clean) freq[clean] = (freq[clean] || 0) + 1;
      });
    });

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([skill, count]) => ({ skill, count }));
  }, [filteredCandidates]);

  // Update Status in Supabase
  const handleUpdateStatus = async (candidateId: string, newStatus: CandidateReportRecord['status']) => {
    try {
      await supabase
        .from('candidates')
        .update({
          status: newStatus,
          pipeline_stage: newStatus,
          is_pinned: newStatus === 'shortlisted',
        })
        .eq('id', candidateId);

      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
      toast({
        title: 'Status Updated',
        description: `Candidate status updated to "${newStatus}".`,
      });
    } catch (err: any) {
      console.error('Failed to update status:', err);
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredCandidates.length === 0) {
      toast({ title: 'No Data', description: 'No candidate records to export.' });
      return;
    }

    const headers = [
      'Candidate Name',
      'Email',
      'Phone',
      'Job Title',
      'Current Role',
      'Current Company',
      'Experience (Yrs)',
      'AI Score Tier',
      'Match Percentage',
      'Matched Skills',
      'Missing Skills',
      'Pipeline Status',
      'Source',
      'Applied Date',
    ];

    const rows = filteredCandidates.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.jobTitle.replace(/"/g, '""')}"`,
      `"${c.currentRole.replace(/"/g, '""')}"`,
      `"${c.company.replace(/"/g, '""')}"`,
      c.experience,
      c.aiScore.toUpperCase(),
      `${Math.round(c.cosineSimilarity * 100)}%`,
      `"${c.matchedSkills.join(', ')}"`,
      `"${c.missingSkills.join(', ')}"`,
      c.status.toUpperCase(),
      c.source,
      c.appliedDate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hiresort_candidates_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Report Exported ✨',
      description: `Downloaded ${filteredCandidates.length} candidate records as CSV.`,
    });
  };

  // Print Report View
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in print:p-0">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Live AI ATS
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Candidate selection, AI match scoring distributions, and pipeline conversion analytics for {client?.name || 'your workspace'}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV ({filteredCandidates.length})
          </Button>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-primary" />
          Filter & Segment Report
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Job Filter */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Target Role</Label>
            <Select value={selectedJobFilter} onValueChange={setSelectedJobFilter}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles ({jobs.length})</SelectItem>
                {jobs.map(j => (
                  <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pipeline Status */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Candidate Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="offered">Offered / Hired</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Score Filter */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">AI Fit Score</Label>
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Match Tiers</SelectItem>
                <SelectItem value="high">High Match (75%+)</SelectItem>
                <SelectItem value="medium">Potential (50-74%)</SelectItem>
                <SelectItem value="low">Low Match (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Source</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="applied">Applied (Careers)</SelectItem>
                <SelectItem value="talent-pool">Talent Pool</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Application Date</Label>
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Query */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Name, skill, company..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Candidates */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Candidates</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{metrics.total}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Evaluated in pipeline</p>
        </div>

        {/* Avg Match Score */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Avg AI Match</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{metrics.avgScore}%</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Semantic fit index</p>
        </div>

        {/* High Match */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">High Match</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.highMatch}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Scores 75% – 100%</p>
        </div>

        {/* Shortlisted */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Shortlisted</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.shortlisted}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Advance to interview</p>
        </div>

        {/* Pending Review */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.pending}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting decision</p>
        </div>

        {/* Rejected */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{metrics.rejected}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Did not meet criteria</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: AI Match Distribution Histogram */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">AI Match Score Distribution</h3>
              <p className="text-xs text-muted-foreground">Distribution of candidates across cosine similarity tiers</p>
            </div>
            <Badge variant="outline" className="text-xs font-normal">
              {filteredCandidates.length} Candidates
            </Badge>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis allowDecimals={false} fontSize={11} stroke="#94a3b8" />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pipeline Conversion Funnel / Status */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Pipeline Stage Breakdown</h3>
            <p className="text-xs text-muted-foreground">Current standing across ATS review workflow</p>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-muted-foreground">No candidate data for current filter</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Skills Matrix */}
      {topSkillsData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Top Matched Skills in Pool</h3>
              <Badge variant="outline" className="text-[10px]">AI Extracted</Badge>
            </div>
            <span className="text-xs text-muted-foreground">Frequency across current candidates</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {topSkillsData.map(item => (
              <div key={item.skill} className="bg-muted/40 border border-border rounded-lg p-2.5 text-center">
                <div className="text-xs font-semibold text-foreground truncate" title={item.skill}>{item.skill}</div>
                <div className="text-lg font-bold text-primary mt-1">{item.count}</div>
                <div className="text-[10px] text-muted-foreground">candidate match</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Candidate Reporting Table */}
      <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Candidate Records & AI Evaluations</h3>
            <p className="text-xs text-muted-foreground">
              Showing {filteredCandidates.length} candidates matching active filters.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Sort: Highest AI Match First
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Candidate & Role</TableHead>
                <TableHead>Target Job</TableHead>
                <TableHead>AI Match Fit</TableHead>
                <TableHead>Matched Skills</TableHead>
                <TableHead>Pipeline Status</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                    No candidates found matching the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCandidates
                  .sort((a, b) => b.cosineSimilarity - a.cosineSimilarity)
                  .map((c, idx) => {
                    const scorePct = Math.round(c.cosineSimilarity * 100);
                    return (
                      <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                        {/* Index */}
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>

                        {/* Candidate Info */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">
                                {c.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground truncate hover:text-primary cursor-pointer"
                                  onClick={() => setActiveCandidateDetail({
                                    id: c.id,
                                    jobId: c.jobId,
                                    name: c.name,
                                    email: c.email,
                                    experience: c.experience,
                                    appliedDate: c.appliedDate,
                                    aiScore: c.aiScore,
                                    cosineSimilarity: c.cosineSimilarity,
                                    matchedSkills: c.matchedSkills,
                                    missingSkills: c.missingSkills,
                                    currentRole: c.currentRole,
                                    company: c.company,
                                    resumeUrl: c.resumeUrl,
                                    resumeText: c.resumeText,
                                    predictiveInsights: c.predictiveInsights,
                                  } as any)}
                                >
                                  {c.name}
                                </span>
                                <span className={cn(
                                  "px-1.5 py-0.2 text-[9px] rounded font-medium",
                                  c.source === 'talent-pool' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                )}>
                                  {c.source === 'talent-pool' ? 'Talent Pool' : 'Applied'}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {c.currentRole} at {c.company} • {c.experience} yrs
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Target Job */}
                        <TableCell>
                          <span className="text-xs font-medium text-foreground truncate block max-w-[180px]">
                            {c.jobTitle}
                          </span>
                        </TableCell>

                        {/* AI Match Fit */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-bold",
                              scorePct >= 75 ? "text-emerald-600 dark:text-emerald-400" :
                              scorePct >= 50 ? "text-amber-600 dark:text-amber-400" :
                              "text-rose-600 dark:text-rose-400"
                            )}>
                              {scorePct}%
                            </span>
                            <RelevanceLabel score={c.aiScore} />
                          </div>
                        </TableCell>

                        {/* Matched Skills */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {c.matchedSkills.slice(0, 3).map(skill => (
                              <span key={skill} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] rounded font-medium">
                                {skill}
                              </span>
                            ))}
                            {c.matchedSkills.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{c.matchedSkills.length - 3}
                              </span>
                            )}
                            {c.matchedSkills.length === 0 && (
                              <span className="text-[10px] text-muted-foreground italic">No core matches</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Pipeline Status & Quick Change */}
                        <TableCell>
                          <Select 
                            value={c.status} 
                            onValueChange={(val: any) => handleUpdateStatus(c.id, val)}
                          >
                            <SelectTrigger className="h-7 text-xs w-[130px] border-border bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending Review</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="interviewing">Interviewing</SelectItem>
                              <SelectItem value="offered">Offered / Hired</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Applied Date */}
                        <TableCell className="text-xs text-muted-foreground">
                          {c.appliedDate}
                        </TableCell>

                        {/* Quick Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {c.resumeUrl && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="View Resume Document"
                                onClick={() => {
                                  setViewingResumeCandidate({
                                    id: c.id,
                                    jobId: c.jobId,
                                    name: c.name,
                                    email: c.email,
                                    experience: c.experience,
                                    appliedDate: c.appliedDate,
                                    aiScore: c.aiScore,
                                    cosineSimilarity: c.cosineSimilarity,
                                    matchedSkills: c.matchedSkills,
                                    missingSkills: c.missingSkills,
                                    resumeUrl: c.resumeUrl,
                                  } as any);
                                  setShowResumeModal(true);
                                }}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Inspect AI Evaluation Drawer"
                              onClick={() => setActiveCandidateDetail({
                                id: c.id,
                                jobId: c.jobId,
                                name: c.name,
                                email: c.email,
                                experience: c.experience,
                                appliedDate: c.appliedDate,
                                aiScore: c.aiScore,
                                cosineSimilarity: c.cosineSimilarity,
                                matchedSkills: c.matchedSkills,
                                missingSkills: c.missingSkills,
                                currentRole: c.currentRole,
                                company: c.company,
                                resumeUrl: c.resumeUrl,
                                resumeText: c.resumeText,
                                predictiveInsights: c.predictiveInsights,
                              } as any)}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Resume Viewer Modal */}
      <ResumeViewerModal
        candidate={viewingResumeCandidate}
        open={showResumeModal}
        onOpenChange={setShowResumeModal}
      />

      {/* Candidate Evaluation Drawer */}
      {activeCandidateDetail && (
        <CandidateDetail
          candidate={activeCandidateDetail}
          job={jobs.find(j => j.id === activeCandidateDetail.jobId) || {
            id: activeCandidateDetail.jobId,
            title: 'Job Role',
            description: 'Engineering requirement'
          } as any}
          isAIEnabled={true}
          onClose={() => setActiveCandidateDetail(null)}
          onFeedback={() => {}}
          onTogglePin={() => {}}
          onBoost={() => {}}
          onDemote={() => {}}
        />
      )}
    </div>
  );
}

function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white text-xs p-2.5 rounded-lg border border-slate-700 shadow-xl space-y-1.5 min-w-[140px] backdrop-blur-sm z-50">
        {label && <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: entry.color || entry.fill || entry.payload?.fill || '#6366f1' }} 
              />
              <span className="text-slate-200 font-medium">{entry.name}:</span>
            </div>
            <span className="font-bold text-white ml-2">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}
