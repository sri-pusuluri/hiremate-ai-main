import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Video, 
  Users, 
  Star, 
  Plus, 
  CheckCircle2, 
  ExternalLink,
  Award,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react';
import { Interview, InterviewScorecard } from '@/types/interviews';
import { fetchInterviews } from '@/lib/interview-storage';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { InterviewScorecardModal } from './InterviewScorecardModal';
import { Candidate, Job } from '@/types/hiresort';
import { cn } from '@/lib/utils';

interface CandidateInterviewHistoryProps {
  candidate: Candidate;
  job?: Job;
}

export function CandidateInterviewHistory({ candidate, job }: CandidateInterviewHistoryProps) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeInterviewForScorecard, setActiveInterviewForScorecard] = useState<Interview | null>(null);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const all = await fetchInterviews();
      const filtered = all.filter(i => i.candidateId === candidate.id || i.candidateName.toLowerCase() === candidate.name.toLowerCase());
      setInterviews(filtered);
    } catch (e) {
      console.warn('Could not load candidate interviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, [candidate.id, candidate.name]);

  const handleScheduled = (newInt: Interview) => {
    setInterviews(prev => [newInt, ...prev]);
  };

  const handleScorecardSaved = (scorecard: InterviewScorecard) => {
    setInterviews(prev => prev.map(i => i.id === scorecard.interviewId ? { ...i, status: 'completed', scorecard } : i));
  };

  return (
    <div className="space-y-4">
      {/* Header with Quick Schedule Button */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h4 className="text-sm font-bold text-foreground">Interview Pipeline & Scorecards</h4>
          <p className="text-xs text-muted-foreground">Track multi-round progress, calendar dates, and panel evaluations.</p>
        </div>
        <Button 
          size="sm" 
          onClick={() => setShowScheduleModal(true)} 
          className="gap-1.5 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Schedule Round
        </Button>
      </div>

      {/* List of Interview Rounds */}
      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">Loading interview schedule...</div>
      ) : interviews.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/20 space-y-2">
          <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-xs font-semibold text-foreground">No interview rounds scheduled yet</p>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            Schedule an initial screening or technical round to automatically move {candidate.name} into the active interview pipeline.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowScheduleModal(true)}
            className="text-xs gap-1 mt-2"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule First Round
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((item, idx) => (
            <div 
              key={item.id} 
              className={cn(
                "p-4 rounded-xl border transition-all space-y-3",
                item.status === 'completed' 
                  ? "bg-card border-border shadow-2xs" 
                  : "bg-purple-500/[0.03] border-purple-500/30 shadow-xs"
              )}
            >
              {/* Round Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm text-foreground">{item.title}</span>
                  <Badge variant="outline" className="capitalize text-[11px]">
                    {item.roundType.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[11px] font-semibold capitalize",
                      item.status === 'completed' 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                        : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                    )}
                  >
                    {item.status === 'completed' ? '✓ Completed' : '⏱ Scheduled'}
                  </Badge>

                  {item.status !== 'completed' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setActiveInterviewForScorecard(item)}
                      className="h-7 text-xs gap-1 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      Score Candidate
                    </Button>
                  )}
                </div>
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{new Date(item.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{item.durationMinutes} Minutes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>{item.interviewerNames.join(', ')}</span>
                </div>
              </div>

              {/* Video Meeting Link */}
              {item.meetingLink && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/60 text-xs">
                  <Video className="w-4 h-4 text-blue-500" />
                  <span className="font-mono text-muted-foreground truncate flex-1">{item.meetingLink}</span>
                  <a 
                    href={item.meetingLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 shrink-0"
                  >
                    Join Room <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Scorecard Display if Available */}
              {item.scorecard && (
                <div className="mt-2 p-3 rounded-lg bg-muted/40 border border-border/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-foreground">Scorecard by {item.scorecard.interviewerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {item.scorecard.overallScore} / 5.0
                      </div>
                      <Badge className={cn(
                        "text-[10px] font-bold capitalize",
                        item.scorecard.recommendation.includes('hire') 
                          ? "bg-emerald-600 text-white" 
                          : "bg-red-600 text-white"
                      )}>
                        {item.scorecard.recommendation.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {item.scorecard.strengths && (
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Strengths:</strong> {item.scorecard.strengths}
                    </p>
                  )}
                  {item.scorecard.areasForImprovement && (
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Growth Areas:</strong> {item.scorecard.areasForImprovement}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ScheduleInterviewModal 
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        candidate={candidate}
        job={job}
        onScheduled={handleScheduled}
      />

      <InterviewScorecardModal 
        open={Boolean(activeInterviewForScorecard)}
        onOpenChange={open => !open && setActiveInterviewForScorecard(null)}
        interview={activeInterviewForScorecard}
        onScorecardSubmitted={handleScorecardSaved}
      />
    </div>
  );
}
