import { Button } from '@/components/ui/button';
import { Sparkles, Shield, Eye, ThumbsUp, X } from 'lucide-react';

interface OnboardingModalProps {
  jobTitle: string;
  candidateCount: number;
  isReenabling?: boolean;
  onEnable: () => void;
  onCancel: () => void;
}

export function OnboardingModal({ jobTitle, candidateCount, isReenabling = false, onEnable, onCancel }: OnboardingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-dropdown w-full max-w-lg mx-4 overflow-hidden animate-fade-in">
        {/* Header with AI accent */}
        <div className="bg-ai-surface border-b border-ai-border p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-ai-accent/10 border border-ai-border flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-ai-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {isReenabling ? 'Re-enable HireSortAi' : 'Enable HireSortAi'}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">For: {jobTitle}</p>
              </div>
            </div>
            <button 
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-foreground mb-6">
            HireSortAi will {isReenabling ? 're-analyze' : 'analyze'} your <span className="font-semibold">{candidateCount} candidates</span> and 
            {isReenabling ? ' update their rankings' : ' rank them'} based on how well they match your job description.
          </p>

          {/* Trust Messaging - What AI does */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              What HireSortAi does
            </h3>
            
            <div className="space-y-3">
              <TrustItem 
                icon={Eye}
                title="Analyzes resumes semantically"
                description="Understands context beyond keyword matching"
              />
              <TrustItem 
                icon={ThumbsUp}
                title="Ranks candidates by relevance"
                description="Based on skills, experience, and job requirements"
              />
              <TrustItem 
                icon={Shield}
                title="Shows clear explanations"
                description="Every ranking includes the reasoning behind it"
              />
            </div>
          </div>

          {/* Trust Messaging - What AI does NOT do */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              What HireSortAi does NOT do
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-destructive font-medium">✕</span>
                <span>Automatically reject any candidate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive font-medium">✕</span>
                <span>Make final hiring decisions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive font-medium">✕</span>
                <span>Replace your judgment or expertise</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive font-medium">✕</span>
                <span>Consider gender, age, or demographic factors</span>
              </li>
            </ul>
          </div>

          {/* Control Message */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-t border-border pt-4 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span>You always have final control. Override rankings anytime.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Maybe Later
            </Button>
            <Button variant="ai-primary" onClick={onEnable} className="flex-1">
              <Sparkles className="w-4 h-4" />
              {isReenabling ? 'Re-enable HireSortAi' : 'Enable HireSortAi'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TrustItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function TrustItem({ icon: Icon, title, description }: TrustItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-success-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-success" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
