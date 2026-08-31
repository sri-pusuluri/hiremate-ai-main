import { Candidate } from '@/types/hiresort';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, TrendingUp, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PredictiveInsightsPanelProps {
    candidate: Candidate;
}

export function PredictiveInsightsPanel({ candidate }: PredictiveInsightsPanelProps) {
    if (!candidate.predictiveInsights) return null;

    const {
        interviewPassProb = 0,
        offerAcceptanceProb = 0,
        retentionRisk = 'medium',
        retentionRiskFactor,
        timeToJoinEstimate,
        onboardingSuccessProb = 0,
        assessment,
        aiGeneratedProbability = 0,
        aiGeneratedReasoning = 'Insufficient data to determine.'
    } = candidate.predictiveInsights as any;

    const resumeFormat = aiGeneratedProbability > 65 ? 'AI Generated' : 'Human Written';

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
                                Interview Pass Probability
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="w-3.5 h-3.5 text-muted-foreground/70" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs text-xs">Based on skills match, experience alignment, and historical interview outcomes for similar profiles.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </span>
                            <span className="font-semibold">{interviewPassProb}%</span>
                        </div>
                        <Progress value={interviewPassProb} className="h-2" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                                Offer Acceptance Probability
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="w-3.5 h-3.5 text-muted-foreground/70" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs text-xs">Derived from salary alignment, location preferences, and market competitiveness.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </span>
                            <span className="font-semibold">{offerAcceptanceProb}%</span>
                        </div>
                        <Progress value={offerAcceptanceProb} className="h-2" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                                Onboarding Success Probability
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="w-3.5 h-3.5 text-muted-foreground/70" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs text-xs">Calculated from cultural fit indicators, past tenure stability, and role clarity alignment.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </span>
                            <span className="font-semibold">{onboardingSuccessProb}%</span>
                        </div>
                        <Progress value={onboardingSuccessProb} className="h-2" />
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
                            <Sparkles className={cn("w-4 h-4", resumeFormat === 'AI Generated' ? 'text-ai-accent' : 'text-primary')} />
                            Resume Format Check
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3.5 h-3.5 text-muted-foreground/70" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs text-xs font-semibold mb-1">{aiGeneratedProbability}% AI Probability</p>
                                        <p className="max-w-xs text-xs">{aiGeneratedReasoning}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </span>
                        <span className={cn("font-semibold text-sm", resumeFormat === 'AI Generated' ? 'text-ai-accent' : 'text-foreground')}>
                            {resumeFormat}
                        </span>
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
