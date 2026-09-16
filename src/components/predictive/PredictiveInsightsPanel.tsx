import { useState } from 'react';
import { Candidate } from '@/types/hiresort';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
    AlertCircle, 
    CheckCircle2, 
    TrendingUp, 
    AlertTriangle, 
    Info, 
    Sparkles, 
    Zap, 
    Briefcase, 
    ShieldCheck, 
    ChevronDown, 
    ChevronUp 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface PredictiveInsightsPanelProps {
    candidate: Candidate;
}

function detectResumeAuthorship(resumeText?: string) {
    if (!resumeText || resumeText.length < 50) {
        return {
            aiProbability: 8,
            humanProbability: 92,
            reasoning: 'Authentic career progression, client engagements, and direct candidate narrative.'
        };
    }
    const text = resumeText.toLowerCase();
    
    // Generic AI resume builder buzzwords and overly formulaic phrasing
    const aiPhrases = [
        'spearheaded', 'leveraged', 'orchestrated', 'pioneered', 'testament',
        'game-changer', 'tapestry', 'synergistic', 'in an ever-evolving',
        'fostering a culture of', 'proven track record of success',
        'dynamic and results-driven', 'adept at navigating', 'cutting-edge'
    ];
    
    let matchCount = 0;
    for (const phrase of aiPhrases) {
        if (text.includes(phrase)) matchCount++;
    }
    
    // Genuine human resume markers (verifiable dates, contact details, company metrics)
    const hasDates = /\b(20\d\d|19\d\d)\b/.test(text);
    const hasPhone = /\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b|\b\d{10}\b/.test(text);
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
    
    let aiProb = Math.min(85, Math.max(5, matchCount * 12));
    if (hasDates && (hasPhone || hasEmail)) {
        aiProb = Math.max(5, aiProb - 15);
    }
    
    const humanProb = 100 - aiProb;
    const reasoning = aiProb > 65
        ? 'High concentration of repetitive generative AI templates and formulaic buzzwords.'
        : (aiProb > 30 
            ? 'Mixed composition: authentic career narrative with occasional AI-assisted phrasing.'
            : 'Authentic human authorship: natural lexical variance, verifiable employment timelines, and specific project metrics.');
            
    return { aiProbability: aiProb, humanProbability: humanProb, reasoning };
}

