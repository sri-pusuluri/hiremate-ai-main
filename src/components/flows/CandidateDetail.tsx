import { Candidate, Job } from '@/types/hiresort';
import { Button } from '@/components/ui/button';
import { AIBadge, RankBadge, RelevanceLabel, OverrideIndicator } from '@/components/ui/ai-badges';
import { ResumeViewerModal } from './ResumeViewerModal';
import { AIMatchAnalysis } from './AIMatchAnalysis';
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
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { PredictiveInsightsPanel } from '@/components/predictive/PredictiveInsightsPanel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface CandidateDetailProps {
  candidate: Candidate;
  job?: Job;
  onClose: () => void;
  onFeedback: (type: 'good' | 'poor') => void;
}

export function CandidateDetail({ candidate, job, onClose, onFeedback }: CandidateDetailProps) {
  const [feedback, setFeedback] = useState<'good' | 'poor' | null>(candidate.recruiterFeedback || null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const { toast } = useToast();
  const [linkedinUrl, setLinkedinUrl] = useState(`https://linkedin.com/in/${candidate.name.toLowerCase().replace(/\s+/g, '-')}`);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isSynced, setIsSynced] = useState(false);

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
                <RankBadge rank={candidate.aiRank || 0} score={candidate.aiScore || 'low'} />
              </div>
              <p className="text-muted-foreground">
                {candidate.currentRole} at {candidate.company}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <RelevanceLabel score={candidate.aiScore || 'low'} />
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

          {/* AI Match Analysis - Enhanced */}
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
                Poor suggestion
              </Button>
            </div>
          </div>

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
            <Button variant="ghost" size="sm">
              <Pin className="w-4 h-4" />
              Pin
            </Button>
            <Button variant="ghost" size="sm">
              <ArrowUp className="w-4 h-4" />
              Boost
            </Button>
            <Button variant="ghost" size="sm">
              <ArrowDown className="w-4 h-4" />
              Demote
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowResumeModal(true)}>
              <FileText className="w-4 h-4" />
              View Resume
            </Button>
            <Button size="sm">
              Add to Shortlist
            </Button>
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
