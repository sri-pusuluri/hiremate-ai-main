import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function AIBadge({ size = 'md', className }: AIBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        "bg-ai-surface border border-ai-border text-ai-accent",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Sparkles className={cn(size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5")} />
      AI
    </span>
  );
}

interface RankBadgeProps {
  rank: number;
  score: 'high' | 'medium' | 'low';
  className?: string;
}

export function RankBadge({ rank, score, className }: RankBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold",
        score === 'high' && "bg-success-muted text-success border border-success/20",
        score === 'medium' && "bg-warning-muted text-warning border border-warning/20",
        score === 'low' && "bg-muted text-muted-foreground border border-border",
        className
      )}
    >
      {rank}
    </div>
  );
}

interface RelevanceLabelProps {
  score?: 'high' | 'medium' | 'low' | 'pending' | null;
  className?: string;
}

export function RelevanceLabel({ score, className }: RelevanceLabelProps) {
  const labels = {
    high: 'Strong Match',
    medium: 'Potential Match',
    low: 'Low Match',
    pending: 'Pending Analysis',
  };

  const currentScore = score || 'pending';

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        currentScore === 'high' && "bg-success-muted text-success",
        currentScore === 'medium' && "bg-warning-muted text-warning",
        currentScore === 'low' && "bg-muted text-muted-foreground",
        currentScore === 'pending' && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
        className
      )}
    >
      {labels[currentScore] || 'Pending Analysis'}
    </span>
  );
}

interface OverrideIndicatorProps {
  type: 'pinned' | 'boosted' | 'demoted';
  className?: string;
}

export function OverrideIndicator({ type, className }: OverrideIndicatorProps) {
  const config = {
    pinned: { label: 'Pinned', className: 'bg-primary/10 text-primary border-primary/20' },
    boosted: { label: 'Boosted', className: 'bg-success-muted text-success border-success/20' },
    demoted: { label: 'Demoted', className: 'bg-warning-muted text-warning border-warning/20' },
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        config[type].className,
        className
      )}
    >
      {config[type].label}
    </span>
  );
}
