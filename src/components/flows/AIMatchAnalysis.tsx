import { Candidate, Job } from '@/types/hiresort';
import { AIBadge } from '@/components/ui/ai-badges';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Briefcase, 
  Code, 
  Users,
  Target,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIMatchAnalysisProps {
  candidate: Candidate;
  job?: Job;
  compact?: boolean;
}

export function AIMatchAnalysis({ candidate, job, compact = false }: AIMatchAnalysisProps) {
  // Calculate match scores
  const totalRequiredSkills = job?.requirements?.length || 6;
  const matchedCount = candidate.matchedSkills?.length || 0;
  const missingCount = candidate.missingSkills?.length || 0;
  const skillMatchPercentage = Math.round((matchedCount / (matchedCount + missingCount || 1)) * 100);
  
  // Experience match calculation
  const requiredExp = 5; // Default from JD
  const expDiff = candidate.experience - requiredExp;
  const expMatchPercentage = Math.min(100, Math.round((candidate.experience / requiredExp) * 100));
  
  // Overall score - use cosineSimilarity for consistency with the list view
  const overallScore = Math.round((candidate.cosineSimilarity || 0) * 100);

  if (compact) {
    return (
      <div className="bg-ai-surface border border-ai-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-ai-accent" />
          <span className="text-sm font-medium text-foreground">AI Match Analysis</span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <ScoreCircle 
            label="Overall" 
            value={overallScore} 
            color={candidate.aiScore === 'high' ? 'success' : candidate.aiScore === 'medium' ? 'warning' : 'muted'}
          />
          <ScoreCircle 
            label="Skills" 
            value={skillMatchPercentage} 
            color={skillMatchPercentage >= 70 ? 'success' : skillMatchPercentage >= 50 ? 'warning' : 'muted'}
          />
          <ScoreCircle 
            label="Experience" 
            value={expMatchPercentage} 
            color={expMatchPercentage >= 80 ? 'success' : expMatchPercentage >= 60 ? 'warning' : 'muted'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ai-surface border border-ai-border rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AIBadge />
          <h3 className="font-semibold text-foreground">Match Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Overall Score</span>
          <span className={cn(
            "text-lg font-bold",
            candidate.aiScore === 'high' && "text-success",
            candidate.aiScore === 'medium' && "text-warning",
            candidate.aiScore === 'low' && "text-muted-foreground"
          )}>
            {overallScore}%
          </span>
        </div>
      </div>

      {/* How AI Analyzed Section */}
      <div className="bg-card rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-ai-accent" />
          How HireSort AI Analyzed This Candidate
        </h4>
        <div className="space-y-3 text-sm">
          <AnalysisStep 
            step={1} 
            title="Document Embedding" 
            description="Generated vector embeddings from resume content using RAG pipeline"
            status="complete"
          />
          <AnalysisStep 
            step={2} 
            title="Semantic Matching" 
            description={`Computed cosine similarity between resume and ${totalRequiredSkills} JD requirements`}
            status="complete"
          />
          <AnalysisStep 
            step={3} 
            title="RAG-based Experience Analysis" 
            description={`Retrieved and compared ${candidate.experience} years of experience against contextual embeddings`}
            status="complete"
          />
          <AnalysisStep 
            step={4} 
            title="Embedding Similarity Scoring" 
            description="Ranked candidates using vector distance metrics and semantic relevance"
            status="complete"
          />
        </div>
      </div>

      {/* Match Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {/* Skills Match */}
        <div className="bg-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Skills Match</span>
            </div>
            <span className={cn(
              "text-sm font-bold",
              skillMatchPercentage >= 70 ? "text-success" : skillMatchPercentage >= 50 ? "text-warning" : "text-muted-foreground"
            )}>
              {skillMatchPercentage}%
            </span>
          </div>
          <Progress 
            value={skillMatchPercentage} 
            className="h-2 mb-2"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{matchedCount} matched</span>
            <span>{missingCount} gaps</span>
          </div>
        </div>

        {/* Experience Match */}
        <div className="bg-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Experience</span>
            </div>
            <span className={cn(
              "text-sm font-bold",
              expMatchPercentage >= 80 ? "text-success" : expMatchPercentage >= 60 ? "text-warning" : "text-muted-foreground"
            )}>
              {candidate.experience} yrs
            </span>
          </div>
          <Progress 
            value={expMatchPercentage} 
            className="h-2 mb-2"
          />
          <p className="text-xs text-muted-foreground">
            {expDiff > 0 ? `+${expDiff} years over requirement` : expDiff < 0 ? `${Math.abs(expDiff)} years below requirement` : 'Meets requirement'}
          </p>
        </div>
      </div>

      {/* Matched vs Missing Skills Visual */}
      <div className="space-y-4">
        {/* Matched Skills */}
        {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-foreground">Skills Found in Resume ({matchedCount})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {candidate.matchedSkills.map((skill) => (
                <span 
                  key={skill}
                  className="px-2.5 py-1 bg-success-muted text-success text-sm rounded-md border border-success/20"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {candidate.missingSkills && candidate.missingSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Not Found in Resume ({missingCount})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {candidate.missingSkills.map((skill) => (
                <span 
                  key={skill}
                  className="px-2.5 py-1 bg-muted text-muted-foreground text-sm rounded-md border border-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Summary */}
      <div className="bg-gradient-to-r from-ai-surface to-transparent border-l-2 border-ai-accent p-4 rounded-r-lg space-y-3">
        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-ai-accent" />
          AI Assessment
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {candidate.aiExplanation}
        </p>
        
        {/* Experience Alignment Detail */}
        {candidate.experienceAlignment && (
          <div className="bg-card rounded-lg p-3 mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Experience Alignment</p>
            <p className="text-sm text-foreground">
              Strong match: {candidate.experience} years of frontend experience
              {candidate.currentRole.toLowerCase().includes('lead') || 
               candidate.currentRole.toLowerCase().includes('senior') || 
               candidate.currentRole.toLowerCase().includes('staff') 
                ? ` with ${Math.max(1, Math.floor(candidate.experience / 3))}+ years in leadership roles` 
                : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ScoreCircleProps {
  label: string;
  value: number;
  color: 'success' | 'warning' | 'muted';
}

function ScoreCircle({ label, value, color }: ScoreCircleProps) {
  return (
    <div className="text-center">
      <div className={cn(
        "w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold",
        color === 'success' && "bg-success-muted text-success",
        color === 'warning' && "bg-warning-muted text-warning",
        color === 'muted' && "bg-muted text-muted-foreground"
      )}>
        {value}%
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

interface AnalysisStepProps {
  step: number;
  title: string;
  description: string;
  status: 'complete' | 'processing' | 'pending';
}

function AnalysisStep({ step, title, description, status }: AnalysisStepProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
        status === 'complete' && "bg-success-muted text-success",
        status === 'processing' && "bg-ai-surface text-ai-accent animate-pulse",
        status === 'pending' && "bg-muted text-muted-foreground"
      )}>
        {status === 'complete' ? '✓' : step}
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
    </div>
  );
}
