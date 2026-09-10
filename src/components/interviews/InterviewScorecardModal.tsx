import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  CheckCircle2, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle, 
  Sparkles,
  Award,
  Scale
} from 'lucide-react';
import { Interview, InterviewScorecard, HiringRecommendation } from '@/types/interviews';
import { submitInterviewScorecard } from '@/lib/interview-storage';
import { logAuditEvent } from '@/lib/audit-logger';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface InterviewScorecardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: Interview | null;
  onScorecardSubmitted?: (scorecard: InterviewScorecard) => void;
}

export function InterviewScorecardModal({
  open,
  onOpenChange,
  interview,
  onScorecardSubmitted
}: InterviewScorecardModalProps) {
  const { user, client, role } = useAuth();
  const { toast } = useToast();

  const [techScore, setTechScore] = useState(4);
  const [problemSolvingScore, setProblemSolvingScore] = useState(4);
  const [communicationScore, setCommunicationScore] = useState(4);
  const [cultureScore, setCultureScore] = useState(5);
  const [recommendation, setRecommendation] = useState<HiringRecommendation>('hire');
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!interview) return null;

  const averageScore = Number(
    ((techScore + problemSolvingScore + communicationScore + cultureScore) / 4).toFixed(1)
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const createdScorecard = await submitInterviewScorecard({
        interviewId: interview.id,
        candidateId: interview.candidateId,
        interviewerId: user?.id || 'usr-interviewer',
        interviewerName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Interviewer',
        interviewerEmail: user?.email || undefined,
        recommendation,
        overallScore: averageScore,
        rubricRatings: {
          technicalSkills: techScore,
          problemSolving: problemSolvingScore,
          communication: communicationScore,
          cultureFit: cultureScore
        },
        strengths: strengths.trim() || 'Strong technical baseline and clear articulation.',
        areasForImprovement: areasForImprovement.trim() || 'Could dive deeper into distributed architectures.',
        privateNotes: privateNotes.trim() || undefined
      });

      // Audit log scorecard submission
      logAuditEvent({
        clientId: interview.clientId || client?.id || 'hiresort-platform-hq',
        clientName: client?.name || 'Workspace',
        userId: user?.id,
        userEmail: user?.email || 'admin@hiresort.ai',
        userRole: role || 'recruiter',
        action: 'SUBMIT_INTERVIEW_SCORECARD',
        resourceType: 'candidate',
        resourceId: interview.candidateId,
        details: {
          interview_id: interview.id,
          recommendation,
          overall_score: averageScore,
          candidate_name: interview.candidateName
        }
      }).catch(() => {});

      toast({
        title: 'Scorecard Submitted! ⭐️',
        description: `Recommendation "${recommendation.toUpperCase().replace('_', ' ')}" recorded for ${interview.candidateName}.`
      });

      onScorecardSubmitted?.(createdScorecard);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error submitting scorecard:', err);
      toast({
        title: 'Submission Failed',
        description: err.message || 'Could not save scorecard.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (val: number) => void; label: string }) => (
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/40 transition-colors">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
          >
            <Star 
              className={cn(
                "w-4 h-4", 
                star <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
              )} 
            />
          </button>
        ))}
        <span className="text-xs font-mono font-bold text-muted-foreground ml-1.5 w-4 text-right">
          {value}/5
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Submit Interview Scorecard</DialogTitle>
              <DialogDescription className="text-xs">
                Candidate: <span className="font-semibold text-foreground">{interview.candidateName}</span> • {interview.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Top Score Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-transparent border border-border">
            <div>
              <span className="text-xs text-muted-foreground font-medium block">Overall Calculated Rubric Score</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-black text-foreground">{averageScore}</span>
                <span className="text-xs text-muted-foreground">/ 5.0</span>
                <Badge variant="outline" className={cn(
                  "text-xs font-bold ml-2",
                  averageScore >= 4.0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                )}>
                  {averageScore >= 4.5 ? 'Exceptional Match' : averageScore >= 3.5 ? 'Strong Potential' : 'Needs Further Review'}
                </Badge>
              </div>
            </div>

            <Scale className="w-8 h-8 text-muted-foreground/30" />
          </div>

          {/* 5-Star Rubric Criteria */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
              1. Quantitative Evaluation Rubric
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <StarRating label="Technical Skills & Architecture" value={techScore} onChange={setTechScore} />
              <StarRating label="Problem Solving & Algorithms" value={problemSolvingScore} onChange={setProblemSolvingScore} />
              <StarRating label="Communication & Articulation" value={communicationScore} onChange={setCommunicationScore} />
              <StarRating label="Culture & Values Alignment" value={cultureScore} onChange={setCultureScore} />
            </div>
          </div>

          {/* Hiring Decision Recommendation */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
              2. Final Hiring Recommendation
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { key: 'strong_hire', label: 'Strong Hire', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-600' },
                { key: 'hire', label: 'Hire', color: 'border-teal-500 bg-teal-500/10 text-teal-600' },
                { key: 'lean_hire', label: 'Lean Hire', color: 'border-blue-500 bg-blue-500/10 text-blue-600' },
                { key: 'no_hire', label: 'No Hire', color: 'border-amber-500 bg-amber-500/10 text-amber-600' },
                { key: 'strong_no_hire', label: 'Strong No Hire', color: 'border-red-500 bg-red-500/10 text-red-600' },
              ].map((rec) => (
                <button
                  key={rec.key}
                  type="button"
                  onClick={() => setRecommendation(rec.key as HiringRecommendation)}
                  className={cn(
                    "px-2.5 py-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer",
                    recommendation === rec.key 
                      ? `${rec.color} shadow-xs ring-1 ring-primary/40` 
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {rec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Qualitative Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ThumbsUp className="w-3.5 h-3.5" /> Key Strengths
              </Label>
              <Textarea 
                value={strengths}
                onChange={e => setStrengths(e.target.value)}
                placeholder="Clear communication, fast whiteboarding, deep React concurrency knowledge..."
                className="text-xs min-h-[60px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Areas for Growth / Red Flags
              </Label>
              <Textarea 
                value={areasForImprovement}
                onChange={e => setAreasForImprovement(e.target.value)}
                placeholder="Limited cloud infrastructure experience, needs supervision on database indexing..."
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>

          {/* Private Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Private Hiring Committee Notes (Recruiters Only)</Label>
            <Textarea 
              value={privateNotes}
              onChange={e => setPrivateNotes(e.target.value)}
              placeholder="Candidate has competing offers expiring this Friday. Recommend prompt follow-up."
              className="text-xs min-h-[50px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSubmit} 
            disabled={submitting}
            className="gap-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Scorecard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
