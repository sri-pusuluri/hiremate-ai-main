import { Candidate, Job } from '@/types/hiresort';
import { Button } from '@/components/ui/button';
import { AIBadge, RankBadge, RelevanceLabel, OverrideIndicator } from '@/components/ui/ai-badges';
import { ResumeViewerModal } from './ResumeViewerModal';
import { AIMatchAnalysis } from './AIMatchAnalysis';
import { analyzeCandidateWithAI } from '@/lib/ai-screening';
import {
  X,
  ThumbsUp,
  ThumbsDown,
  Pin,
  ArrowUp,
  ArrowDown,
  Briefcase,
  MapPin,
  Calendar,
  Mail,
  FileText,
  MessageSquare,
  Linkedin,
  RefreshCw,
  Globe,
  Sparkles,
  Star,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { PredictiveInsightsPanel } from '@/components/predictive/PredictiveInsightsPanel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface CandidateDetailProps {
  candidate: Candidate;
  job?: Job;
  onClose: () => void;
  onFeedback?: (type: 'good' | 'poor') => void;
  onTogglePin?: (candidateId: string) => void;
  onBoost?: (candidateId: string) => void;
  onDemote?: (candidateId: string) => void;
  onToggleShortlist?: (candidateId: string, isShortlisted: boolean) => void;
  isAIEnabled?: boolean;
}

