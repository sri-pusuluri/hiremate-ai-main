import { Candidate } from '@/types/hiresort';
import { Button } from '@/components/ui/button';
import { AIBadge, RankBadge, RelevanceLabel } from '@/components/ui/ai-badges';
import { 
  X, 
  Sparkles, 
  User, 
  GripVertical,
  CheckCircle2,
  AlertTriangle,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ShortlistReviewProps {
  candidates: Candidate[];
  onConfirm: () => void;
  onClose: () => void;
}

export function ShortlistReview({ candidates, onConfirm, onClose }: ShortlistReviewProps) {
  const [shortlist, setShortlist] = useState<Candidate[]>(candidates);
  
  const aiSuggested = shortlist.filter(c => c.aiScore === 'high');
  const recruiterAdded = shortlist.filter(c => c.aiScore !== 'high');

  const removeFromShortlist = (id: string) => {
    setShortlist(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-dropdown w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Review Shortlist</h2>
            <p className="text-muted-foreground">
              {shortlist.length} candidates selected for next stage
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Human Ownership Message */}
          <div className="bg-success-muted border border-success/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">You're in control</p>
                <p className="text-sm text-muted-foreground">
                  This shortlist reflects your judgment. AI suggestions are included, but you decide who moves forward.
                </p>
              </div>
            </div>
          </div>

          {/* AI Suggested Section */}
          {aiSuggested.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AIBadge />
                <h3 className="font-medium text-foreground">AI Suggested</h3>
                <span className="text-sm text-muted-foreground">({aiSuggested.length})</span>
              </div>
              <div className="space-y-2">
                {aiSuggested.map((candidate) => (
                  <ShortlistItem 
                    key={candidate.id} 
                    candidate={candidate}
                    onRemove={() => removeFromShortlist(candidate.id)}
                    source="ai"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recruiter Added Section */}
          {recruiterAdded.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-foreground">Your Additions</h3>
                <span className="text-sm text-muted-foreground">({recruiterAdded.length})</span>
              </div>
              <div className="space-y-2">
                {recruiterAdded.map((candidate) => (
                  <ShortlistItem 
                    key={candidate.id} 
                    candidate={candidate}
                    onRemove={() => removeFromShortlist(candidate.id)}
                    source="recruiter"
                  />
                ))}
              </div>
            </div>
          )}

          {shortlist.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">No candidates in shortlist</p>
              <p className="text-sm text-muted-foreground">
                Add candidates from the ranked list to continue
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex items-center justify-between bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Ready to share with hiring manager?
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Back to List
            </Button>
            <Button 
              onClick={onConfirm}
              disabled={shortlist.length === 0}
            >
              <Send className="w-4 h-4" />
              Confirm Shortlist
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShortlistItemProps {
  candidate: Candidate;
  onRemove: () => void;
  source: 'ai' | 'recruiter';
}

function ShortlistItem({ candidate, onRemove, source }: ShortlistItemProps) {
  return (
    <div className="flex items-center gap-3 bg-background border border-border rounded-lg p-3 group">
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Rank */}
      <RankBadge rank={candidate.aiRank || 0} score={candidate.aiScore || 'low'} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{candidate.name}</span>
          <RelevanceLabel score={candidate.aiScore || 'low'} />
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {candidate.currentRole} at {candidate.company}
        </p>
      </div>

      {/* Source indicator */}
      <span className={cn(
        "text-xs px-2 py-1 rounded",
        source === 'ai' 
          ? "bg-ai-surface text-ai-accent" 
          : "bg-muted text-muted-foreground"
      )}>
        {source === 'ai' ? 'AI' : 'You'}
      </span>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
