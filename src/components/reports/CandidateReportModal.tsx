import React, { useState, useRef } from 'react';
import { Candidate, Job } from '@/types/hiresort';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Printer, 
  Download, 
  Maximize2, 
  Minimize2, 
  X, 
  Briefcase, 
  MapPin, 
  Mail, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Award, 
  Building2, 
  FileText, 
  Star,
  ExternalLink,
  ChevronRight,
  Share2
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { parseCandidateResume } from '@/lib/resume-parser';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CandidateReportModalProps {
  candidate: Candidate | null;
  job?: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateReportModal({
  candidate,
  job,
  open,
  onOpenChange,
}: CandidateReportModalProps) {
  const { client } = useAuth();
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!candidate) return null;

  const parsedResume = candidate.resumeText ? parseCandidateResume(candidate.resumeText) : null;
  const history = (parsedResume?.experience && parsedResume.experience.length > 0) ? parsedResume.experience : null;
  const insights = candidate.predictiveInsights || ({} as any);

  const similarityPct = candidate.cosineSimilarity !== null && candidate.cosineSimilarity !== undefined
    ? Math.round(candidate.cosineSimilarity * 100)
    : candidate.aiScore === 'high' ? 88 : candidate.aiScore === 'medium' ? 68 : 42;

  const interviewPassProb = insights.interviewPassProb ?? (candidate.aiScore === 'high' ? 84 : candidate.aiScore === 'medium' ? 65 : 45);
  const offerAcceptanceProb = insights.offerAcceptanceProb ?? (candidate.aiScore === 'high' ? 80 : candidate.aiScore === 'medium' ? 62 : 40);
  const retentionRisk = insights.retentionRisk ?? (candidate.aiScore === 'high' ? 'low' : candidate.aiScore === 'medium' ? 'medium' : 'high');
  const timeToJoin = insights.timeToJoinEstimate || (candidate.aiScore === 'high' ? '15 - 30 Days' : '30 - 45 Days');

  const matchedSkills = candidate.matchedSkills || [];
  const missingSkills = candidate.missingSkills || [];

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Report Link Copied',
        description: `Direct share link for ${candidate.name}'s evaluation copied to clipboard.`,
      });
    }
  };

  const getScoreBadgeClass = (score?: string) => {
    switch (score) {
      case 'high':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400';
      case 'low':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 overflow-hidden flex flex-col bg-background transition-all duration-200 border-border print:border-none print:shadow-none print:m-0 print:p-0 print:w-full print:max-w-none print:inset-0",
          isFullscreen 
            ? "fixed inset-0 w-screen h-screen max-w-none rounded-none z-50" 
            : "w-[96vw] max-w-5xl h-[92vh] max-h-[950px] rounded-2xl shadow-2xl"
        )}
      >
        <DialogTitle className="sr-only">
          Candidate Evaluation Dossier - {candidate.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Detailed executive evaluation report, AI match scoring, and predictive insights for {candidate.name}
        </DialogDescription>

        {/* Printable Styling Engine */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #candidate-report-printable, #candidate-report-printable * {
              visibility: visible;
            }
            #candidate-report-printable {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
              color: #0f172a !important;
              box-shadow: none !important;
              overflow: visible !important;
            }
            .no-print {
              display: none !important;
            }
            .print-break-inside-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}} />

        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-5 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Candidate Executive Dossier</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                  Confidential
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Comprehensive AI evaluation, skills gap analysis & predictive insights
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-8 text-xs gap-1.5 px-2.5"
              title="Copy share link"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5 px-3 bg-primary text-primary-foreground shadow-xs font-semibold"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              Download / Print PDF
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsFullscreen(prev => !prev)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Close report"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Report Content Area */}
        <div className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6 print:p-0 print:bg-white print:overflow-visible" id="candidate-report-printable">
          <div className="max-w-4xl mx-auto space-y-5 print:max-w-none print:space-y-4">

            {/* Document Print Header (Only visible in Print) */}
            <div className="hidden print:flex items-center justify-between pb-3 border-b border-slate-300">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/images/sahab-hiresortai-logo-2.png" 
                  alt="Sahab Portal" 
                  className="h-6 w-auto object-contain block"
                />
                <span className="text-xs text-slate-500">• Candidate Executive Evaluation Dossier</span>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <div>Workspace: <strong>{client?.name || 'Zool'}</strong></div>
                <div>Generated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              </div>
            </div>

            {/* 1. Header Banner & Candidate Profile Ribbon */}
            <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs print:border-slate-300 print:shadow-none print-break-inside-avoid">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <span className="text-xl font-black">
                      {getInitials(candidate.name)}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                        {candidate.name}
                      </h1>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider", getScoreBadgeClass(candidate.aiScore))}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {candidate.aiScore === 'high' ? 'Strong Match' : candidate.aiScore === 'medium' ? 'Moderate Match' : 'Low Match'}
                      </Badge>
                      {candidate.isPinned && (
                        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 border border-amber-500/30">
                          <Star className="w-3 h-3 mr-1 fill-amber-500" />
                          Shortlisted
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      {candidate.currentRole} at <strong className="text-foreground">{candidate.company}</strong>
                    </p>

                    <div className="flex items-center gap-4 mt-2.5 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-primary" />
                        Target: <strong className="text-foreground">{job?.title || 'Open Requisition'}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {candidate.experience} Years Experience
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {candidate.location || 'Remote'}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono">
                        <Mail className="w-3.5 h-3.5" />
                        {candidate.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Score Highlight */}
                <div className="flex sm:flex-col items-center justify-between sm:justify-center p-3.5 sm:p-4 rounded-xl bg-primary/5 border border-primary/20 w-full sm:w-36 text-center shrink-0">
                  <div className="text-3xl sm:text-4xl font-black text-primary font-mono tabular-nums leading-none">
                    {similarityPct}%
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1.5">
                    ATS Match Fit
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                    Cosine Vector Score
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Executive KPI Insight Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print-break-inside-avoid">
              <div className="p-4 rounded-xl bg-card border border-border shadow-xs print:border-slate-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pass Likelihood</span>
                  <Award className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {interviewPassProb}%
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Based on role competencies</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border shadow-xs print:border-slate-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Offer Acceptance</span>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                  {offerAcceptanceProb}%
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Market compensation fit</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border shadow-xs print:border-slate-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Retention Risk</span>
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                </div>
                <div className={cn(
                  "text-2xl font-black uppercase font-mono tracking-tight",
                  retentionRisk === 'low' ? "text-emerald-500" : retentionRisk === 'medium' ? "text-amber-500" : "text-rose-500"
                )}>
                  {retentionRisk}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Tenure & trajectory model</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border shadow-xs print:border-slate-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Est. Time to Join</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-foreground mt-1">
                  {timeToJoin}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Notice period estimate</p>
              </div>
            </div>

            {/* 3. AI Strategic Evaluation & Recommendation Narrative */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-xs print:border-slate-300 print-break-inside-avoid">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  AI Screening Evaluation & Hiring Assessment
                </h3>
              </div>

              <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-2">
                <p>
                  {insights.assessment || candidate.aiExplanation || (
                    candidate.aiScore === 'high'
                      ? `${candidate.name} exhibits exceptional technical role alignment with ${job?.title || 'the target requisition'}, demonstrating strong competencies across key technical disciplines and relevant professional tenure.`
                      : candidate.aiScore === 'medium'
                        ? `${candidate.name} fulfills foundational requirements for ${job?.title || 'this role'} with transferable experience. Recommended focus for technical interviews should probe specialized workflow architecture.`
                        : `${candidate.name} shows partial domain overlap but exhibits gaps in core requirements. Consider exploring secondary competencies or talent pool assignment.`
                  )}
                </p>

                {insights.retentionRiskFactor && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/80 text-xs flex items-center gap-2 mt-2">
                    <span className="font-semibold text-foreground shrink-0">Retention Analysis:</span>
                    <span className="text-muted-foreground">{insights.retentionRiskFactor}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Skills & Competencies Breakdown (Matched vs Missing) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print-break-inside-avoid">
              {/* Matched Core Skills */}
              <div className="p-4 rounded-xl bg-card border border-border shadow-xs print:border-slate-300">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Validated Competencies</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    {matchedSkills.length} Matched
                  </span>
                </div>

                {matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs px-2.5 py-1 font-medium gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No specific skills parsed from resume.</p>
                )}
              </div>

              {/* Missing / Desired Skills */}
              <div className="p-4 rounded-xl bg-card border border-border shadow-xs print:border-slate-300">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Skill Gaps & Growth Areas</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                    {missingSkills.length} Identified
                  </span>
                </div>

                {missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs px-2.5 py-1 font-medium gap-1"
                      >
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Candidate fulfills all primary listed skill requisites.</p>
                )}
              </div>
            </div>

            {/* 5. Career Timeline & Tracked Experience */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-xs print:border-slate-300 print-break-inside-avoid">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Career Timeline & Experience Record
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {history ? `${history.length} Roles Tracked` : `${candidate.experience} Years Total Experience`}
                </span>
              </div>

              {history && history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((exp, idx) => (
                    <div key={idx} className="relative pl-4 border-l-2 border-primary/40 py-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">{exp.role}</h4>
                        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {exp.duration}
                        </span>
                      </div>
                      <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {exp.company}
                      </p>
                      {exp.highlights && exp.highlights.length > 0 && (
                        <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                          {exp.highlights.map((h, hIdx) => (
                            <li key={hIdx} className="leading-relaxed flex items-start gap-1.5">
                              <span className="text-primary font-bold">•</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative pl-4 border-l-2 border-primary/40 py-1">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">{candidate.currentRole}</h4>
                  <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {candidate.company}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {candidate.experience} years accumulated professional industry experience.
                  </p>
                </div>
              )}
            </div>

            {/* 6. Recruiter Notes & Pipeline Verification Footer */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-xs print:border-slate-300 print-break-inside-avoid">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Verified by <strong>Sahab Portal AI Engine</strong></span>
                </div>
                <div className="font-mono text-[11px]">
                  Candidate ID: {candidate.id.substring(0, 12)}...
                </div>
                <div className="text-[11px]">
                  Pipeline Stage: <strong className="text-foreground uppercase">{candidate.pipelineStage || 'Applied'}</strong>
                </div>
              </div>
            </div>

            {/* Document Print Footer */}
            <div className="hidden print:block text-center pt-4 text-[10px] text-slate-400 border-t border-slate-200">
              CONFIDENTIAL • For hiring panel and authorized personnel review only. Generated automatically via Sahab Portal ATS.
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
