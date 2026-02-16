import { useEffect, useState } from 'react';
import { Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProcessingStateProps {
  jobTitle: string;
  totalCandidates: number;
  onComplete: () => void;
}

export function ProcessingState({ jobTitle, totalCandidates, onComplete }: ProcessingStateProps) {
  const [progress, setProgress] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Simulate processing
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 8;
        if (next >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          return 100;
        }
        return next;
      });
      setProcessed((prev) => Math.min(prev + Math.floor(Math.random() * 15) + 5, totalCandidates));
    }, 500);

    return () => clearInterval(interval);
  }, [totalCandidates]);

  const estimatedTimeRemaining = Math.max(1, Math.ceil((100 - progress) / 10));

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6 inline-flex">
          <div className={`w-20 h-20 rounded-2xl bg-ai-surface border border-ai-border flex items-center justify-center ${!isComplete ? 'animate-pulse-soft' : ''}`}>
            {isComplete ? (
              <CheckCircle2 className="w-10 h-10 text-success" />
            ) : (
              <Sparkles className="w-10 h-10 text-ai-accent" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {isComplete ? 'Ranking Complete!' : 'HireSort AI is analyzing candidates'}
        </h2>
        <p className="text-muted-foreground mb-8">
          {isComplete 
            ? `Successfully ranked ${totalCandidates} candidates for ${jobTitle}`
            : `Reviewing resumes for ${jobTitle}`
          }
        </p>

        {/* Progress */}
        <div className="mb-6">
          {/* Progress Bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-success' : 'bg-ai-accent'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {processed} of {totalCandidates} candidates analyzed
            </span>
            {!isComplete && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                ~{estimatedTimeRemaining} min remaining
              </span>
            )}
          </div>
        </div>

        {/* Non-blocking notice */}
        {!isComplete && (
          <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground mb-6">
            <p>
              <strong className="text-foreground">This runs in the background.</strong>
              <br />
              You can continue working—we'll notify you when ranking is complete.
            </p>
          </div>
        )}

        {/* Action */}
        {isComplete ? (
          <Button variant="ai-primary" size="lg" onClick={onComplete}>
            <Sparkles className="w-5 h-5" />
            View Ranked Candidates
          </Button>
        ) : (
          <Button variant="outline" onClick={onComplete}>
            Continue Working
          </Button>
        )}
      </div>
    </div>
  );
}
