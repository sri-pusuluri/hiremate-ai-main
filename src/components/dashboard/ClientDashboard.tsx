import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Briefcase,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  ArrowUpRight,
  ExternalLink,
  Plus,
  ChevronRight,
  FileText,
  UserCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { RecruiterInsightsWidget } from '@/components/predictive/RecruiterInsightsWidget';
import { AIBadge, RelevanceLabel } from '@/components/ui/ai-badges';
import { cn } from '@/lib/utils';

interface ClientDashboardProps {
  onNavigate?: (view: string) => void;
}

export function ClientDashboard({ onNavigate }: ClientDashboardProps) {
  const { client, clientId, user } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClientData() {
      setLoading(true);
      try {
        let jobQuery = supabase.from('jobs').select('*');
        let candQuery = supabase.from('candidates').select('*');

        if (clientId) {
          jobQuery = jobQuery.eq('client_id', clientId);
          candQuery = candQuery.eq('client_id', clientId);
        }

        const [jobsRes, candsRes] = await Promise.all([jobQuery, candQuery]);
        if (jobsRes.data) setJobs(jobsRes.data);
        if (candsRes.data) setCandidates(candsRes.data);
      } catch (err) {
        console.error('Failed to load client dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClientData();
  }, [clientId]);

  // Client KPI Computations
  const totalCandidates = candidates.length;
  const activeJobs = jobs.filter(j => j.status !== 'archived');
  const highMatchCount = candidates.filter(c => c.ai_score === 'high').length;
  const shortlistedCount = candidates.filter(c => 
    c.is_pinned || (c.status && c.status.toLowerCase().includes('shortlist'))
  ).length;
  const interviewingCount = candidates.filter(c => 
    c.status && c.status.toLowerCase().includes('interview')
  ).length;

  const highMatchPercentage = totalCandidates > 0 
    ? Math.round((highMatchCount / totalCandidates) * 100) 
    : 0;

  // Monthly Application Trend
  const applicationTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = months.map(m => ({ month: m, applications: 0, shortlisted: 0 }));

    candidates.forEach(c => {
      const date = c.created_at ? new Date(c.created_at) : new Date();
      const monthIndex = date.getMonth();
      if (monthIndex >= 0 && monthIndex < 12) {
        counts[monthIndex].applications += 1;
        if (c.ai_score === 'high' || c.is_pinned) {
          counts[monthIndex].shortlisted += 1;
        }
      }
    });

    const currentMonth = new Date().getMonth();
    const start = Math.max(0, currentMonth - 5);
    return counts.slice(start, currentMonth + 1);
  }, [candidates]);

  // Pipeline Status Breakdown
  const pipelineStatusData = useMemo(() => {
    const pending = candidates.filter(c => !c.status || c.status === 'pending').length;
    const shortlisted = shortlistedCount;
    const interviewing = interviewingCount;
    const hired = candidates.filter(c => c.status && c.status.toLowerCase().includes('hire')).length;
    const rejected = candidates.filter(c => c.status && c.status.toLowerCase().includes('reject')).length;

    return [
      { name: 'Pending Review', value: pending, color: '#94a3b8' },
      { name: 'Shortlisted', value: shortlisted, color: '#3b82f6' },
      { name: 'Interviewing', value: interviewing, color: '#8b5cf6' },
      { name: 'Hired / Offered', value: hired, color: '#10b981' },
      { name: 'Rejected', value: rejected, color: '#f43f5e' },
    ].filter(d => d.value > 0);
  }, [candidates, shortlistedCount, interviewingCount]);

  // Top Skills
  const topMatchedSkills = useMemo(() => {
    const freq: Record<string, number> = {};
    candidates.forEach(c => {
      (c.matched_skills || []).forEach((s: string) => {
        const clean = s.trim();
        if (clean) freq[clean] = (freq[clean] || 0) + 1;
      });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [candidates]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Client Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {client?.name || 'Client'} Hiring Dashboard
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Workspace Overview
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time candidate pipelines, job openings, and AI screening metrics for your company.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onNavigate?.('reports')}
            className="flex items-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4" />
            View Reports
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onNavigate?.('jobs')}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Manage Jobs
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Job Openings */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Openings</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{activeJobs.length}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span className="text-emerald-500 font-medium">Published</span> to career board
          </p>
        </div>

        {/* Total Candidates */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Applicants</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{totalCandidates}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            Across all active positions
          </p>
        </div>

        {/* High Match Rate */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">High Match Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {highMatchPercentage}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {highMatchCount} candidates scored 75%+
          </p>
        </div>

        {/* Shortlisted for Interview */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Shortlisted</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{shortlistedCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Ready for interview scheduling
          </p>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application & Shortlist Inflow */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Candidate Inflow & Shortlist Velocity</h3>
              <p className="text-xs text-muted-foreground">Monthly application volume vs. AI high-match candidates</p>
            </div>
            <Badge variant="outline" className="text-xs font-normal">
              Last 6 Months
            </Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={applicationTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="clientColorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="clientColorShort" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
                <YAxis allowDecimals={false} fontSize={11} stroke="#94a3b8" />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Area type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#clientColorApps)" name="Applications" />
                <Area type="monotone" dataKey="shortlisted" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#clientColorShort)" name="High Match" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Breakdown */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Pipeline Stage Breakdown</h3>
            <p className="text-xs text-muted-foreground">Candidate status across your company's ATS</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {pipelineStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pipelineStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-muted-foreground text-center">No candidate status data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recruiter Insights & Open Roles Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruiter Insights Widget */}
        <div className="lg:col-span-2">
          <RecruiterInsightsWidget candidates={candidates} />
        </div>

        {/* Top Matched Skills in Pool */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs">
          <h3 className="text-sm font-semibold text-foreground mb-1">Top Skills in Your Pool</h3>
          <p className="text-xs text-muted-foreground mb-4">Extracted directly from candidate resumes</p>
          <div className="space-y-3">
            {topMatchedSkills.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">No skills matched yet</div>
            ) : (
              topMatchedSkills.map(([skill, count]) => (
                <div key={skill} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground truncate">{skill}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full" 
                        style={{ width: `${Math.min(100, (count / Math.max(1, candidates.length)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Jobs Table */}
      <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Your Company's Active Job Openings</h3>
            <p className="text-xs text-muted-foreground">Manage active roles and view candidates screened by HireSortAi</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onNavigate?.('jobs')}
            className="text-xs"
          >
            View All in ATS
          </Button>
        </div>

        <div className="divide-y divide-border">
          {activeJobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No active job openings found for {client?.name || 'this workspace'}. Create one to start accepting applicants!
            </div>
          ) : (
            activeJobs.map(job => {
              const jobCandidates = candidates.filter(c => c.job_id === job.id);
              const highMatches = jobCandidates.filter(c => c.ai_score === 'high').length;

              return (
                <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground truncate">{job.title}</h4>
                      {job.hire_sort_enabled && <AIBadge />}
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {job.type || 'Full-Time'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.department || 'General'} • {job.location || 'Remote'} • Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{jobCandidates.length} Applicants</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {highMatches} High Match
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate?.('jobs')}
                      className="flex items-center gap-1 text-xs text-primary"
                    >
                      Review Candidates
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
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
                style={{ backgroundColor: entry.color || entry.fill || entry.payload?.fill || '#3b82f6' }} 
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