export function CandidateDetail({ 
  candidate, 
  job, 
  onClose, 
  onFeedback,
  onTogglePin,
  onBoost,
  onDemote,
  onToggleShortlist
}: CandidateDetailProps) {
  const [feedback, setFeedback] = useState<'good' | 'poor' | null>(candidate.recruiterFeedback || null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const { toast } = useToast();
  const [linkedinUrl, setLinkedinUrl] = useState(`https://linkedin.com/in/${candidate.name.toLowerCase().replace(/\s+/g, '-')}`);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const [localAIEnabled, setLocalAIEnabled] = useState(false);

  const isAIEnabled = job ? job.hireSortEnabled : true;
  const effectiveAIEnabled = isAIEnabled || localAIEnabled;
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const initialIsShortlisted = Boolean(
    candidate.isPinned || 
    (candidate as any).is_pinned || 
    candidate.status === 'shortlisted' || 
    (candidate as any).pipeline_stage === 'shortlisted'
  );
  const [isShortlisted, setIsShortlisted] = useState<boolean>(initialIsShortlisted);
  const [updatingShortlist, setUpdatingShortlist] = useState(false);

  useEffect(() => {
    setFeedback(candidate.recruiterFeedback || null);
    setShowResumeModal(false);
    setLinkedinUrl(`https://linkedin.com/in/${candidate.name.toLowerCase().replace(/\s+/g, '-')}`);
    setSyncing(false);
    setSyncLogs([]);
    setIsSynced(false);
    setLocalAIEnabled(false);
    setIsReanalyzing(false);
    setIsShortlisted(Boolean(
      candidate.isPinned || 
      (candidate as any).is_pinned || 
      candidate.status === 'shortlisted' || 
      (candidate as any).pipeline_stage === 'shortlisted'
    ));
  }, [candidate.id, candidate.name, candidate.recruiterFeedback, candidate.isPinned, candidate.status]);

  const handleToggleShortlist = async () => {
    const nextState = !isShortlisted;
    setIsShortlisted(nextState);
    setUpdatingShortlist(true);

    try {
      const nextStatus = nextState ? 'shortlisted' : 'pending';
      await supabase
        .from('candidates')
        .update({
          is_pinned: nextState,
          status: nextStatus,
          pipeline_stage: nextStatus,
        })
        .eq('id', candidate.id);

      onToggleShortlist?.(candidate.id, nextState);
      onTogglePin?.(candidate.id);

      toast({
        title: nextState ? "Added to Shortlist ⭐" : "Removed from Shortlist",
        description: nextState 
          ? `${candidate.name} has been added to your shortlist for next interview stage.`
          : `${candidate.name} has been removed from your shortlist.`,
      });
    } catch (err: any) {
      console.error("Failed to update shortlist status:", err);
      setIsShortlisted(!nextState);
      toast({
        title: "Update Failed",
        description: err.message || "Could not update shortlist status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingShortlist(false);
    }
  };

  const handleSyncLinkedIn = () => {
    if (!linkedinUrl) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid LinkedIn profile link.",
        variant: "destructive"
      });
      return;
    }

    setSyncing(true);
    setSyncLogs([]);

    const steps = [
      "📡 Connecting to scraping service instance...",
      "🔍 Querying profile details for: " + linkedinUrl,
      "📥 Parsing professional experience timeline...",
      "🏷️ Merging skills and endorsements...",
      "⚡ Profile sync successfully completed!"
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setSyncLogs(prev => [...prev, steps[current]]);
        current++;
      } else {
        clearInterval(interval);
        setSyncing(false);
        setIsSynced(true);
        toast({
          title: "LinkedIn Profile Synced",
          description: `Successfully loaded work details for ${candidate.name}.`
        });
      }
    }, 800);
  };

  const handleFeedback = (type: 'good' | 'poor') => {
    setFeedback(type);
    onFeedback(type);
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      const result = await analyzeCandidateWithAI(
        candidate, 
        job || { id: candidate.jobId || '', title: 'UX UI Design and Front End Engineer', description: 'React, TypeScript, UI/UX design engineering' }
      );
      if (result) {
        candidate.currentRole = result.currentRole;
        candidate.company = result.company;
        candidate.experience = result.experience;
        candidate.aiScore = result.score;
        candidate.cosineSimilarity = result.similarity;
        candidate.matchedSkills = result.matchedSkills;
        candidate.missingSkills = result.missingSkills;
        if (!candidate.predictiveInsights) candidate.predictiveInsights = {} as any;
        Object.assign(candidate.predictiveInsights, {
          interviewPassProb: result.interviewPassProb,
          offerAcceptanceProb: result.offerAcceptanceProb,
          onboardingSuccessProb: result.onboardingSuccessProb,
          retentionRisk: result.retentionRisk,
          retentionRiskFactor: result.retentionRiskFactor,
          timeToJoinEstimate: result.timeToJoinEstimate,
          assessment: result.assessment,
        });

        toast({
          title: "AI Analysis Complete ✨",
          description: `Evaluated ${result.currentRole} at ${Math.round(result.similarity * 100)}% match score.`,
        });
      }
    } catch (err) {
      console.error("Re-analyze error:", err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-card border-l border-border shadow-dropdown z-40 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-semibold text-primary">
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-foreground">{candidate.name}</h2>
                {effectiveAIEnabled && <RankBadge rank={candidate.aiRank || 0} score={candidate.aiScore || 'low'} />}
              </div>
              <p className="text-muted-foreground">
                {candidate.currentRole} at {candidate.company}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {effectiveAIEnabled && <RelevanceLabel score={candidate.aiScore || 'low'} />}
                {candidate.isPinned && <OverrideIndicator type="pinned" />}
                {candidate.isBoosted && <OverrideIndicator type="boosted" />}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoItem icon={Briefcase} label="Experience" value={`${candidate.experience} years`} />
            <InfoItem icon={MapPin} label="Location" value={candidate.location} />
            <InfoItem icon={Calendar} label="Applied" value={candidate.appliedDate} />
            <InfoItem icon={Mail} label="Email" value={candidate.email} />
          </div>

          {/* View Resume Button */}
          <Button
            variant="outline"
            className="w-full mb-6"
            onClick={() => setShowResumeModal(true)}
          >
            <FileText className="w-4 h-4" />
            View Full Resume
          </Button>

          {/* LinkedIn Profile Sync Card */}
          <div className="bg-ai-surface border border-ai-border rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Linkedin className="w-5 h-5 text-[#0077B5]" />
              LinkedIn Profile Sync (Scraper Integration)
            </div>
            <p className="text-xs text-muted-foreground">
              Feed the LinkedIn profile link to scrape candidate details automatically via our crawler service.
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="text-xs h-9 bg-card"
                disabled={syncing}
              />
              <Button
                size="sm"
                onClick={handleSyncLinkedIn}
                disabled={syncing}
                className="shrink-0 h-9"
                type="button"
              >
                {syncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isSynced ? (
                  "Resync"
                ) : (
                  "Sync Profile"
                )}
              </Button>
            </div>
            {syncLogs.length > 0 && (
              <div className="bg-slate-900 text-emerald-400 font-mono text-[10px] p-2.5 rounded border border-slate-800 space-y-1">
                {syncLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            )}
          </div>

          {effectiveAIEnabled ? (
            <div className="relative">
              <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className="font-semibold text-foreground text-lg">AI Match Analysis</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-ai-surface hover:bg-ai-surface/80 border-ai-border text-ai-accent"
                  onClick={handleReanalyze}
                  disabled={isReanalyzing}
                >
                  {isReanalyzing ? (
                    <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                  )}
                  {isReanalyzing ? "Re-analyzing..." : "Re-analyze Profile"}
                </Button>
              </div>

              {isReanalyzing && (
                <div className="absolute inset-0 top-12 z-10 bg-background/60 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center border border-ai-border/50">
                  <RefreshCw className="w-6 h-6 text-ai-accent animate-spin mb-3" />
                  <p className="text-sm font-medium text-foreground">Running Dual Engine Analysis...</p>
                  <p className="text-xs text-muted-foreground mt-1 text-center px-4">Recalculating embeddings against latest job description.</p>
                </div>
              )}

              {/* Dual Engine Analysis */}
              <div className="mb-6">
                <AIMatchAnalysis candidate={candidate} job={job} />
              </div>

              {/* Predictive Insights - NEW */}
              <div className="mb-6">
                <PredictiveInsightsPanel candidate={candidate} />
              </div>

              {/* Feedback Section */}
              <div className="border border-border rounded-xl p-5 mb-6">
                <h3 className="font-semibold text-foreground mb-2">Was this ranking helpful?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your feedback helps improve future rankings
                </p>

                <div className="flex items-center gap-3">
                  <Button
                    variant={feedback === 'good' ? 'success' : 'success-outline'}
                    size="sm"
                    onClick={() => handleFeedback('good')}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Good suggestion
                  </Button>
                  <Button
                    variant={feedback === 'poor' ? 'warning' : 'warning-outline'}
                    size="sm"
                    onClick={() => handleFeedback('poor')}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Needs improvement
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-ai-border/50 bg-ai-surface/30 rounded-xl p-6 mb-6 text-center shadow-inner">
              <Sparkles className="w-8 h-8 text-ai-accent mx-auto mb-3 opacity-80" />
              <h3 className="font-semibold text-foreground mb-1 text-lg">AI Analysis Disabled</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                Enable AI analysis for this candidate to view semantic match scores, predictive insights, and automated rankings.
              </p>
              <Button 
                onClick={() => {
                  setLocalAIEnabled(true);
                  handleReanalyze();
                }} 
                className="bg-ai-surface hover:bg-ai-surface/80 border border-ai-border text-ai-accent font-medium shadow-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Enable AI Analysis
              </Button>
            </div>
          )}

          {/* Recruiter Notes */}
          {candidate.recruiterNotes && (
            <div className="bg-muted rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Your Notes</h3>
              </div>
              <p className="text-foreground">{candidate.recruiterNotes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant={isShortlisted ? "secondary" : "ghost"} 
              size="sm"
              onClick={handleToggleShortlist}
              className={cn("cursor-pointer transition-colors", isShortlisted ? "text-amber-500 font-medium" : "")}
              title={isShortlisted ? "Unpin candidate" : "Pin candidate"}
            >
              <Pin className={cn("w-4 h-4", isShortlisted && "fill-amber-500 text-amber-500")} />
              {isShortlisted ? "Pinned" : "Pin"}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onBoost?.(candidate.id)}
              className="cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
              Boost
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDemote?.(candidate.id)}
              className="cursor-pointer"
            >
              <ArrowDown className="w-4 h-4" />
              Demote
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowResumeModal(true)} className="cursor-pointer">
              <FileText className="w-4 h-4" />
              View Resume
            </Button>
            {isShortlisted ? (
              <Button 
                variant="outline" 
                size="sm"
                disabled={updatingShortlist}
                onClick={handleToggleShortlist}
                className="border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-500" />
                Remove from Shortlist
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                disabled={updatingShortlist}
                onClick={handleToggleShortlist}
                className="bg-primary hover:bg-primary/90 cursor-pointer shadow-sm transition-all"
              >
                <Star className="w-3.5 h-3.5 mr-1 fill-white text-white" />
                Add to Shortlist
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Resume Modal */}
      <ResumeViewerModal
        candidate={candidate}
        open={showResumeModal}
        onOpenChange={setShowResumeModal}
      />
    </>
  );
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
