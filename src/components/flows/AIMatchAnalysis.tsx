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
  Sparkles,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIMatchAnalysisProps {
  candidate: Candidate;
  job?: Job;
  compact?: boolean;
}

export function AIMatchAnalysis({ candidate, job, compact = false }: AIMatchAnalysisProps) {
  const isUnranked = candidate.cosineSimilarity === null || candidate.cosineSimilarity === undefined;

  // Calculate match scores
  const totalRequiredSkills = job?.requirements?.length || 6;
  const matchedCount = isUnranked ? 0 : (candidate.matchedSkills?.length || 0);
  const missingCount = isUnranked ? 0 : (candidate.missingSkills?.length || 0);
  const skillMatchPercentage = isUnranked ? null : Math.round((matchedCount / (matchedCount + missingCount || 1)) * 100);
  
  // Experience match calculation
  const requiredExp = 5; // Default from JD
  const expDiff = candidate.experience - requiredExp;
  const expMatchPercentage = Math.min(100, Math.round((candidate.experience / requiredExp) * 100));
  
  // Overall score - use cosineSimilarity for consistency with the list view
  const overallScore = isUnranked ? null : Math.round(candidate.cosineSimilarity * 100);

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
            value={overallScore !== null ? `${overallScore}%` : '--'} 
            color={candidate.aiScore === 'high' ? 'success' : candidate.aiScore === 'medium' ? 'warning' : 'muted'}
          />
          <ScoreCircle 
            label="Skills" 
            value={skillMatchPercentage !== null ? `${skillMatchPercentage}%` : '--'} 
            color={skillMatchPercentage !== null && skillMatchPercentage >= 70 ? 'success' : (skillMatchPercentage !== null && skillMatchPercentage >= 50 ? 'warning' : 'muted')}
          />
          <ScoreCircle 
            label="Experience" 
            value={`${expMatchPercentage}%`} 
            color={expMatchPercentage >= 80 ? 'success' : expMatchPercentage >= 60 ? 'warning' : 'muted'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ai-surface border border-ai-border rounded-xl p-5 space-y-5">
      {/* Header with Dual Engine Scores */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <AIBadge />
          <h3 className="font-semibold text-foreground">Dual-Engine Match Analysis</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-lg p-3 flex flex-col justify-center items-center">
            <div className="flex items-center gap-1 justify-center mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Semantic Math Score
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-foreground transition-colors cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] text-center">
                    <p className="text-xs font-normal text-foreground normal-case tracking-normal">Calculated purely by measuring the geometric distance between the job description vector and the resume vector in dense mathematical space.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className={cn(
              "text-2xl font-bold",
              overallScore !== null && overallScore >= 80 ? "text-success" : overallScore !== null && overallScore >= 60 ? "text-warning" : "text-muted-foreground"
            )}>
              {overallScore !== null ? `${overallScore}%` : '--%'}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">Strict Vector Distance</span>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-3 flex flex-col justify-center items-center">
            <div className="flex items-center gap-1 justify-center mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                LLM Fit Score
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-foreground transition-colors cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] text-center">
                    <p className="text-xs font-normal text-foreground normal-case tracking-normal">A qualitative rating (high, medium, low) generated by the LLM reasoning engine based on contextual assessment of skills and trajectory.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className={cn(
              "text-2xl font-bold capitalize",
              candidate.aiScore === 'high' ? "text-success" : candidate.aiScore === 'medium' ? "text-warning" : "text-muted-foreground"
            )}>
              {isUnranked ? '--' : candidate.aiScore}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">AI Reasoning Assessment</span>
          </div>
        </div>

        {/* Unified Difference Analysis Box */}
        {!isUnranked && overallScore !== null && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
            <span className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider block">Difference Analysis</span>
            <p className="text-sm text-foreground/90 leading-relaxed max-w-[90%] mx-auto">
              {overallScore >= 80 && candidate.aiScore === 'high' 
                ? "Strong Consensus: Both the mathematical vector distance and the LLM's qualitative reasoning indicate a top-tier match."
                : overallScore < 60 && candidate.aiScore === 'high'
                ? "Insightful Divergence: While exact keyword overlap is mathematically low, the LLM recruiter recognized strong underlying potential and transferable skills."
                : overallScore >= 75 && candidate.aiScore === 'medium'
                ? "Measured Optimism: The resume shares a high mathematical vocabulary overlap with the JD, but the LLM flagged potential gaps in seniority or specific critical skills."
                : overallScore < 50 && candidate.aiScore === 'low'
                ? "Strong Consensus (Mismatch): Both the mathematical embedding model and the LLM recruiter agree that this candidate's profile is not well-aligned."
                : "Balanced Assessment: The mathematical similarity and LLM reasoning are generally aligned. Further human review of specific skill gaps is recommended."}
            </p>
          </div>
        )}
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
            title="Semantic Vector Embedding" 
            description="Generated high-dimensional vectors for both the Resume and the Job Description using the provider's embedding model."
            status={isUnranked ? "pending" : "complete"}
          />
          <AnalysisStep 
            step={2} 
            title="Strict Cosine Similarity (Math)" 
            description="Calculated the exact mathematical distance between the two semantic vectors to yield the Semantic Math Score."
            status={isUnranked ? "pending" : "complete"}
          />
          <AnalysisStep 
            step={3} 
            title="LLM Cognitive Reasoning" 
            description={`GPT/Claude/Gemini evaluated context, compared skills against ${totalRequiredSkills} requirements, and determined experience alignment.`}
            status={isUnranked ? "pending" : "complete"}
          />
          <AnalysisStep 
            step={4} 
            title="Dual-Score Aggregation" 
            description="Combined the strict mathematical vector distance with the LLM's qualitative assessment to generate a holistic fit profile."
            status={isUnranked ? "pending" : "complete"}
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
              skillMatchPercentage !== null && skillMatchPercentage >= 70 ? "text-success" : (skillMatchPercentage !== null && skillMatchPercentage >= 50 ? "text-warning" : "text-muted-foreground")
            )}>
              {skillMatchPercentage !== null ? `${skillMatchPercentage}%` : '--%'}
            </span>
          </div>
          <Progress 
            value={skillMatchPercentage !== null ? skillMatchPercentage : 0} 
            className="h-2 mb-2"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{isUnranked ? "Pending analysis" : `${matchedCount} matched`}</span>
            <span>{isUnranked ? "" : `${missingCount} gaps`}</span>
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
        <p className="text-sm text-foreground/90 leading-relaxed">
          {candidate.aiExplanation && !candidate.aiExplanation.includes('local simulation') 
            ? candidate.aiExplanation 
            : (isUnranked 
                ? <span className="text-muted-foreground italic">This candidate is pending GenAI analysis. Trigger the ranking process on the Active Jobs page.</span> 
                : <span>
                    <strong>Assessment:</strong> This candidate has a <strong>{overallScore}%</strong> semantic keyword match with the job description, and the LLM recruiter engine rated them as a <strong>{candidate.aiScore}</strong> fit overall. 
                    {matchedCount > 0 ? ` They possess key required skills like ${candidate.matchedSkills?.slice(0, 2).join(' and ')}.` : ''}
                    {missingCount > 0 ? ` However, there are potential gaps to investigate, such as ${candidate.missingSkills?.slice(0, 1).join(', ')}.` : ''}
                    {expMatchPercentage >= 100 ? ` Their ${candidate.experience} years of experience strongly aligns with or exceeds the seniority requirements.` : ` Their ${candidate.experience} years of experience may require some ramp-up time for a senior role.`}
                  </span>
              )
          }
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
  value: string;
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
        {value}
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
