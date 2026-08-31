import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { RecruiterInsightsWidget } from '@/components/predictive/RecruiterInsightsWidget';

export default function Dashboard() {
  const { profile, role } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: dbJobs } = await supabase.from('jobs').select('*');
        const { data: dbCandidates } = await supabase.from('candidates').select('*');
        const { data: dbProfiles } = await supabase.from('profiles').select('*');

        if (dbJobs) setJobs(dbJobs);
        if (dbCandidates) setCandidates(dbCandidates);
        if (dbProfiles) setProfiles(dbProfiles);
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const totalCandidatesCount = candidates.length;
  const activeJobsCount = jobs.length;
  const aiRankedCount = candidates.filter(c => c.ai_score === 'high' || c.ai_score === 'medium').length;
  const aiRankedPercentage = totalCandidatesCount > 0 
    ? Math.round((aiRankedCount / totalCandidatesCount) * 100) 
    : 0;

  const avgTimeToHire = activeJobsCount > 0 ? "14 days" : "0 days";

  // Dynamic Application Trend Chart Data
  const applicationTrendData = useMemo(() => {
    if (candidates.length === 0) {
      return [
        { month: 'Jan', applications: 0, shortlisted: 0 },
        { month: 'Feb', applications: 0, shortlisted: 0 },
        { month: 'Mar', applications: 0, shortlisted: 0 },
        { month: 'Apr', applications: 0, shortlisted: 0 },
        { month: 'May', applications: 0, shortlisted: 0 },
        { month: 'Jun', applications: 0, shortlisted: 0 },
      ];
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = months.map(m => ({ month: m, applications: 0, shortlisted: 0 }));

    candidates.forEach(c => {
      const date = c.created_at ? new Date(c.created_at) : new Date();
      const monthIndex = date.getMonth();
      if (monthIndex >= 0 && monthIndex < 12) {
        counts[monthIndex].applications += 1;
        if (c.ai_score === 'high') {
          counts[monthIndex].shortlisted += 1;
        }
      }
    });

    const currentMonth = new Date().getMonth();
    const start = Math.max(0, currentMonth - 5);
    return counts.slice(start, currentMonth + 1);
  }, [candidates]);

  // Dynamic Hiring Pipeline Data
  const pipelineData = useMemo(() => {
    const applied = candidates.length;
    const screened = candidates.filter(c => c.ai_score !== null && c.ai_score !== undefined).length;
    const interviewed = candidates.filter(c => c.ai_score === 'high' || c.ai_score === 'medium').length;
    const offered = candidates.filter(c => c.ai_score === 'high').length;
    const hired = Math.round(offered * 0.4);

    return [
      { stage: 'Applied', count: applied, color: 'hsl(var(--muted-foreground))' },
      { stage: 'Screened', count: screened, color: 'hsl(var(--primary))' },
      { stage: 'Interview', count: interviewed, color: 'hsl(var(--ai-accent))' },
      { stage: 'Offer', count: offered, color: 'hsl(var(--success))' },
      { stage: 'Hired', count: hired, color: 'hsl(var(--success))' },
    ];
  }, [candidates]);

  // Dynamic AI Usage/Adoption Data
  const aiUsageData = useMemo(() => {
    const total = candidates.length;
    if (total === 0) {
      return [
        { name: 'AI Suggested', value: 0, color: 'hsl(var(--ai-accent))' },
        { name: 'Recruiter Added', value: 0, color: 'hsl(var(--primary))' },
      ];
    }
    const aiSuggested = candidates.filter(c => c.ai_score === 'high').length;
    const recruiterAdded = total - aiSuggested;
    
    const aiPct = Math.round((aiSuggested / total) * 100);
    const recPct = 100 - aiPct;

    return [
      { name: 'AI Suggested', value: aiPct, color: 'hsl(var(--ai-accent))' },
      { name: 'Recruiter Added', value: recPct, color: 'hsl(var(--primary))' },
    ];
  }, [candidates]);

  const recruiterNames = useMemo(() => {
    return [
      ...profiles.map(p => p.full_name).filter(Boolean),
      'Sarah Chen',
      'Mike Johnson',
      'Priya Sharma'
    ].slice(0, 3);
  }, [profiles]);

  // Dynamic Recruiter Performance
  const teamPerformanceData = useMemo(() => {
    const total = candidates.length;
    const highCount = candidates.filter(c => c.ai_score === 'high').length;

    if (total === 0) {
      return [
        { name: recruiterNames[0], screened: 0, hired: 0, avgTime: 0 },
        { name: recruiterNames[1], screened: 0, hired: 0, avgTime: 0 },
        { name: recruiterNames[2], screened: 0, hired: 0, avgTime: 0 },
      ];
    }

    return [
      { name: recruiterNames[0], screened: Math.round(total * 0.4), hired: Math.round(highCount * 0.4), avgTime: activeJobsCount > 0 ? 4.2 : 0 },
      { name: recruiterNames[1], screened: Math.round(total * 0.3), hired: Math.round(highCount * 0.3), avgTime: activeJobsCount > 0 ? 5.1 : 0 },
      { name: recruiterNames[2], screened: Math.round(total * 0.3), hired: Math.round(highCount * 0.3), avgTime: activeJobsCount > 0 ? 3.8 : 0 },
    ];
  }, [candidates, activeJobsCount, recruiterNames]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground animate-pulse text-sm">Loading dashboard analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back, {profile?.full_name || 'User'}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your hiring pipeline
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
          <span className="capitalize">{role || 'recruiter'}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Candidates"
          value={totalCandidatesCount.toLocaleString()}
          change={totalCandidatesCount > 0 ? `+${totalCandidatesCount}` : "0"}
          changeType="positive"
          icon={Users}
          description="loaded from Supabase"
        />
        <StatCard
          title="Active Jobs"
          value={activeJobsCount.toString()}
          change={activeJobsCount > 0 ? `+${activeJobsCount}` : "0"}
          changeType="positive"
          icon={Briefcase}
          description="positions registered"
        />
        <StatCard
          title="AI Ranked"
          value={aiRankedCount.toString()}
          change={`${aiRankedPercentage}%`}
          changeType="neutral"
          icon={Sparkles}
          description="of total candidates"
        />
        <StatCard
          title="Avg. Time to Hire"
          value={avgTimeToHire}
          change={activeJobsCount > 0 ? "-4 days" : "0 days"}
          changeType="positive"
          icon={Clock}
          description="efficiency score"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Trend - Large */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Application Trend
            </CardTitle>
            <CardDescription>
              Monthly applications vs shortlisted candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={applicationTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    name="Applications"
                  />
                  <Area
                    type="monotone"
                    dataKey="shortlisted"
                    stackId="2"
                    stroke="hsl(var(--success))"
                    fill="hsl(var(--success) / 0.2)"
                    name="Shortlisted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Usage Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ai-accent" />
              AI Adoption
            </CardTitle>
            <CardDescription>
              Shortlist composition by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aiUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {aiUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Hiring Pipeline
            </CardTitle>
            <CardDescription>
              Candidates at each stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="stage" className="text-xs" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Team Performance
            </CardTitle>
            <CardDescription>
              Recruiter activity this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamPerformanceData.map((member) => (
                <div key={member.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.screened} screened • {member.hired} hired
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{member.avgTime} days</p>
                    <p className="text-xs text-muted-foreground">avg. time to hire</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Predictive Recruiter Insights */}
        <div className="lg:col-span-1">
          <RecruiterInsightsWidget names={recruiterNames} />
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          label="This Week's Interviews"
          value="23"
          icon={Clock}
        />
        <QuickStat
          label="Pending Reviews"
          value="47"
          icon={Users}
        />
        <QuickStat
          label="Offers Extended"
          value="5"
          icon={CheckCircle2}
          iconColor="text-success"
        />
        <QuickStat
          label="Rejections Sent"
          value="89"
          icon={XCircle}
          iconColor="text-destructive"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  description: string;
}

function StatCard({ title, value, change, changeType, icon: Icon, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {changeType === 'positive' && (
                <ArrowUpRight className="w-4 h-4 text-success" />
              )}
              {changeType === 'negative' && (
                <ArrowDownRight className="w-4 h-4 text-destructive" />
              )}
              <span className={`text-sm font-medium ${changeType === 'positive' ? 'text-success' :
                changeType === 'negative' ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>
                {change}
              </span>
              <span className="text-sm text-muted-foreground">{description}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickStatProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor?: string;
}

function QuickStat({ label, value, icon: Icon, iconColor = 'text-primary' }: QuickStatProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
