import { Button } from '@/components/ui/button';
import { 
  FileWarning, 
  Users, 
  AlertTriangle, 
  WifiOff,
  Sparkles,
  RefreshCw,
  ArrowRight,
  FileText
} from 'lucide-react';

type EdgeStateType = 'poor-jd' | 'low-volume' | 'high-override' | 'ai-unavailable';

interface EdgeStatesProps {
  type: EdgeStateType;
  onAction: () => void;
  onDismiss: () => void;
}

export function EdgeStates({ type, onAction, onDismiss }: EdgeStatesProps) {
  const config = getEdgeStateConfig(type);

  return (
    <div className="flex items-center justify-center min-h-[50vh] animate-fade-in">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className={`w-20 h-20 rounded-2xl ${config.iconBg} flex items-center justify-center mx-auto mb-6`}>
          <config.icon className={`w-10 h-10 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {config.title}
        </h2>
        
        {/* Description */}
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {config.description}
        </p>

        {/* Suggestion Box */}
        {config.suggestion && (
          <div className="bg-muted rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-muted-foreground mb-2 font-medium">Suggestion</p>
            <p className="text-sm text-foreground">{config.suggestion}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={onDismiss}>
            {config.dismissLabel}
          </Button>
          <Button onClick={onAction}>
            {config.actionIcon && <config.actionIcon className="w-4 h-4" />}
            {config.actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getEdgeStateConfig(type: EdgeStateType) {
  switch (type) {
    case 'poor-jd':
      return {
        icon: FileWarning,
        iconBg: 'bg-warning-muted',
        iconColor: 'text-warning',
        title: 'Job Description Needs More Detail',
        description: 'Hiresort GenAI works best with detailed job descriptions. The current JD may not provide enough context for accurate ranking.',
        suggestion: 'Add specific skills, experience requirements, and responsibilities to improve AI accuracy.',
        actionLabel: 'Edit Job Description',
        actionIcon: FileText,
        dismissLabel: 'Rank Anyway',
      };
    
    case 'low-volume':
      return {
        icon: Users,
        iconBg: 'bg-info-muted',
        iconColor: 'text-info',
        title: 'Small Candidate Pool',
        description: 'With only a few candidates, AI ranking may not add significant value. Consider reviewing them directly.',
        suggestion: 'AI ranking becomes more useful when you have 20+ candidates to compare.',
        actionLabel: 'View Candidates',
        actionIcon: ArrowRight,
        dismissLabel: 'Enable AI Anyway',
      };
    
    case 'high-override':
      return {
        icon: AlertTriangle,
        iconBg: 'bg-warning-muted',
        iconColor: 'text-warning',
        title: 'Many Rankings Overridden',
        description: 'You\'ve adjusted most of the AI rankings. This might indicate the JD needs updating for better future matches.',
        suggestion: 'Consider updating the job description to better reflect your actual preferences.',
        actionLabel: 'Update JD',
        actionIcon: RefreshCw,
        dismissLabel: 'Continue',
      };
    
    case 'ai-unavailable':
      return {
        icon: WifiOff,
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
        title: 'AI Ranking Unavailable',
        description: 'Hiresort GenAI is temporarily unavailable. You can continue reviewing candidates manually.',
        suggestion: 'This is usually resolved within a few minutes. Try again shortly.',
        actionLabel: 'Retry',
        actionIcon: RefreshCw,
        dismissLabel: 'Continue Manually',
      };
  }
}

// Preview component showing all edge states
export function EdgeStatesPreview() {
  const states: EdgeStateType[] = ['poor-jd', 'low-volume', 'high-override', 'ai-unavailable'];
  
  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Edge States</h2>
      <p className="text-muted-foreground mb-8">
        These states handle exceptional scenarios gracefully
      </p>
      
      <div className="grid gap-8">
        {states.map((state) => (
          <div key={state} className="border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
              {state.replace('-', ' ')}
            </h3>
            <EdgeStates 
              type={state} 
              onAction={() => {}} 
              onDismiss={() => {}} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
