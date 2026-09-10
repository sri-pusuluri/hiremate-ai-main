import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  Video, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Briefcase,
  Link2
} from 'lucide-react';
import { Candidate, Job } from '@/types/hiresort';
import { Interview, InterviewRoundType } from '@/types/interviews';
import { createInterview } from '@/lib/interview-storage';
import { logAuditEvent } from '@/lib/audit-logger';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ScheduleInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate?: Candidate | null;
  job?: Job | null;
  onScheduled?: (interview: Interview) => void;
}

export function ScheduleInterviewModal({
  open,
  onOpenChange,
  candidate,
  job,
  onScheduled
}: ScheduleInterviewModalProps) {
  const { user, client, role } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [roundType, setRoundType] = useState<InterviewRoundType>('technical');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingLink, setMeetingLink] = useState('');
  const [interviewerNames, setInterviewerNames] = useState('Srini Admin, Naushad Recruiter');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Set default title based on roundType & candidate
  useEffect(() => {
    if (candidate) {
      const roundLabel = roundType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      setTitle(`${roundLabel} Evaluation - ${candidate.name}`);
    } else {
      setTitle('Technical Assessment');
    }
    // Default scheduled date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split('T')[0]);
  }, [candidate, roundType, open]);

  const handleGenerateMeetingLink = (type: 'meet' | 'zoom') => {
    const code = Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
    if (type === 'meet') {
      setMeetingLink(`https://meet.google.com/${code}`);
    } else {
      setMeetingLink(`https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    }
  };

  const handleSchedule = async () => {
    if (!title.trim() || !scheduledDate) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please provide an interview title and date.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime || '10:00'}:00Z`).toISOString();
      const parsedInterviewers = interviewerNames
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const created = await createInterview({
        clientId: client?.id || 'hiresort-platform-hq',
        clientName: client?.name || 'Workspace',
        candidateId: candidate?.id || 'cand-generic',
        candidateName: candidate?.name || 'Candidate',
        candidateEmail: candidate?.email,
        jobId: job?.id || candidate?.jobId || 'job-generic',
        jobTitle: job?.title || 'Engineering Role',
        title,
        roundType,
        status: 'scheduled',
        scheduledAt: scheduledDateTime,
        durationMinutes,
        meetingLink: meetingLink.trim() || undefined,
        interviewerIds: [user?.id || 'usr-1'],
        interviewerNames: parsedInterviewers.length > 0 ? parsedInterviewers : ['Hiring Team'],
        notes: notes.trim() || undefined,
        createdBy: user?.id
      });

      // Audit log scheduling
      logAuditEvent({
        clientId: client?.id || 'hiresort-platform-hq',
        clientName: client?.name || 'Workspace',
        userId: user?.id,
        userEmail: user?.email || 'admin@hiresort.ai',
        userRole: role || 'recruiter',
        action: 'SCHEDULE_INTERVIEW',
        resourceType: 'candidate',
        resourceId: candidate?.id,
        details: {
          interview_id: created.id,
          title: created.title,
          round_type: created.roundType,
          scheduled_at: created.scheduledAt,
          candidate_name: candidate?.name
        }
      }).catch(() => {});

      toast({
        title: 'Interview Scheduled! 🎙️',
        description: `Scheduled "${title}" with ${candidate?.name || 'candidate'}.`
      });

      onScheduled?.(created);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error scheduling interview:', err);
      toast({
        title: 'Scheduling Failed',
        description: err.message || 'Could not schedule interview.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Schedule Candidate Interview</DialogTitle>
              <DialogDescription className="text-xs">
                Configure round parameters, calendar schedule, video links, and assign panel interviewers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Candidate / Job Summary Pill */}
          {candidate && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/60 border border-border/70 text-xs">
              <div>
                <span className="font-semibold text-foreground">{candidate.name}</span>
                <span className="text-muted-foreground ml-2">({candidate.currentRole || 'Applicant'})</span>
              </div>
              <span className="text-muted-foreground flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                {job?.title || 'Open Position'}
              </span>
            </div>
          )}

          {/* Round Title & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Interview Title</Label>
              <Input 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Technical Round 1 - React & System Design"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Round Type</Label>
              <Select value={roundType} onValueChange={(val: InterviewRoundType) => setRoundType(val)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Select round type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screening">📞 Initial Screening</SelectItem>
                  <SelectItem value="technical">💻 Technical Evaluation</SelectItem>
                  <SelectItem value="system_design">🏛️ System Design & Architecture</SelectItem>
                  <SelectItem value="cultural">🤝 Culture & Values Alignment</SelectItem>
                  <SelectItem value="managerial">👔 Managerial / Leadership</SelectItem>
                  <SelectItem value="hr">📋 HR & Final Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Date
              </Label>
              <Input 
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" /> Time (24h)
              </Label>
              <Input 
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Duration</Label>
              <Select value={String(durationMinutes)} onValueChange={v => setDurationMinutes(parseInt(v, 10))}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="45">45 Minutes</SelectItem>
                  <SelectItem value="60">60 Minutes (1 Hour)</SelectItem>
                  <SelectItem value="90">90 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meeting Link with Auto-generators */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-primary" /> Video Meeting Link
              </Label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleGenerateMeetingLink('meet')}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  + Google Meet
                </button>
                <span className="text-muted-foreground text-xs">•</span>
                <button
                  type="button"
                  onClick={() => handleGenerateMeetingLink('zoom')}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  + Zoom
                </button>
              </div>
            </div>
            <Input 
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="text-xs h-9 font-mono"
            />
          </div>

          {/* Assigned Interviewers */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-primary" /> Assigned Interviewers (comma separated)
            </Label>
            <Input 
              value={interviewerNames}
              onChange={e => setInterviewerNames(e.target.value)}
              placeholder="Srini Admin, Naushad Recruiter"
              className="text-xs h-9"
            />
          </div>

          {/* Special Notes / Agendas */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Focus Areas & Prep Notes</Label>
            <Textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Evaluate algorithmic complexity, past leadership projects, and culture alignment."
              className="text-xs min-h-[65px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSchedule} 
            disabled={submitting} 
            className="gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? 'Scheduling...' : 'Schedule Interview'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
