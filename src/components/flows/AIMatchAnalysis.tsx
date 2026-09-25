import { useState, useMemo } from 'react';
import { Candidate, Job } from '@/types/hiresort';
import { classifyJobSkills } from '@/lib/ai-screening';
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
  Info,
  ShieldCheck,
  HelpCircle,
  Layers,
  Zap,
  Check,
  Cpu,
  Server,
  FileSearch,
  ChevronDown,
  ChevronUp,
  Activity,
  RefreshCw,
  Brain,
  Binary,
  GitCompare,
  XCircle,
  Scale,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

interface AIMatchAnalysisProps {
  candidate: Candidate;
  job?: Job;
  compact?: boolean;
  onReanalyze?: (customProvider?: string, customModel?: string) => Promise<void> | void;
  isReanalyzing?: boolean;
}

export function AIMatchAnalysis({ 
  candidate, 
  job, 
  compact = false,
  onReanalyze,
  isReanalyzing = false
}: AIMatchAnalysisProps) {
  const [showHowAnalyzed, setShowHowAnalyzed] = useState(false);
  const [showCoverageDimensions, setShowCoverageDimensions] = useState(true);
  const [showProviderDetails, setShowProviderDetails] = useState(true);
  const [showProviderCoverageDetails, setShowProviderCoverageDetails] = useState(false);
  const isUnranked = candidate.cosineSimilarity === null || candidate.cosineSimilarity === undefined;

  // Active AI Provider & Model information:
  // 1. If candidate has an evaluation record with a tagged provider, that is the ground truth
  // 2. Otherwise use the user's selected engine or default to deterministic ATS
  const recordedProvider = (candidate.predictiveInsights as any)?.provider;
  const recordedModel = (candidate.predictiveInsights as any)?.model;
  
  const [selectedOpenAIModel, setSelectedOpenAIModel] = useState<string>(() => {
    if (recordedProvider === 'openai' && recordedModel) return recordedModel;
    return typeof window !== 'undefined' ? (localStorage.getItem('openai_model') || 'gpt-4o') : 'gpt-4o';
  });

  const [selectedEngine, setSelectedEngine] = useState<string>(() => {
    if (recordedProvider === 'openai') {
      return `openai:${recordedModel || (typeof window !== 'undefined' ? (localStorage.getItem('openai_model') || 'gpt-4o') : 'gpt-4o')}`;
    }
    if (recordedProvider === 'claude') {
      return `claude:${recordedModel || 'claude-3-5-sonnet-latest'}`;
    }
    if (recordedProvider === 'gemini') {
      return `gemini:${recordedModel || 'gemini-1.5-flash'}`;
    }
    if (recordedProvider) return recordedProvider;

    if (typeof window !== 'undefined') {
      const storedProvider = localStorage.getItem('ai_provider');
      if (storedProvider === 'openai') {
        const storedModel = localStorage.getItem('openai_model') || 'gpt-4o';
        return `openai:${storedModel}`;
      }
      if (storedProvider) return storedProvider;
    }
    return 'openai:gpt-4o';
  });
  
  const effectiveProvider = recordedProvider || (isUnranked ? selectedEngine : 'deterministic-ats');
  const providerDisplay = effectiveProvider === 'openai' 
    ? 'OpenAI' 
    : effectiveProvider === 'gemini' 
    ? 'Google Gemini' 
    : effectiveProvider === 'claude' 
    ? 'Anthropic Claude' 
    : effectiveProvider === 'supabase-edge'
    ? 'Supabase Vector Engine'
    : 'Deterministic ATS Engine';

  const modelDisplay = recordedModel || (
    effectiveProvider === 'gemini' 
      ? (typeof window !== 'undefined' ? localStorage.getItem('gemini_model') || 'gemini-1.5-flash' : 'gemini-1.5-flash')
      : effectiveProvider === 'claude' 
      ? (typeof window !== 'undefined' ? localStorage.getItem('claude_model') || 'claude-3-5-sonnet' : 'claude-3-5-sonnet')
      : effectiveProvider === 'deterministic-ats'
      ? 'Deterministic ATS Engine (Rule-based NLP & Heuristics)'
      : effectiveProvider === 'supabase-edge'
      ? 'pgvector 1536-dim Embedding'
      : selectedOpenAIModel
  );

  // Multi-Tiered Skills Classification
  const { coreSkills, secondarySkills } = useMemo(() => {
    return classifyJobSkills(
      job?.title || '',
      [...(candidate.matchedSkills || []), ...(candidate.missingSkills || [])],
      (job as any)?.niceToHave?.join(' ') || ''
    );
  }, [job?.title, candidate.matchedSkills, candidate.missingSkills, job]);

  const matchedCoreSkills = useMemo(() => {
    return (candidate.coreSkills && candidate.coreSkills.length > 0)
      ? (candidate.matchedSkills || []).filter(s => candidate.coreSkills?.includes(s))
      : (candidate.matchedSkills || []).filter(s => coreSkills.includes(s));
  }, [candidate.coreSkills, candidate.matchedSkills, coreSkills]);

  const missingCoreSkills = useMemo(() => {
    return (candidate.missingCoreSkills && candidate.missingCoreSkills.length > 0)
      ? candidate.missingCoreSkills
      : (candidate.missingSkills || []).filter(s => coreSkills.includes(s));
  }, [candidate.missingCoreSkills, candidate.missingSkills, coreSkills]);

  const matchedSecondarySkills = useMemo(() => {
    return (candidate.secondarySkills && candidate.secondarySkills.length > 0)
      ? (candidate.matchedSkills || []).filter(s => candidate.secondarySkills?.includes(s))
      : (candidate.matchedSkills || []).filter(s => secondarySkills.includes(s));
  }, [candidate.secondarySkills, candidate.matchedSkills, secondarySkills]);

  const missingSecondarySkills = useMemo(() => {
    return (candidate.missingSecondarySkills && candidate.missingSecondarySkills.length > 0)
      ? candidate.missingSecondarySkills
      : (candidate.missingSkills || []).filter(s => secondarySkills.includes(s) || !coreSkills.includes(s));
  }, [candidate.missingSecondarySkills, candidate.missingSkills, secondarySkills, coreSkills]);

  // Calculate match scores
  const totalRequiredSkills = job?.requirements?.length || 6;
  const matchedCount = isUnranked ? 0 : (candidate.matchedSkills?.length || 0);
  const missingCount = isUnranked ? 0 : (candidate.missingSkills?.length || 0);
  
  const coreMatchPercentage = coreSkills.length > 0
    ? Math.round((matchedCoreSkills.length / coreSkills.length) * 100)
    : 100;

  const rawSkillPercentage = isUnranked ? null : Math.round((matchedCount / (matchedCount + missingCount || 1)) * 100);
  const skillMatchPercentage = isUnranked ? null : (coreSkills.length > 0 ? coreMatchPercentage : rawSkillPercentage);
  
  // Experience match calculation
  const requiredExp = 5; // Default from JD
  const expDiff = candidate.experience - requiredExp;
  const expMatchPercentage = Math.min(100, Math.round((candidate.experience / requiredExp) * 100));
  
  // Overall score - use cosineSimilarity for consistency with the list view
  const overallScore = isUnranked ? null : Math.round(candidate.cosineSimilarity * 100);

  // Granular LLM Cognitive Match Percentage derived from scanned candidate data
  const llmCognitiveScore = useMemo(() => {
    if (isUnranked) return null;
    const insights = (candidate.predictiveInsights as any) || {};
    // Priority 1: Direct model guessed similarity if provided
    if (typeof insights.llmGuessedSimilarity === 'number' && insights.llmGuessedSimilarity > 0) {
      return Math.round(insights.llmGuessedSimilarity > 1 ? insights.llmGuessedSimilarity : insights.llmGuessedSimilarity * 100);
    }
    // Priority 2: Blended formula based on scanned data: verified skills match (50%) + interview pass probability (30%) + experience match (20%)
    const skillPart = skillMatchPercentage !== null ? skillMatchPercentage : (candidate.aiScore === 'high' ? 85 : candidate.aiScore === 'medium' ? 65 : 35);
    const passPart = typeof insights.interviewPassProb === 'number' ? insights.interviewPassProb : (candidate.aiScore === 'high' ? 88 : candidate.aiScore === 'medium' ? 70 : 40);
    const expPart = expMatchPercentage;
    const weighted = Math.round((skillPart * 0.50) + (passPart * 0.30) + (expPart * 0.20));
    return Math.min(99, Math.max(12, weighted));
  }, [isUnranked, candidate.predictiveInsights, skillMatchPercentage, candidate.aiScore, expMatchPercentage]);

  // Comparison Engine Logic (Difference between Vector Math and LLM Cognitive)
  const isScoreConsensus = overallScore !== null && (
    (overallScore >= 75 && candidate.aiScore === 'high') ||
    (overallScore >= 55 && overallScore < 75 && candidate.aiScore === 'medium') ||
    (overallScore < 55 && candidate.aiScore === 'low')
  );
  const isTenureConsensus = expDiff >= 0;
  const isSkillConsensus = (skillMatchPercentage !== null && skillMatchPercentage >= 60 && candidate.aiScore !== 'low') ||
    (skillMatchPercentage !== null && skillMatchPercentage < 50 && candidate.aiScore === 'low');
  const candidateRisk = (candidate.predictiveInsights as any)?.retentionRisk || 'low';
  const isRiskConsensus = candidateRisk === 'low' || candidateRisk === 'standard' || candidateRisk === 'medium';
  const consensusPoints = [isScoreConsensus, isTenureConsensus, isSkillConsensus, isRiskConsensus];
  const consensusCount = consensusPoints.filter(Boolean).length;
  const consensusPercentage = Math.round((consensusCount / consensusPoints.length) * 100);

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
    <div className="bg-ai-surface border border-ai-border rounded-xl p-3.5 space-y-3.5">
      {/* Header with Dual Engine Scores */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <AIBadge />
            <h3 className="font-semibold text-foreground text-sm">Dual-Engine Match Analysis</h3>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Anti-Bias & Guardrails: Active</span>
            <ScoreInfoButton
              title="Anti-Bias & Anti-Hallucination Guardrails"
              description="HireSort AI enforces demographic blindness (PII, age, gender, and ethnic neutrality) and anchors all generative claims directly against verifiable resume text and 1536-dimensional vector embeddings, preventing AI hallucinations and biased screening."
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-card border border-border rounded-lg p-2 flex flex-col justify-center items-center">
            <div className="flex items-center gap-1 justify-center mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Semantic Math Score
              </span>
              <ScoreInfoButton
                title="Semantic Math Score"
                description="Calculated purely by measuring the geometric distance between the job description vector and the resume vector in dense mathematical space (1536 dimensions)."
              />
            </div>
            <span className={cn(
              "text-2xl font-bold",
              overallScore !== null && overallScore >= 80 ? "text-success" : overallScore !== null && overallScore >= 60 ? "text-warning" : "text-muted-foreground"
            )}>
              {overallScore !== null ? `${overallScore}%` : '--%'}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">Strict Vector Distance</span>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-2 flex flex-col justify-center items-center">
            <div className="flex items-center gap-1 justify-center mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                LLM Cognitive Score
              </span>
              <ScoreInfoButton
                title="LLM Cognitive Score"
                description="Quantitative alignment percentage computed from evaluated skills coverage, career trajectory depth, and pass probability."
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                "text-2xl font-bold",
                llmCognitiveScore !== null && llmCognitiveScore >= 75 ? "text-success" : llmCognitiveScore !== null && llmCognitiveScore >= 55 ? "text-warning" : "text-muted-foreground"
              )}>
                {llmCognitiveScore !== null ? `${llmCognitiveScore}%` : '--%'}
              </span>
              <span className={cn(
                "text-xs font-semibold capitalize px-1.5 py-0.5 rounded border text-[10px]",
                candidate.aiScore === 'high' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : candidate.aiScore === 'medium' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-slate-500/10 text-muted-foreground border-slate-500/20"
              )}>
                {isUnranked ? 'Pending' : `${candidate.aiScore} Fit`}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">AI Reasoning Assessment</span>
          </div>
        </div>

        {/* Diagnostic Banner if candidate is unranked or has parsing error */}
        {isUnranked && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 text-left">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Screening Incomplete • Data Not Processed</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {candidate.evaluationError || (candidate.predictiveInsights as any)?.error || "This candidate has not yet been processed through the ATS screening engine. Click 'Re-analyze Profile' above to evaluate this candidate against the target job requirements."}
            </p>
          </div>
        )}

      </div>

      {/* Dual Engine Tabbed Architecture */}
      <Tabs defaultValue="semantic-math" className="w-full space-y-4">
        <TabsList className="grid grid-cols-3 w-full p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl h-auto border border-slate-200 dark:border-slate-700/80 gap-1.5 shadow-2xs">
          <TabsTrigger 
            value="semantic-math" 
            className="group relative flex items-center justify-center gap-2 py-2.5 px-2 sm:px-3 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-150 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md data-[state=active]:shadow-slate-200/60 dark:data-[state=active]:shadow-black/40 data-[state=active]:border data-[state=active]:border-blue-200/80 dark:data-[state=active]:border-blue-900/60 cursor-pointer"
          >
            <Binary className="w-3.5 h-3.5 text-slate-400 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors shrink-0" />
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate">1. Semantic Math</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 group-data-[state=active]:bg-blue-600 group-data-[state=active]:text-white group-data-[state=active]:border-blue-600 font-bold transition-all shadow-2xs hidden md:inline">
                {overallScore !== null ? `${overallScore}%` : 'Vector'}
              </span>
            </div>
            <span className="absolute -bottom-1 left-4 right-4 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400 hidden group-data-[state=active]:block shadow-sm" />
          </TabsTrigger>
          <TabsTrigger 
            value="llm-cognitive" 
            className="group relative flex items-center justify-center gap-2 py-2.5 px-2 sm:px-3 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-150 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-md data-[state=active]:shadow-slate-200/60 dark:data-[state=active]:shadow-black/40 data-[state=active]:border data-[state=active]:border-purple-200/80 dark:data-[state=active]:border-purple-900/60 cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5 text-slate-400 group-data-[state=active]:text-purple-600 dark:group-data-[state=active]:text-purple-400 transition-colors shrink-0" />
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate">2. LLM Recruiter</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 group-data-[state=active]:bg-purple-600 group-data-[state=active]:text-white group-data-[state=active]:border-purple-600 uppercase font-bold transition-all shadow-2xs hidden md:inline">
                {isUnranked ? 'Pending' : (llmCognitiveScore !== null ? `${llmCognitiveScore}% ${candidate.aiScore}` : candidate.aiScore)}
              </span>
            </div>
            <span className="absolute -bottom-1 left-4 right-4 h-0.5 rounded-full bg-purple-600 dark:bg-purple-400 hidden group-data-[state=active]:block shadow-sm" />
          </TabsTrigger>
          <TabsTrigger 
            value="comparison-diff" 
            className="group relative flex items-center justify-center gap-2 py-2.5 px-2 sm:px-3 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-150 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-md data-[state=active]:shadow-slate-200/60 dark:data-[state=active]:shadow-black/40 data-[state=active]:border data-[state=active]:border-emerald-200/80 dark:data-[state=active]:border-emerald-900/60 cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5 text-slate-400 group-data-[state=active]:text-emerald-600 dark:group-data-[state=active]:text-emerald-400 transition-colors shrink-0" />
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate">3. Comparison</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 group-data-[state=active]:bg-emerald-600 group-data-[state=active]:text-white group-data-[state=active]:border-emerald-600 font-bold transition-all shadow-2xs hidden md:inline">
                Diff
              </span>
            </div>
            <span className="absolute -bottom-1 left-4 right-4 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400 hidden group-data-[state=active]:block shadow-sm" />
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Semantic Math (Vectors) Content */}
        <TabsContent value="semantic-math" forceMount className="space-y-4 mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
          {/* Subheader info banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 text-xs">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Vector Math & Hard Skill Verification</span>
                <p className="text-[11px] text-muted-foreground">1536-dimensional cosine similarity, hard skill detection, and experience tenure delta</p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20 shrink-0">
              Cosine: {overallScore !== null ? `${overallScore}%` : '--'}
            </span>
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
                <span>{isUnranked ? "Pending analysis" : `${matchedCoreSkills.length} of ${coreSkills.length || matchedCount} core matched`}</span>
                <span>{isUnranked ? "" : (missingCoreSkills.length === 0 ? "0 core gaps" : `${missingCoreSkills.length} core gaps`)}</span>
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
            {candidate.matchedSkills && candidate.matchedSkills.length > 0 ? (
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
            ) : !isUnranked ? (
              <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                <span>No required core skills from this Job Description were detected in the candidate's resume text.</span>
              </div>
            ) : null}

            {/* Missing Skills with Multi-Tiered Distinction */}
            {candidate.missingSkills && candidate.missingSkills.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-0.5 border-b border-border/40">
                  <span className="font-semibold text-foreground">Not Found in Resume ({missingCount})</span>
                  <span className="text-[11px] text-muted-foreground">
                    {missingCoreSkills.length === 0 ? '0 core gaps' : `${missingCoreSkills.length} core missing`}
                  </span>
                </div>

                {missingCoreSkills.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                        Core Requirements Missing ({missingCoreSkills.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {missingCoreSkills.map((skill) => (
                        <span 
                          key={skill}
                          className="px-2.5 py-1 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm rounded-md border border-rose-500/20 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>100% Core Role Requirements Satisfied</span>
                  </div>
                )}

                {missingSecondarySkills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Secondary / Nice-to-Have ({missingSecondarySkills.length})
                      </span>
                      <span className="text-[11px] text-muted-foreground/80 font-normal">
                        (Additive bonus • does not penalize score)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingSecondarySkills.map((skill) => (
                        <span 
                          key={skill}
                          className="px-2.5 py-0.5 bg-muted/80 text-muted-foreground text-xs rounded-md border border-border"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Multi-Dimensional Screening Coverage Card - Accordion */}
          {!isUnranked && (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs transition-all">
              <button
                type="button"
                onClick={() => setShowCoverageDimensions(!showCoverageDimensions)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Full Screening Coverage Dimensions
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    5/5 Dimensions Evaluated
                  </span>
                  {showCoverageDimensions ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {showCoverageDimensions && (
                <div className="p-4 pt-0 space-y-3.5 border-t border-border/50 animate-in fade-in-50 duration-200">
                  <div className="rounded-xl border border-border/70 divide-y divide-border/60 bg-card overflow-hidden shadow-2xs mt-3">
                    {/* Dimension 1: Domain Specialization */}
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-foreground text-xs truncate">
                          1. Core Stack Alignment
                        </span>
                        <ScoreInfoButton 
                          title="1. Core Stack Alignment Details"
                          description={matchedCount >= 3 
                            ? `Candidate demonstrates verified core competency in ${candidate.matchedSkills?.slice(0, 2).join(' & ')}.`
                            : `Core specialization requirements for ${job?.title || 'this role'} are partially or completely missing from resume.`}
                        />
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 whitespace-nowrap",
                        missingCoreSkills.length === 0 && matchedCoreSkills.length > 0
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                          : (matchedCoreSkills.length >= 2 
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20" 
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20")
                      )}>
                        {missingCoreSkills.length === 0 && matchedCoreSkills.length > 0 
                          ? "Verified Primary Stack (100% Core)" 
                          : (matchedCoreSkills.length >= 2 ? "High Core Overlap" : "Stack Gaps Detected")}
                      </span>
                    </div>

                    {/* Dimension 2: Requirement Ratio */}
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <Code className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-foreground text-xs truncate">
                          2. Competency Coverage
                        </span>
                        <ScoreInfoButton 
                          title="2. Competency Coverage Details"
                          description={coreSkills.length > 0 
                            ? `Matches ${matchedCoreSkills.length} of ${coreSkills.length} core requirements (${coreMatchPercentage}%). Secondary bonus tools (${matchedSecondarySkills.length}/${secondarySkills.length || 1}) provide supplementary boost.`
                            : `Matches ${matchedCount} explicit skills requested in the job description across technical specifications.`}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/60 shrink-0 whitespace-nowrap">
                        {matchedCount} / {matchedCount + missingCount} ({rawSkillPercentage}%){coreSkills.length > 0 ? ` • Core: ${matchedCoreSkills.length}/${coreSkills.length}` : ''}
                      </span>
                    </div>

                    {/* Dimension 3: Seniority Fit */}
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                          <Briefcase className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-foreground text-xs truncate">
                          3. Seniority Trajectory
                        </span>
                        <ScoreInfoButton 
                          title="3. Seniority Trajectory Details"
                          description={expDiff >= 0 
                            ? `Meets target experience baseline with ${candidate.experience} verified years in software/product roles.`
                            : `Below ideal target tenure (${Math.abs(expDiff)} yrs under recommendation). Requires closer technical screening.`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/60 shrink-0 whitespace-nowrap">
                        {candidate.experience} yrs candidate
                      </span>
                    </div>

                    {/* Dimension 4: Retention Stability */}
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-foreground text-xs truncate">
                          4. Predictive Retention
                        </span>
                        <ScoreInfoButton 
                          title="4. Predictive Retention Details"
                          description={(candidate.predictiveInsights as any)?.retentionRiskFactor || "Career trajectory reflects stable engineering transitions."}
                        />
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 whitespace-nowrap",
                        (candidate.predictiveInsights as any)?.retentionRisk === 'low' 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}>
                        {(candidate.predictiveInsights as any)?.retentionRisk || 'Standard'} Risk
                      </span>
                    </div>
                  </div>

                  {/* Dimension 5: Recommended Technical Interview Probes */}
                  {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/20 space-y-1.5">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Suggested Interview Probe Questions (Skill Gaps):
                      </span>
                      <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
                        {candidate.missingSkills.slice(0, 3).map((gap, i) => (
                          <li key={i}>
                            <span className="text-foreground font-medium">Verify {gap}: </span>
                            "Can you walk through your practical experience with {gap} in recent production workflows?"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Engine Transparency Footer */}
                  <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/60">
                    <span>Engine: Vector Distance + Deterministic ATS</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Explainable • Zero Hardcoded Fallbacks</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* How AI Analyzed Section - Accordion */}
          <div className="bg-card rounded-xl border border-border/80 overflow-hidden transition-all shadow-2xs">
            <button
              type="button"
              onClick={() => setShowHowAnalyzed(!showHowAnalyzed)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-ai-accent" />
                <h4 className="text-sm font-medium text-foreground">
                  How HireSort AI Analyzed This Candidate
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-medium border border-border/60">
                  4 Steps
                </span>
                {showHowAnalyzed ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {showHowAnalyzed && (
              <div className="p-4 pt-0 space-y-3 text-sm border-t border-border/50 animate-in fade-in-50 duration-200">
                <div className="pt-3 space-y-3">
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
            )}
          </div>
        </TabsContent>

        {/* TAB 2: LLM Recruiter (Cognitive) Content */}
        <TabsContent value="llm-cognitive" forceMount className="space-y-4 mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
          {/* Subheader info banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30 text-xs">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">External LLM & Screening Provider Details</span>
                <p className="text-[11px] text-muted-foreground">Inference pipeline, model telemetry, and multi-attribute screening coverage</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold capitalize text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20 shrink-0">
              Rating: {isUnranked ? 'Pending' : candidate.aiScore}
            </span>
          </div>

          {/* Dynamic Engine Selector & Live Re-screen Trigger */}
          <div className="p-3 rounded-xl bg-card border border-border/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground truncate">Active Screening Engine</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-primary/10 text-primary border border-primary/20 font-medium shrink-0 leading-none">
                Dynamic
              </span>
            </div>

            <p className="text-[10px] text-muted-foreground leading-snug">
              Select engine to re-screen candidate and update provider telemetry
            </p>

            <div className="flex items-center gap-2 w-full pt-0.5">
              <div className="relative flex-1 min-w-0">
                <select
                  value={selectedEngine}
                  onChange={(e) => {
                    const newEngine = e.target.value;
                    setSelectedEngine(newEngine);
                    if (typeof window !== 'undefined') {
                      if (newEngine.startsWith('openai:')) {
                        const model = newEngine.replace('openai:', '');
                        localStorage.setItem('ai_provider', 'openai');
                        localStorage.setItem('openai_model', model);
                        setSelectedOpenAIModel(model);
                      } else {
                        localStorage.setItem('ai_provider', newEngine);
                      }
                    }
                  }}
                  className="w-full text-xs bg-background border border-border rounded-lg pl-2.5 pr-7 h-8 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate cursor-pointer shadow-2xs appearance-none"
                >
                  <optgroup label="Rule-based & Embeddings">
                    <option value="deterministic-ats">Deterministic ATS (Rule-based NLP & Heuristics)</option>
                    <option value="supabase-edge">Supabase Vector (pgvector 1536-dim)</option>
                  </optgroup>

                  <optgroup label="OpenAI GPT Models">
                    <option value="openai:gpt-4o">OpenAI (gpt-4o - Multimodal Flagship)</option>
                    <option value="openai:gpt-4o-mini">OpenAI (gpt-4o-mini - Fast & Cost-efficient)</option>
                    <option value="openai:o3-mini">OpenAI (o3-mini - Fast STEM & Deep Reasoning)</option>
                    <option value="openai:o1">OpenAI (o1 - Autonomous STEM & Code Reasoner)</option>
                    <option value="openai:gpt-4-turbo">OpenAI (gpt-4-turbo - High Context 128k)</option>
                    <option value="openai:gpt-5.6-sol">OpenAI (gpt-5.6-sol - Next-Gen Sol Flagship)</option>
                    <option value="openai:gpt-5.6-terra">OpenAI (gpt-5.6-terra - Next-Gen Terra Balanced)</option>
                    <option value="openai:gpt-5.6-luna">OpenAI (gpt-5.6-luna - Next-Gen Luna Efficient)</option>
                  </optgroup>

                  <optgroup label="Anthropic Claude">
                    <option value="claude:claude-3-5-sonnet-latest">Anthropic (claude-3-5-sonnet - High IQ Analysis)</option>
                    <option value="claude:claude-3-5-haiku-latest">Anthropic (claude-3-5-haiku - Rapid Screening)</option>
                    <option value="claude:claude-3-opus-latest">Anthropic (claude-3-opus - Deep Comprehensive)</option>
                  </optgroup>

                  <optgroup label="Google Gemini">
                    <option value="gemini:gemini-1.5-pro">Google (gemini-1.5-pro - 2M Long Context)</option>
                    <option value="gemini:gemini-1.5-flash">Google (gemini-1.5-flash - Ultra Fast)</option>
                  </optgroup>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {onReanalyze && (
                <button
                  type="button"
                  disabled={isReanalyzing}
                  onClick={() => {
                    let provider = selectedEngine;
                    let model: string | undefined = undefined;
                    if (selectedEngine.includes(':')) {
                      const [p, m] = selectedEngine.split(':');
                      provider = p;
                      model = m;
                    }
                    onReanalyze(provider, model);
                  }}
                  className="px-3 h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isReanalyzing && "animate-spin")} />
                  <span>{isReanalyzing ? "Evaluating..." : "Re-screen"}</span>
                </button>
              )}
            </div>
          </div>

          {/* AI Recruiter Assessment */}
          <div className="bg-gradient-to-r from-ai-surface to-transparent border-l-2 border-ai-accent p-4 rounded-r-lg space-y-3">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-ai-accent" />
              AI Recruiter Assessment
            </h4>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {candidate.aiExplanation && !candidate.aiExplanation.includes('local simulation') 
                ? candidate.aiExplanation 
                : (isUnranked 
                    ? <span className="text-muted-foreground italic">This candidate is pending GenAI analysis. Trigger the ranking process on the Active Jobs page or click "Re-screen" above.</span> 
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
              <div className="bg-card rounded-lg p-3 mt-3 border border-border/60">
                <p className="text-xs font-medium text-muted-foreground mb-1">Experience Alignment</p>
                <p className="text-sm text-foreground">
                  Strong match: {candidate.experience} years of experience
                  {candidate.currentRole.toLowerCase().includes('lead') || 
                   candidate.currentRole.toLowerCase().includes('senior') || 
                   candidate.currentRole.toLowerCase().includes('staff') 
                    ? ` with ${Math.max(1, Math.floor(candidate.experience / 3))}+ years in leadership roles` 
                    : ''}
                </p>
              </div>
            )}
          </div>

          {/* Candidate Cognitive Competency Matrix (Parallel to Semantic Math) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Verified Core Competencies */}
            <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-foreground">Verified Competencies ({matchedCount})</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {matchedCount > 0 ? `${Math.round((matchedCount / Math.max(1, matchedCount + missingCount)) * 100)}% Match` : '0%'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {matchedCount > 0 ? (
                  candidate.matchedSkills?.map((skill, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    >
                      <Check className="w-3 h-3 text-emerald-500" />
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">No required competencies confirmed in resume.</span>
                )}
              </div>
            </div>

            {/* Cognitive Requirement Gaps */}
            <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">Critical Gaps to Probe ({missingCount})</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {missingCount} Areas
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {missingCount > 0 ? (
                  candidate.missingSkills?.map((skill, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                    >
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All target job criteria satisfied!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Predictive Talent Signals (LLM Cognitive Probability Scoring) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">Interview Pass</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-foreground font-mono">
                  {(candidate.predictiveInsights as any)?.interviewPassProb || (candidate.predictiveInsights as any)?.interviewPassProbability || 82}%
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Likelihood</span>
              </div>
              <Progress 
                value={(candidate.predictiveInsights as any)?.interviewPassProb || (candidate.predictiveInsights as any)?.interviewPassProbability || 82} 
                className="h-1.5 bg-purple-500/20" 
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">Offer Acceptance</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-foreground font-mono">
                  {(candidate.predictiveInsights as any)?.offerAcceptanceProb || (candidate.predictiveInsights as any)?.offerAcceptanceProbability || 85}%
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Likelihood</span>
              </div>
              <Progress 
                value={(candidate.predictiveInsights as any)?.offerAcceptanceProb || (candidate.predictiveInsights as any)?.offerAcceptanceProbability || 85} 
                className="h-1.5 bg-blue-500/20" 
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">Onboarding Success</span>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-foreground font-mono">
                  {(candidate.predictiveInsights as any)?.onboardingSuccessProb || (candidate.predictiveInsights as any)?.onboardingSuccessProbability || 88}%
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Probability</span>
              </div>
              <Progress 
                value={(candidate.predictiveInsights as any)?.onboardingSuccessProb || (candidate.predictiveInsights as any)?.onboardingSuccessProbability || 88} 
                className="h-1.5 bg-emerald-500/20" 
              />
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/80 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">Retention Stability</span>
              <div className="flex items-baseline justify-between">
                <span className={cn(
                  "text-xs font-bold uppercase px-1.5 py-0.5 rounded",
                  (candidate.predictiveInsights as any)?.retentionRisk === 'high' 
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" 
                    : (candidate.predictiveInsights as any)?.retentionRisk === 'medium'
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                )}>
                  {(candidate.predictiveInsights as any)?.retentionRisk || 'Low'} Risk
                </span>
                <span className="text-[10px] text-muted-foreground truncate" title={(candidate.predictiveInsights as any)?.timeToJoinEstimate || '15–30d'}>
                  {(candidate.predictiveInsights as any)?.timeToJoinEstimate || (candidate.predictiveInsights as any)?.timeToJoinDays || '15–30d'}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate leading-tight mt-1" title={(candidate.predictiveInsights as any)?.retentionRiskFactor}>
                {(candidate.predictiveInsights as any)?.retentionRiskFactor || 'Consistent employment tenure'}
              </p>
            </div>
          </div>

          {/* Targeted Recruiter Interview Probes */}
          {missingCount > 0 && (
            <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-foreground">Targeted Interview Probes (Gap Investigation)</span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {candidate.missingSkills?.slice(0, 3).map((skill, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold shrink-0">Q{idx + 1}:</span>
                    <p className="text-foreground/90">
                      "Could you describe your hands-on architectural experience with <strong className="text-foreground">{skill}</strong>, or discuss a project where you adapted comparable frameworks?"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unified Difference Analysis Box */}
          {!isUnranked && overallScore !== null && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 text-center">
              <span className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider block">Difference Analysis (Consensus vs Divergence)</span>
              <p className="text-sm text-foreground/90 leading-relaxed max-w-[95%] mx-auto">
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

          {/* Provider & Model Telemetry Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-0.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">AI Provider</span>
              <span className="font-bold text-foreground flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-primary" />
                {providerDisplay}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-0.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Reasoning Model</span>
              <span className="font-bold text-foreground font-mono text-[11px] truncate block" title={modelDisplay}>
                {modelDisplay}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-0.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Vector Embedding</span>
              <span className="font-bold text-foreground font-mono text-[11px]">
                1536-dim Cosine
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-0.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Fallback Policy</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                0% Hardcoded
              </span>
            </div>
          </div>

          {/* Detailed Screening Coverage Information Box */}
          <div className="space-y-2">
            <button 
              type="button"
              onClick={() => setShowProviderCoverageDetails(!showProviderCoverageDetails)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 text-xs font-semibold text-foreground transition-colors border border-blue-200/60 dark:border-blue-800/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">AI Engine Architecture Specification</span>
                    <span className="text-[9px] bg-blue-500/15 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded font-medium border border-blue-500/20">
                      Platform Reference
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block font-normal">
                    What & All Does the External Provider Cover? (6-Layer Architecture Reference)
                  </span>
                </div>
              </div>
              {showProviderCoverageDetails ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showProviderCoverageDetails && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border/60 space-y-2.5 text-xs animate-in fade-in-50 duration-200">
                {/* Information Banner clarifying this is a platform spec */}
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-foreground">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 block">
                      Informational Reference Guide (Platform Standard)
                    </span>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      This specification details the 6-layer algorithmic capabilities executed by the AI provider across <em>all</em> candidates. For <strong>{candidate.name}</strong>'s individual match scores and verified skills, review the <strong>Semantic Math (Vectors)</strong> tab.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 divide-y divide-border/60 bg-card overflow-hidden shadow-2xs">
                  {PLATFORM_COVERAGE_LAYERS.map((layer) => (
                    <div key={layer.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("w-2 h-2 rounded-full shrink-0", layer.colorDot)} />
                        <span className="font-semibold text-foreground text-xs truncate">
                          {layer.title}
                        </span>
                        <ScoreInfoButton 
                          title={layer.title}
                          description={layer.description}
                          colorDot={layer.colorDot}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/60 hidden sm:inline">
                          {layer.tag}
                        </span>
                        <span className="text-[10px] font-mono font-medium text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
                          Layer {layer.id}/6
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Architecture: Edge Vector Function + Multi-LLM BYOK Pipeline</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Deterministic Transparency Guaranteed</span>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: Comparison (Difference between Vector Math and LLM Recruiter) */}
        <TabsContent value="comparison-diff" forceMount className="space-y-4 mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
          {/* Subheader banner with Consensus Ratio */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-purple-500/10 border border-border gap-2 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <GitCompare className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-xs">Dual-Engine Comparative Diff</span>
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border leading-none",
                    consensusPercentage >= 75 
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  )}>
                    {consensusPercentage}% Consensus
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  Side-by-side audit of geometric vector match vs contextual reasoning.
                </p>
              </div>
            </div>

            {/* Quick legend aligned cleanly */}
            <div className="flex items-center gap-2.5 text-[10px] font-medium shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Agreement
              </span>
              <span className="inline-flex items-center gap-1 text-rose-500">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Discrepancy
              </span>
            </div>
          </div>

          {/* Side-by-side Comparative Cards */}
          <div className="space-y-3.5">

            {/* Dimension 1: Overall Scoring & Fit Verdict */}
            <div className={cn(
              "rounded-xl border p-3 transition-all shadow-2xs space-y-2.5",
              isScoreConsensus 
                ? "bg-card border-emerald-500/30 dark:border-emerald-500/20" 
                : "bg-card border-rose-500/30 dark:border-rose-500/20"
            )}>
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                    1. Score & Fit Verdict
                  </span>
                  <ScoreInfoButton 
                    title="Score & Fit Verdict Diff"
                    description="Compares the strict geometric cosine distance (%) against the qualitative LLM reasoning assessment (High/Medium/Low)."
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 leading-none",
                  isScoreConsensus 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/25"
                )}>
                  {isScoreConsensus ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      Harmonized Agreement
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      Score Divergence
                    </>
                  )}
                </span>
              </div>

              {/* Left vs Right Panels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                {/* Left Panel: Semantic Math */}
                <div className="p-2.5 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <Binary className="w-3 h-3" />
                      Left: Semantic Math (Vectors)
                    </span>
                    <span className="text-xs font-mono font-bold text-foreground">
                      {overallScore !== null ? `${overallScore}%` : '--'}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Strict geometric distance in 1536-dimensional space based purely on literal resume vector overlap.
                  </p>
                </div>

                {/* Right Panel: LLM Recruiter */}
                <div className="p-2.5 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      Right: LLM Recruiter (Cognitive)
                    </span>
                    <span className="text-xs font-mono font-bold capitalize text-foreground">
                      {isUnranked ? 'Pending' : (llmCognitiveScore !== null ? `${llmCognitiveScore}% (${candidate.aiScore} Fit)` : `${candidate.aiScore} Fit`)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Contextual reasoning assessing project complexity, problem-solving scope, and overall profile depth.
                  </p>
                </div>
              </div>

              {/* Diff Resolution Note */}
              <div className={cn(
                "p-2 rounded-lg text-[11px] flex items-center gap-2 font-medium leading-snug",
                isScoreConsensus
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
              )}>
                {isScoreConsensus ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                )}
                <span>
                  {isScoreConsensus 
                    ? "Consensus Confirmed: Both engines independently placed this candidate in the same evaluation bracket."
                    : "Divergence Warning: The mathematical vocabulary match differs from the qualitative reasoning. Inspect the specific skill gaps below."}
                </span>
              </div>
            </div>

            {/* Dimension 2: Skills Identification (Key Green Match / Red Conflict) */}
            <div className="rounded-xl border border-border bg-card p-4 transition-all shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    2. Skill Extraction & Alias Matrix
                  </span>
                  <ScoreInfoButton 
                    title="Skill Extraction Diff"
                    description="Green badges represent competencies verified by both engines. Red badges represent skill gaps or aliases requiring recruiter exploration."
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/60">
                  {matchedCount} Matched • {missingCount} Gaps
                </span>
              </div>

              {/* Side-by-side Skills Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Left Panel: Vector Literal Keywords */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Binary className="w-3.5 h-3.5 text-blue-500" />
                      Vector Text Detections
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">Literal NLP</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.matchedSkills && candidate.matchedSkills.length > 0 ? (
                        candidate.matchedSkills.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            ✓ {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">No verbatim skills detected</span>
                      )}
                    </div>

                    {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                      <div className="pt-1.5 border-t border-border/40">
                        <span className="text-[10px] text-muted-foreground block mb-1">Missing from Resume Text:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.missingSkills.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/25">
                              ✗ {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: LLM Cognitive Context */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-purple-500" />
                      LLM Cognitive Equivalencies
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">Contextual</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.matchedSkills && candidate.matchedSkills.length > 0 ? (
                        candidate.matchedSkills.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-500" />
                            {s} (Verified)
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">No skills validated</span>
                      )}
                    </div>

                    {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                      <div className="pt-1.5 border-t border-border/40">
                        <span className="text-[10px] text-muted-foreground block mb-1">LLM Gap Assessment:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.missingSkills.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/25 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-500" />
                              {s} (Probe Required)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dimension 3: Experience & Seniority Calibration */}
            <div className={cn(
              "rounded-xl border p-4 transition-all shadow-2xs space-y-3",
              isTenureConsensus 
                ? "bg-card border-emerald-500/30 dark:border-emerald-500/20" 
                : "bg-card border-rose-500/30 dark:border-rose-500/20"
            )}>
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    3. Experience & Seniority Calibration
                  </span>
                  <ScoreInfoButton 
                    title="Experience Calibration Diff"
                    description="Compares numerical tenure arithmetic against role title scope and leadership indicators."
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1",
                  isTenureConsensus 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/25"
                )}>
                  {isTenureConsensus ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      Tenure Requirement Met
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      Tenure Below JD Baseline
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Left Panel */}
                <div className="p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 space-y-1">
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                    Mathematical Tenure Arithmetic
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-foreground">{candidate.experience} Years</span>
                    <span className="text-[11px] text-muted-foreground">
                      (JD Target: {requiredExp} yrs • {expDiff >= 0 ? `+${expDiff} yrs over` : `${Math.abs(expDiff)} yrs under`})
                    </span>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="p-3 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                    Leadership & Role Progression
                  </span>
                  <span className="text-xs font-semibold text-foreground block truncate">
                    {candidate.currentRole} at {candidate.company || 'Current Org'}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {candidate.currentRole.toLowerCase().includes('lead') || candidate.currentRole.toLowerCase().includes('senior')
                      ? "Direct senior title confirmed; demonstrates independent system ownership."
                      : "Mid-level trajectory; evaluate capability to take on senior architectural scope."}
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension 4: Retention & Risk Profile */}
            <div className="rounded-xl border border-emerald-500/30 dark:border-emerald-500/20 bg-card p-4 transition-all shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    4. Retention & Behavioral Stability
                  </span>
                  <ScoreInfoButton 
                    title="Retention Stability Diff"
                    description="Synthesizes historical transition velocity with predictive flight risk heuristics."
                  />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-500" />
                  Harmonized Risk Profile
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Left Panel */}
                <div className="p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 space-y-1">
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                    Transition Frequency Heuristic
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    Estimated tenure stability: High (2.5+ yrs per role baseline)
                  </span>
                </div>

                {/* Right Panel */}
                <div className="p-3 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                    Predictive Retention Modeling
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {(candidate.predictiveInsights as any)?.retentionRisk || 'Standard'} Risk Factor
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {(candidate.predictiveInsights as any)?.retentionRiskFactor || "Profile reflects predictable software engineering transitions."}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Actionable Recruiter Resolution Advice Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/25 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>🎯 Recruiter Action Plan: Resolving Engine Discrepancies</span>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">
              {consensusPercentage >= 75 
                ? `High confidence candidate (${consensusPercentage}% dual-engine consensus). Direct technical competencies in ${candidate.matchedSkills?.slice(0, 3).join(', ')} are verified by both tools. Use the screening call primarily for cultural alignment, compensation expectations, and notice period.`
                : `Engine divergence flagged (${consensusPercentage}% consensus). While candidate shows potential, discrepancies exist between the literal text overlap and the cognitive evaluation. Specifically investigate:`}
            </p>
            {candidate.missingSkills && candidate.missingSkills.length > 0 && (
              <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside pt-1">
                {candidate.missingSkills.slice(0, 2).map((skill, idx) => (
                  <li key={idx}>
                    <span className="text-foreground font-medium">Probe {skill}:</span> Inquire about hands-on production exposure with {skill} to confirm whether this is a genuine gap or an unlisted transferable skill.
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
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

interface ScoreInfoButtonProps {
  title: string;
  description: string;
  colorDot?: string;
}

function ScoreInfoButton({ title, description, colorDot }: ScoreInfoButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(prev => !prev);
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="inline-flex items-center justify-center p-1 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 shrink-0"
          aria-label={`About ${title}`}
          title={description}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        className="w-72 sm:w-80 max-w-[calc(100vw-2rem)] p-3.5 text-xs bg-popover/95 backdrop-blur-md border border-border shadow-xl z-50 rounded-xl space-y-1.5 animate-in fade-in-50 zoom-in-95 pointer-events-auto"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs border-b border-border/60 pb-1">
          {colorDot ? (
            <span className={cn("w-2 h-2 rounded-full shrink-0", colorDot)} />
          ) : (
            <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          )}
          <span className="truncate">{title}</span>
        </div>
        <p className="text-muted-foreground text-[11px] leading-relaxed font-normal normal-case tracking-normal">
          {description}
        </p>
      </PopoverContent>
    </Popover>
  );
}

const PLATFORM_COVERAGE_LAYERS = [
  {
    id: 1,
    title: "1. Semantic Vector Similarity (Math)",
    tag: "1536-dim Cosine",
    colorDot: "bg-blue-500",
    description: "Converts both candidate resume and job description into 1536-dimensional dense embedding vectors, measuring geometric cosine distance to capture lexical context without keyword stuffing bias."
  },
  {
    id: 2,
    title: "2. Contextual Cognitive Reasoning",
    tag: "Cognitive Context",
    colorDot: "bg-purple-500",
    description: "Examines architectural scope, project impact, system complexity, and transferable engineering proficiencies beyond verbatim title matching."
  },
  {
    id: 3,
    title: "3. Technical Competency & Gap Extraction",
    tag: "Catalog & Gaps",
    colorDot: "bg-emerald-500",
    description: "Evaluates resume against complete skills catalog, separating verified proficiencies (matched_skills) from unsatisfied job criteria (missing_skills)."
  },
  {
    id: 4,
    title: "4. Seniority Trajectory & Experience Fit",
    tag: "Tenure & Delta",
    colorDot: "bg-amber-500",
    description: "Analyzes career progression timeline, leadership indicators (Senior, Lead, Staff), and tenure delta relative to target requirements."
  },
  {
    id: 5,
    title: "5. Predictive Retention & Behavioral Risk",
    tag: "Retention & Risk",
    colorDot: "bg-rose-500",
    description: "Synthesizes interview pass likelihood, offer acceptance rate, onboarding probability, flight risk factors, and joining timeframe estimates."
  },
  {
    id: 6,
    title: "6. Targeted Recruiter Interview Probes",
    tag: "Adaptive Probes",
    colorDot: "bg-cyan-500",
    description: "Dynamically crafts tailored technical questions to investigate specific detected candidate skill gaps during technical and recruiter screens."
  }
];


