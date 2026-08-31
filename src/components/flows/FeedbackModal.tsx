import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  X
} from 'lucide-react';
import { useState } from 'react';

interface FeedbackModalProps {
  shortlistSize: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function FeedbackModal({ shortlistSize, onComplete, onSkip }: FeedbackModalProps) {
  const [satisfaction, setSatisfaction] = useState<'great' | 'okay' | 'poor' | null>(null);
  const [additionalFeedback, setAdditionalFeedback] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onSkip}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-dropdown w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        {/* Success Header */}
        <div className="bg-success-muted border-b border-success/20 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Shortlist Created!
          </h2>
          <p className="text-muted-foreground">
            {shortlistSize} candidates ready for next stage
          </p>
        </div>

        {/* Feedback Form */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-ai-accent" />
            <h3 className="font-medium text-foreground">How was HireSortAi?</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Quick feedback helps us improve future rankings for you
          </p>

          {/* Satisfaction Options */}
          <div className="flex items-center gap-2 mb-6">
            <FeedbackOption
              active={satisfaction === 'great'}
              onClick={() => setSatisfaction('great')}
              icon={<ThumbsUp className="w-5 h-5" />}
              label="Saved me time"
              color="success"
            />
            <FeedbackOption
              active={satisfaction === 'okay'}
              onClick={() => setSatisfaction('okay')}
              icon={<MessageSquare className="w-5 h-5" />}
              label="It was okay"
              color="default"
            />
            <FeedbackOption
              active={satisfaction === 'poor'}
              onClick={() => setSatisfaction('poor')}
              icon={<ThumbsDown className="w-5 h-5" />}
              label="Not helpful"
              color="warning"
            />
          </div>

          {/* Optional comment */}
          {satisfaction && (
            <div className="mb-6 animate-fade-in">
              <label className="text-sm text-muted-foreground block mb-2">
                Anything specific? (optional)
              </label>
              <textarea
                value={additionalFeedback}
                onChange={(e) => setAdditionalFeedback(e.target.value)}
                placeholder="e.g., Rankings were accurate for skills but missed culture fit..."
                className="w-full h-20 p-3 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onSkip} className="flex-1">
              Skip
            </Button>
            <Button onClick={onComplete} className="flex-1">
              {satisfaction ? 'Submit & Continue' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeedbackOptionProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: 'success' | 'warning' | 'default';
}

function FeedbackOption({ active, onClick, icon, label, color }: FeedbackOptionProps) {
  const getColorClasses = () => {
    if (!active) return 'border-border text-muted-foreground hover:border-primary/50';
    
    switch (color) {
      case 'success':
        return 'border-success bg-success-muted text-success';
      case 'warning':
        return 'border-warning bg-warning-muted text-warning';
      default:
        return 'border-primary bg-primary/10 text-primary';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
        ${getColorClasses()}
      `}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
