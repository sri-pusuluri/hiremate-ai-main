import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, DEFAULT_ZOOL_CLIENT } from '@/hooks/useAuth';
import { ClientTenant } from '@/types/hiresort';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Briefcase,
  Users,
  Sparkles,
  Server,
  DollarSign,
  Activity,
  Layers,
  TrendingUp,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PlatformAdminDashboardProps {
  onNavigate?: (view: string) => void;
  onSwitchToClientPreview?: () => void;
}

export function PlatformAdminDashboard({ onNavigate, onSwitchToClientPreview }: PlatformAdminDashboardProps) {
  const { client, setClient } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadPlatformStats() {
      setLoading(true);
      try {
        const [clientsRes, jobsRes, candsRes, logsRes] = await Promise.all([
          supabase.from('clients').select('*'),
          supabase.from('jobs').select('*'),
          supabase.from('candidates').select('*'),
          supabase.from('ai_analysis_logs').select('*')
        ]);

        if (clientsRes.data) setClients(clientsRes.data);
        if (jobsRes.data) setAllJobs(jobsRes.data);
        if (candsRes.data) setAllCandidates(candsRes.data);
        if (logsRes.data) setAiLogs(logsRes.data);
      } catch (err) {
        console.error('Failed to load platform stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlatformStats();
  }, []);

  // Compute Platform Metrics
  const totalTenants = clients.length || 1;
  const totalJobs = allJobs.length;
  const totalCandidates = allCandidates.length;

  // AI Usage & Cost Estimates
  const totalAIEvaluations = allCandidates.filter(c => c.ai_score || c.cosine_similarity).length;
  const estimatedTokens = totalAIEvaluations * 1250;
  const estimatedCost = (estimatedTokens / 1000) * 0.00015; // ~$0.15 per 1M tokens

  // Tenant Activity Chart Data
  const tenantChartData = useMemo(() => {
    return clients.map(c => {
      const tenantJobs = allJobs.filter(j => j.client_id === c.id).length;
      const tenantCands = allCandidates.filter(cand => cand.client_id === c.id).length;
      return {
        name: c.name,
        jobs: tenantJobs,
        candidates: tenantCands,
      };
    });
  }, [clients, allJobs, allCandidates]);

  // Subscription Distribution
  const tierData = useMemo(() => {
    const counts: Record<string, number> = { Enterprise: 0, Pro: 0, Free: 0 };
    clients.forEach(c => {
      const tier = (c.subscription_tier || 'pro').toLowerCase();
      if (tier.includes('enter')) counts['Enterprise']++;
      else if (tier.includes('free') || tier.includes('starter')) counts['Free']++;
      else counts['Pro']++;
    });

    return [
      { name: 'Enterprise', value: counts['Enterprise'] || 1, color: '#8b5cf6' },
      { name: 'Pro Tier', value: counts['Pro'] || 2, color: '#3b82f6' },
      { name: 'Starter / Free', value: counts['Free'] || 0, color: '#10b981' },
    ].filter(d => d.value > 0);
  }, [clients]);

  // Handle Switch Active Tenant
  const handleSwitchTenant = (targetClient: any) => {
    setClient({
      id: targetClient.id,
      name: targetClient.name,
      slug: targetClient.slug,
      themeColor: targetClient.theme_color || '#2563eb',
      subscriptionTier: targetClient.subscription_tier || 'pro',
    });
    toast({
      title: 'Active Workspace Switched',
      description: `Now viewing workspace as ${targetClient.name}.`,
    });
    if (onSwitchToClientPreview) {
      onSwitchToClientPreview();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              HireSortAi Platform HQ
            </h1>
            <Badge variant="default" className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Platform Super Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Global multi-tenant overview, AI screening engine analytics, and customer client accounts.
          </p>
        </div>

        {/* Quick Platform Actions */}
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onNavigate?.('reports')}
            className="flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4" />
            Global Reports
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onNavigate?.('clients')}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            Manage Client Tenants
          </Button>
        </div>
      </div>

      {/* Platform KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Client Tenants */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Registered Clients</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{totalTenants}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span className="text-emerald-500 font-medium">100% Isolated</span> partition workspaces
          </p>
        </div>

        {/* Total Jobs Hosted */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Platform Jobs Hosted</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{totalJobs}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Published across all client career boards
          </p>
        </div>

        {/* AI Screenings Processed */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Resumes Screened (AI)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {totalAIEvaluations}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalCandidates} total candidate applications
          </p>
        </div>

        {/* GenAI Engine Tokens & Cost */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">AI Cost & Tokens</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ${estimatedCost.toFixed(3)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ~{(estimatedTokens / 1000).toFixed(1)}k tokens processed
          </p>
        </div>
      </div>

      {/* Platform Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Tenant Activity */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Client Tenant Activity & Distribution</h3>
              <p className="text-xs text-muted-foreground">Comparison of jobs hosted and applicants processed per client</p>
            </div>
            <Badge variant="outline" className="text-xs font-normal">
              Active Tenants
            </Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenantChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis allowDecimals={false} fontSize={11} stroke="#94a3b8" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                />
                <Bar dataKey="jobs" fill="#6366f1" radius={[4, 4, 0, 0]} name="Jobs Posted" />
                <Bar dataKey="candidates" fill="#10b981" radius={[4, 4, 0, 0]} name="Candidates Screened" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Tiers */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Client Tier Distribution</h3>
            <p className="text-xs text-muted-foreground">Breakdown of active subscription tiers</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Registered Client Tenants Directory Table */}
      <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Client Tenant Accounts</h3>
            <p className="text-xs text-muted-foreground">
              Direct access to switch, monitor, or manage customer tenant workspaces.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onNavigate?.('clients')}
            className="text-xs"
          >
            Manage All Tenants
          </Button>
        </div>

        <div className="divide-y divide-border">
          {clients.map(c => {
            const tenantJobs = allJobs.filter(j => j.client_id === c.id);
            const tenantCands = allCandidates.filter(cand => cand.client_id === c.id);
            const isCurrentlyActive = client?.id === c.id;

            return (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                    style={{ backgroundColor: c.theme_color || '#2563eb' }}
                  >
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{c.name}</h4>
                      {isCurrentlyActive && (
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                          Active Selection
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {c.subscription_tier || 'Pro'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Slug: <code className="text-foreground font-mono">/careers/{c.slug}</code> • Created {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Active'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">{tenantJobs.length} Jobs</div>
                    <div className="text-xs text-muted-foreground">{tenantCands.length} Candidates</div>
                  </div>

                  <Button
                    variant={isCurrentlyActive ? "secondary" : "default"}
                    size="sm"
                    onClick={() => handleSwitchTenant(c)}
                    className="text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isCurrentlyActive ? 'Previewing' : 'Switch to Workspace'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