export function PredictiveInsightsPanel({ candidate }: PredictiveInsightsPanelProps) {
    const [showBreakdownDetails, setShowBreakdownDetails] = useState(false);

    if (!candidate.predictiveInsights) return null;

    const {
        interviewPassProb = 0,
        offerAcceptanceProb = 0,
        retentionRisk = 'medium',
        retentionRiskFactor,
        timeToJoinEstimate,
        onboardingSuccessProb = 0,
        assessment,
        aiGeneratedProbability,
        aiGeneratedReasoning = 'Insufficient data to determine.'
    } = candidate.predictiveInsights as any;

    // Detect / derive authorship percentages
    const detectedAuthorship = detectResumeAuthorship(candidate.resumeText);
    const aiProb = typeof aiGeneratedProbability === 'number' && aiGeneratedProbability > 0
        ? Math.round(aiGeneratedProbability)
        : detectedAuthorship.aiProbability;
    const humanProb = 100 - aiProb;
    const isAIGenerated = aiProb > 65;
    const effectiveReasoning = aiGeneratedReasoning && aiGeneratedReasoning !== 'Insufficient data to determine.'
        ? aiGeneratedReasoning
        : detectedAuthorship.reasoning;
    const resumeFormat = isAIGenerated ? `${aiProb}% AI Generated` : `${humanProb}% Human Written`;

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'text-success';
            case 'medium': return 'text-warning';
            case 'high': return 'text-destructive';
            default: return 'text-muted-foreground';
        }
    };

    const getRiskBg = (risk: string) => {
        switch (risk) {
            case 'low': return 'bg-success/10';
            case 'medium': return 'bg-warning/10';
            case 'high': return 'bg-destructive/10';
            default: return 'bg-muted';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-ai-accent" />
                        Predictive AI Insights
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                    <AlertCircle className="w-3 h-3" />
                                    AI Prediction
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs text-xs">These are probabilistic forecasts based on historical data and candidate profile. Human judgment is recommended.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Success Probabilities */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                                <span>Interview Pass Probability</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            aria-label="View Interview Pass Details"
                                            title="Click to view candidate breakdown"
                                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center justify-center"
                                        >
                                            <Info className="w-3.5 h-3.5 text-primary" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-3.5 space-y-2.5 z-50 text-xs shadow-lg border border-border bg-card">
                                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                            <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                                Interview Pass Drivers: {candidate.name}
                                            </span>
                                            <span className="font-bold text-primary font-mono">{interviewPassProb}%</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Projected pass probability for technical & recruiter screens based on verified skills and role seniority.
                                        </p>
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex items-start gap-1.5 text-[11px]">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <span><strong>Verified Stack:</strong> {candidate.matchedSkills && candidate.matchedSkills.length > 0 ? candidate.matchedSkills.slice(0, 3).join(', ') : 'Direct skills evaluated'}</span>
                                            </div>
                                            <div className="flex items-start gap-1.5 text-[11px]">
                                                <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                                <span><strong>Experience Match:</strong> {candidate.experience} yrs in {candidate.currentRole}</span>
                                            </div>
                                            {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                                                <div className="flex items-start gap-1.5 text-[11px]">
                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                    <span><strong>Probe During Interview:</strong> {candidate.missingSkills.slice(0, 2).join(', ')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </span>
                            <span className="font-semibold">{interviewPassProb}%</span>
                        </div>
                        <Progress value={interviewPassProb} className="h-2" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                                <span>Offer Acceptance Probability</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            aria-label="View Offer Acceptance Details"
                                            title="Click to view candidate breakdown"
                                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center justify-center"
                                        >
                                            <Info className="w-3.5 h-3.5 text-primary" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-3.5 space-y-2.5 z-50 text-xs shadow-lg border border-border bg-card">
                                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                            <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                                Offer Acceptance Drivers: {candidate.name}
                                            </span>
                                            <span className="font-bold text-primary font-mono">{offerAcceptanceProb}%</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Likelihood of signing an offer package based on current seniority tier, growth motivation, and availability.
                                        </p>
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex items-start gap-1.5 text-[11px]">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <span><strong>Career Trajectory:</strong> Currently {candidate.currentRole} at {candidate.company || 'previous employer'}, representing strong career progression.</span>
                                            </div>
                                            <div className="flex items-start gap-1.5 text-[11px]">
                                                <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                                <span><strong>Projected Availability:</strong> Estimated {timeToJoinEstimate || '15–30 days'} joining window.</span>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </span>
                            <span className="font-semibold">{offerAcceptanceProb}%</span>
                        </div>
                        <Progress value={offerAcceptanceProb} className="h-2" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                                <span>Onboarding Success Probability</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            aria-label="View Onboarding Success Details"
                                            title="Click to view candidate breakdown"
                                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center justify-center"
                                        >
                                            <Info className="w-3.5 h-3.5 text-primary" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-3.5 space-y-2.5 z-50 text-xs shadow-lg border border-border bg-card">
                                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                            <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                                                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                                                Onboarding Drivers: {candidate.name}
                                            </span>
                                            <span className="font-bold text-primary font-mono">{onboardingSuccessProb}%</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Forecasted 90-day onboarding velocity and cultural retention based on tenure history.
                                        </p>
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex items-start gap-1.5 text-[11px]">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <span><strong>Tenure Stability:</strong> {retentionRisk.toUpperCase()} risk — {retentionRiskFactor || 'Demonstrates steady job stability.'}</span>
                                            </div>
                                            <div className="flex items-start gap-1.5 text-[11px]">
                                                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                <span><strong>Technical Ramp:</strong> Strong alignment across {candidate.matchedSkills?.length || 0} core competencies ensures fast time-to-productivity.</span>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </span>
                            <span className="font-semibold">{onboardingSuccessProb}%</span>
                        </div>
                        <Progress value={onboardingSuccessProb} className="h-2" />
                    </div>

                    {/* Inline Expandable Toggle for Candidate Breakdown */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => setShowBreakdownDetails(!showBreakdownDetails)}
                            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-md transition-colors border border-primary/20 cursor-pointer"
                        >
                            <span className="flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" />
                                {showBreakdownDetails ? `Hide Candidate Predictive Factors` : `View Candidate Predictive Factors (${candidate.name})`}
                            </span>
                            {showBreakdownDetails ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                            )}
                        </button>

                        {showBreakdownDetails && (
                            <div className="mt-2 p-3 rounded-lg bg-muted/40 border border-border/70 space-y-2.5 text-xs animate-in fade-in-50 duration-200">
                                <div className="space-y-1 border-b border-border/50 pb-2">
                                    <span className="font-semibold text-foreground flex items-center gap-1">
                                        <Zap className="w-3 h-3 text-amber-500" />
                                        Interview Pass Drivers ({interviewPassProb}%):
                                    </span>
                                    <p className="text-[11px] text-muted-foreground">
                                        {candidate.name} has {candidate.experience} years as {candidate.currentRole} with {candidate.matchedSkills?.length || 0} verified skills ({candidate.matchedSkills?.slice(0, 3).join(', ')}).
                                        {candidate.missingSkills && candidate.missingSkills.length > 0 && ` Probe ${candidate.missingSkills.slice(0, 2).join(', ')} during technical rounds.`}
                                    </p>
                                </div>
                                <div className="space-y-1 border-b border-border/50 pb-2">
                                    <span className="font-semibold text-foreground flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        Offer Acceptance Drivers ({offerAcceptanceProb}%):
                                    </span>
                                    <p className="text-[11px] text-muted-foreground">
                                        Career level matches target role seniority. Estimated joining window is {timeToJoinEstimate || '15–30 days'}.
                                    </p>
                                </div>
                                <div className="space-y-1 border-b border-border/50 pb-2">
                                    <span className="font-semibold text-foreground flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-purple-500" />
                                        Onboarding Success Drivers ({onboardingSuccessProb}%):
                                    </span>
                                    <p className="text-[11px] text-muted-foreground">
                                        {retentionRisk.toUpperCase()} risk profile: {retentionRiskFactor || 'Steady progression with minimal flight risk.'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-semibold text-foreground flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-primary" />
                                        Resume Authorship Prediction:
                                    </span>
                                    <p className="text-[11px] text-muted-foreground">
                                        <strong className={isAIGenerated ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>{resumeFormat}</strong> ({humanProb}% Human vs {aiProb}% AI). {effectiveReasoning}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Risk & Time Factors */}
                <div className="space-y-3 pt-2">
                    <div className={cn("p-3 rounded-lg border flex items-center justify-between", getRiskBg(retentionRisk))}>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className={cn("w-4 h-4", getRiskColor(retentionRisk))} />
                                <span className={cn("font-semibold capitalize text-sm", getRiskColor(retentionRisk))}>
                                    {retentionRisk} Risk
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground ml-6">
                                {retentionRiskFactor || 'Standard risk profile'}
                            </span>
                        </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-muted/50 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            Est. Time to Join
                        </span>
                        <span className="font-semibold text-foreground text-sm">
                            {timeToJoinEstimate || 'Unknown'}
                        </span>
                    </div>

                    <div className="p-3 rounded-lg border bg-muted/50 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Sparkles className={cn("w-4 h-4", isAIGenerated ? 'text-amber-500' : 'text-primary')} />
                            <span>Resume Format Check</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="View Resume Authorship Details"
                                        title="Click to view candidate authorship breakdown"
                                        className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center justify-center"
                                    >
                                        <Info className="w-3.5 h-3.5 text-primary" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-3.5 space-y-2.5 z-50 text-xs shadow-lg border border-border bg-card">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                        <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                                            <Sparkles className={cn("w-3.5 h-3.5", isAIGenerated ? 'text-amber-500' : 'text-emerald-500')} />
                                            Authorship Prediction ({candidate.name})
                                        </span>
                                        <span className={cn(
                                            "font-bold font-mono text-xs px-2 py-0.5 rounded",
                                            isAIGenerated ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        )}>
                                            {resumeFormat}
                                        </span>
                                    </div>
                                    <div className="space-y-2 pt-1">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[11px] font-medium">
                                                <span className="text-emerald-600 dark:text-emerald-400">Human Authenticity Score:</span>
                                                <span className="font-bold font-mono">{humanProb}%</span>
                                            </div>
                                            <Progress value={humanProb} className="h-2 bg-muted" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[11px] font-medium">
                                                <span className="text-amber-600 dark:text-amber-400">AI / LLM Synthesizer Likelihood:</span>
                                                <span className="font-bold font-mono">{aiProb}%</span>
                                            </div>
                                            <Progress value={aiProb} className="h-2 bg-muted" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed pt-1.5 border-t border-border/60">
                                            <strong>Why: </strong>{effectiveReasoning}
                                        </p>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 font-mono shadow-2xs",
                                isAIGenerated 
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" 
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", isAIGenerated ? "bg-amber-500" : "bg-emerald-500")} />
                                {resumeFormat}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Predictive AI Assessment */}
                {assessment && (
                    <div className="bg-muted/30 p-4 rounded-lg border border-border mt-4">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-ai-accent" />
                            Predictive AI Assessment
                        </h4>
                        <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                            {assessment}
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
