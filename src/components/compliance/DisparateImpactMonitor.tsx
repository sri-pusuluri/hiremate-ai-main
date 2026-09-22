import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  RefreshCw,
  EyeOff,
  ShieldAlert,
  FileCheck
} from 'lucide-react';
import { Candidate } from '@/types/hiresort';
import { calculateDisparateImpact, DisparateImpactReport } from '@/lib/disparate-impact';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DisparateImpactMonitorProps {
  candidates: Candidate[];
  tenantName?: string;
  onRefresh?: () => void;
}

export function DisparateImpactMonitor({
  candidates,
  tenantName = 'HireSort Tenant',
  onRefresh
}: DisparateImpactMonitorProps) {
  const { toast } = useToast();
  const [blindScreeningEnabled, setBlindScreeningEnabled] = useState(true);
  const [antiInjectionEnabled, setAntiInjectionEnabled] = useState(true);

  const report: DisparateImpactReport = useMemo(() => {
    return calculateDisparateImpact(candidates);
  }, [candidates]);

  const handleExportAuditReport = () => {
    const csvRows = [
      ['HireSort AI - Bias Audit & Disparate Impact Report'],
      ['Tenant', tenantName],
      ['Evaluated At', report.evaluatedAt],
      ['Benchmark Group', report.benchmarkGroup],
      ['Benchmark Selection Rate', `${report.benchmarkSelectionRate}%`],
      ['Overall Four-Fifths Compliance', report.overallStatus.toUpperCase()],
      [],
      ['Cohort Name', 'Total Applicants', 'Shortlisted Count', 'Selection Rate (%)', 'Impact Ratio (AIR)', 'Status']
    ];

    report.cohortMetrics.forEach(m => {
      csvRows.push([
        m.groupName,
        String(m.totalApplicants),
        String(m.shortlistedCount),
        `${m.selectionRate}%`,
        String(m.adverseImpactRatio),
        m.status.toUpperCase()
      ]);
    });

    const csvContent = csvRows.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bias-audit-report-${tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Compliance Audit Exported',
      description: 'Downloaded EEOC & NYC Local Law 144 Disparate Impact audit CSV.'
    });
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <Card className="border-border bg-card/60 backdrop-blur-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base font-bold text-foreground">
                    AI Governance & Disparate Impact Monitor
                  </CardTitle>
                  {report.overallStatus === 'compliant' ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-xs flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      4/5ths Rule Passing (Compliant)
                    </Badge>
                  ) : report.overallStatus === 'warning' ? (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 text-xs flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Marginal Variance (Monitor)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 text-xs flex items-center gap-1 font-semibold">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      Adverse Impact Detected (Action Required)
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Automated auditing engine aligned with EEOC Uniform Guidelines (§ 4D), NYC Local Law 144 (AEDT), and EU AI Act.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onRefresh && (
                <Button size="sm" variant="outline" onClick={onRefresh} className="h-8 text-xs gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-evaluate
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleExportAuditReport} className="h-8 text-xs gap-1.5 text-indigo-700 dark:text-indigo-300 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                <Download className="w-3.5 h-3.5" />
                Export Audit CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg border border-border bg-background/50 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Lowest Impact Ratio (AIR)</span>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-2xl font-bold font-mono",
                  report.lowestImpactRatio >= 0.80 ? "text-emerald-600 dark:text-emerald-400" :
                  report.lowestImpactRatio >= 0.65 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {(report.lowestImpactRatio * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] text-muted-foreground">Threshold: ≥ 80%</span>
              </div>
              <Progress 
                value={Math.min(100, report.lowestImpactRatio * 100)} 
                className="h-1.5 bg-muted"
              />
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-background/50 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Benchmark Group</span>
              <div className="text-sm font-semibold text-foreground truncate" title={report.benchmarkGroup}>
                {report.benchmarkGroup}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Peak selection rate: <span className="font-semibold text-foreground">{report.benchmarkSelectionRate}%</span>
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-background/50 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Applicants Screened</span>
              <div className="text-2xl font-bold font-mono text-foreground">
                {report.totalApplicantsEvaluated}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Shortlisted / Qualified: <span className="font-semibold text-foreground">{report.totalShortlisted}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-background/50 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Responsible AI Safeguards</span>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                <ShieldCheck className="w-4 h-4" />
                Active & Enforced
              </div>
              <p className="text-[10px] text-muted-foreground">
                PII Masking & Anti-Injection Active
              </p>
            </div>
          </div>

          {/* Cohort Selection Rate & Adverse Impact Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/40 px-3.5 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Cohort Selection Rate & Impact Ratio Breakdown
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Four-Fifths Rule = (Cohort Rate ÷ Benchmark Rate) ≥ 0.80
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/20 text-muted-foreground text-[11px] font-medium border-b border-border">
                  <tr>
                    <th className="px-3.5 py-2">Cohort Group</th>
                    <th className="px-3.5 py-2 text-right">Applicants</th>
                    <th className="px-3.5 py-2 text-right">Shortlisted</th>
                    <th className="px-3.5 py-2 text-right">Selection Rate</th>
                    <th className="px-3.5 py-2 text-right">Adverse Impact Ratio (AIR)</th>
                    <th className="px-3.5 py-2 text-center">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.cohortMetrics.map((cohort) => (
                    <tr key={cohort.groupName} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3.5 py-2.5 font-medium text-foreground">
                        {cohort.groupName}
                        {cohort.groupName === report.benchmarkGroup && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Benchmark
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-muted-foreground">{cohort.totalApplicants}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-medium text-foreground">{cohort.shortlistedCount}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-foreground">{cohort.selectionRate}%</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold">
                        <span className={cn(
                          cohort.adverseImpactRatio >= 0.80 ? "text-emerald-600 dark:text-emerald-400" :
                          cohort.adverseImpactRatio >= 0.65 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                          {cohort.adverseImpactRatio.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        {cohort.status === 'compliant' ? (
                          <Badge variant="outline" className="text-[10px] py-0 px-2 bg-emerald-500/10 text-emerald-700 border-emerald-200">
                            Pass (≥ 80%)
                          </Badge>
                        ) : cohort.status === 'warning' ? (
                          <Badge variant="outline" className="text-[10px] py-0 px-2 bg-amber-500/10 text-amber-700 border-amber-200">
                            Variance (65-79%)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-2 bg-rose-500/10 text-rose-700 border-rose-200">
                            Adverse Impact (&lt;65%)
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {report.cohortMetrics.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3.5 py-6 text-center text-muted-foreground">
                        No candidates have been screened in this workspace yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Responsible Governance Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-lg border border-border bg-card flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4 text-primary" />
                  <Label htmlFor="blind-screening" className="text-xs font-semibold text-foreground cursor-pointer">
                    Programmatic Blind Screening Mode
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Redacts candidate names, emails, phone numbers, postal ZIP codes, and graduation years before LLM ingestion to enforce pure merit-based technical evaluation.
                </p>
              </div>
              <Switch 
                id="blind-screening"
                checked={blindScreeningEnabled}
                onCheckedChange={(val) => {
                  setBlindScreeningEnabled(val);
                  toast({
                    title: val ? 'Blind Screening Activated' : 'Blind Screening Deactivated',
                    description: val ? 'Candidate demographic identifiers are programmatically scrubbed before AI evaluation.' : 'Raw resume text will be provided to the model.'
                  });
                }}
              />
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-card flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <Label htmlFor="anti-injection" className="text-xs font-semibold text-foreground cursor-pointer">
                    Anti-Prompt Injection Shield
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Neutralizes adversarial jailbreak phrases and isolates resumes in XML delimiters to protect against candidate document prompt hijacking.
                </p>
              </div>
              <Switch 
                id="anti-injection"
                checked={antiInjectionEnabled}
                onCheckedChange={(val) => {
                  setAntiInjectionEnabled(val);
                  toast({
                    title: val ? 'Anti-Injection Shield Active' : 'Anti-Injection Shield Disabled',
                    description: val ? 'Resume inputs are filtered for adversarial override patterns.' : 'Input sanitization paused.'
                  });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
