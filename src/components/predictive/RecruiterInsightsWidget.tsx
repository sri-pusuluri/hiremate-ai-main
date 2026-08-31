
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp } from 'lucide-react';

interface RecruiterInsightsWidgetProps {
  names?: string[];
}

export function RecruiterInsightsWidget({ names }: RecruiterInsightsWidgetProps) {
    const displayNames = names && names.length >= 3 ? names : ['Sarah Chen', 'Mike Johnson', 'Priya Sharma'];
    const teamPerformance = [
        { name: displayNames[0], conversion: 78, trend: '+5%' },
        { name: displayNames[1], conversion: 62, trend: '-2%' },
        { name: displayNames[2], conversion: 85, trend: '+8%' },
    ];

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Recruiter Insights
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-semibold text-muted-foreground pb-2 border-b">
                        <span>Recruiter</span>
                        <span>Est. Conversion</span>
                    </div>
                    {teamPerformance.map((member, i) => (
                        <div key={i} className="flex justify-between items-center">
                            <span className="text-sm font-medium">{member.name}</span>
                            <div className="text-right">
                                <span className="text-sm font-bold block">{member.conversion}%</span>
                                <span className={`text-xs ${member.trend.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                                    {member.trend}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div className="pt-2">
                        <div className="bg-muted p-2 rounded text-xs text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            <p>Team is tracking 4% above last quarter's hiring velocity.</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
