import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
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

// Mock data for charts
const applicationTrendData = [
  { month: 'Jan', applications: 245, shortlisted: 45 },
  { month: 'Feb', applications: 312, shortlisted: 62 },
  { month: 'Mar', applications: 428, shortlisted: 89 },
  { month: 'Apr', applications: 389, shortlisted: 78 },
  { month: 'May', applications: 456, shortlisted: 95 },
  { month: 'Jun', applications: 523, shortlisted: 112 },
];

const pipelineData = [
  { stage: 'Applied', count: 847, color: 'hsl(var(--muted-foreground))' },
  { stage: 'Screened', count: 234, color: 'hsl(var(--primary))' },
  { stage: 'Interview', count: 89, color: 'hsl(var(--ai-accent))' },
  { stage: 'Offer', count: 23, color: 'hsl(var(--success))' },
  { stage: 'Hired', count: 12, color: 'hsl(var(--success))' },
];

const aiUsageData = [
  { name: 'AI Suggested', value: 68, color: 'hsl(var(--ai-accent))' },
  { name: 'Recruiter Added', value: 32, color: 'hsl(var(--primary))' },
];

const teamPerformanceData = [
  { name: 'Sarah Chen', screened: 145, hired: 8, avgTime: 4.2 },
  { name: 'Mike Johnson', screened: 128, hired: 6, avgTime: 5.1 },
  { name: 'Priya Sharma', screened: 112, hired: 7, avgTime: 3.8 },
  { name: 'David Kim', screened: 98, hired: 5, avgTime: 4.5 },
];

export default function Dashboard() {
  const { profile, role } = useAuth();

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
          value="1,247"
          change="+12.5%"
          changeType="positive"
          icon={Users}
          description="vs last month"
        />
        <StatCard
          title="Active Jobs"
          value="8"
          change="+2"
          changeType="positive"
          icon={Briefcase}
          description="new this week"
        />
        <StatCard
          title="AI Ranked"
          value="847"
          change="68%"
          changeType="neutral"
          icon={Sparkles}
          description="of total candidates"
        />
        <StatCard
          title="Avg. Time to Hire"
          value="18 days"
          change="-3 days"
          changeType="positive"
          icon={Clock}
          description="vs last quarter"
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
          <RecruiterInsightsWidget />
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
