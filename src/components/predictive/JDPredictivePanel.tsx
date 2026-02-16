
import { Job } from '@/types/hiresort';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface JDPredictivePanelProps {
    job: Job;
}

export function JDPredictivePanel({ job }: JDPredictivePanelProps) {
    if (!job.predictiveEffectiveness) return null;

    const { score, strengths, weaknesses, suggestions } = job.predictiveEffectiveness;

    return (
        <Card className="w-full h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-ai-accent" />
                    JD Effectiveness
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Score */}
                <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-muted">
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">
                            {score}
                        </div>
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-ai-accent"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray={`${score}, 100`}
                            />
                        </svg>
                    </div>
                    <div>
                        <p className="font-medium">Effectiveness Score</p>
                        <p className="text-sm text-muted-foreground">Based on market data & inclusivity</p>
                    </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-success" /> Strengths
                        </h4>
                        <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                            {strengths.map((str, i) => <li key={i}>{str}</li>)}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-destructive" /> Weaknesses
                        </h4>
                        <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                            {weaknesses.map((weak, i) => <li key={i}>{weak}</li>)}
                        </ul>
                    </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-ai-surface p-3 rounded-lg border border-ai-border">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-ai-foreground">
                        <Lightbulb className="w-4 h-4 text-yellow-500" /> Improvement Suggestions
                    </h4>
                    <ul className="text-xs space-y-1 text-ai-muted list-disc pl-4">
                        {suggestions.map((sug, i) => <li key={i}>{sug}</li>)}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
