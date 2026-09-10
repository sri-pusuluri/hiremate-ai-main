import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Video, 
  Users, 
  Star, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  ExternalLink,
  Award,
  Sparkles,
  CalendarDays,
  Building2,
  Briefcase
} from 'lucide-react';
import { Interview, InterviewRoundType, InterviewStatus, InterviewScorecard } from '@/types/interviews';
import { fetchInterviews } from '@/lib/interview-storage';
import { ScheduleInterviewModal } from '@/components/interviews/ScheduleInterviewModal';
import { InterviewScorecardModal } from '@/components/interviews/InterviewScorecardModal';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Interviews() {
  const { client, clientId } = useAuth();
  const { toast } = useToast();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roundFilter, setRoundFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeInterviewForScorecard, setActiveInterviewForScorecard] = useState<Interview | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await fetchInterviews(clientId);
      setInterviews(data);
    } catch (e) {
      console.warn('Error loading interviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [clientId]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((i) => {
      const matchesSearch = 
        i.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRound = roundFilter === 'all' || i.roundType === roundFilter;
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;

      return matchesSearch && matchesRound && matchesStatus;
    });
  }, [interviews, searchQuery, roundFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = interviews.length;
    const scheduled = interviews.filter(i => i.status === 'scheduled').length;
    const completed = interviews.filter(i => i.status === 'completed').length;
    const strongHires = interviews.filter(i => i.scorecard?.recommendation === 'strong_hire' || i.scorecard?.recommendation === 'hire').length;
    return { total, scheduled, completed, strongHires };
  }, [interviews]);

  const handleScorecardSubmitted = (newScorecard: InterviewScorecard) => {
    setInterviews(prev => prev.map(i => i.id === newScorecard.interviewId ? { ...i, status: 'completed', scorecard: newScorecard } : i));
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Interviews & Evaluations
            </h1>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-xs">
              Live Pipeline
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Coordinate candidate interview rounds, synchronize video meetings, and manage 5-star rubric scorecards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm"
            onClick={() => setShowScheduleModal(true)}
            className="gap-1.5 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Rounds</span>
            <CalendarDays className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.total}</div>
          <span className="text-[11px] text-muted-foreground">All interview records</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Upcoming / Scheduled</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.scheduled}</div>
          <span className="text-[11px] text-muted-foreground">Awaiting execution</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Completed Rounds</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
          <span className="text-[11px] text-muted-foreground">Evaluated with feedback</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Positive Hire Recs</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.strongHires}</div>
          <span className="text-[11px] text-muted-foreground">Strong Hire or Hire verdicts</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, interview title, or role..."
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Round Type Filter */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs">
            {['all', 'technical', 'system_design', 'screening', 'cultural'].map(type => (
              <button
                key={type}
                onClick={() => setRoundFilter(type)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium capitalize cursor-pointer transition-all",
                  roundFilter === type ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs">
            {['all', 'scheduled', 'completed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium capitalize cursor-pointer transition-all",
                  statusFilter === st ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interviews List Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading interview schedule...</div>
      ) : filteredInterviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-muted/20 space-y-3">
          <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No matching interviews found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search or filters, or schedule a new round for your active candidates.
          </p>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowScheduleModal(true)}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule New Round
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInterviews.map((item) => (
            <div 
              key={item.id}
              className={cn(
                "p-5 rounded-2xl border transition-all space-y-4 relative flex flex-col justify-between",
                item.status === 'completed'
                  ? "bg-card border-border hover:shadow-md"
                  : "bg-gradient-to-br from-card via-card to-purple-500/[0.04] border-purple-500/25 shadow-xs hover:shadow-md"
              )}
            >
              {/* Card Top */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground hover:underline cursor-pointer">
                        {item.candidateName}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize bg-muted/50">
                        {item.roundType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Briefcase className="w-3.5 h-3.5 text-primary" />
                      <span>{item.jobTitle}</span>
                    </div>
                  </div>

                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs font-semibold capitalize shrink-0",
                      item.status === 'completed' 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                        : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                    )}
                  >
                    {item.status === 'completed' ? '✓ Completed' : '⏱ Scheduled'}
                  </Badge>
                </div>

                <h4 className="text-xs font-bold text-foreground/90 pt-1">
                  {item.title}
                </h4>

                {/* Scheduled details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{new Date(item.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.durationMinutes}m)</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">Panel: {item.interviewerNames.join(', ')}</span>
                </div>
              </div>

              {/* Card Middle: Meeting Link / Scorecard Snippet */}
              <div className="space-y-2 pt-2 border-t border-border/70">
                {item.meetingLink && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60 text-xs">
                    <span className="font-mono text-muted-foreground truncate max-w-[200px]">{item.meetingLink}</span>
                    <a 
                      href={item.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 shrink-0"
                    >
                      Join <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {item.scorecard && (
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {item.scorecard.overallScore} / 5.0
                      </div>
                      <Badge className={cn(
                        "text-[10px] font-bold capitalize",
                        item.scorecard.recommendation.includes('hire') ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                      )}>
                        {item.scorecard.recommendation.replace('_', ' ')}
                      </Badge>
                    </div>
                    {item.scorecard.strengths && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        <strong className="text-foreground">Strengths:</strong> {item.scorecard.strengths}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                {item.status !== 'completed' ? (
                  <Button 
                    size="sm"
                    onClick={() => setActiveInterviewForScorecard(item)}
                    className="w-full text-xs gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-xs cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    Submit Scorecard & Evaluation
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setActiveInterviewForScorecard(item)}
                    className="w-full text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    View / Edit Submitted Scorecard
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ScheduleInterviewModal 
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        onScheduled={newInt => setInterviews(prev => [newInt, ...prev])}
      />

      <InterviewScorecardModal 
        open={Boolean(activeInterviewForScorecard)}
        onOpenChange={open => !open && setActiveInterviewForScorecard(null)}
        interview={activeInterviewForScorecard}
        onScorecardSubmitted={handleScorecardSubmitted}
      />
    </div>
  );
}
