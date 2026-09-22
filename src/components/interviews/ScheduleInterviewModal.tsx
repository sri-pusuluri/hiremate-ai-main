import { useState, useEffect, useMemo } from 'react';
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
  Link2,
  UserCheck
} from 'lucide-react';
import { Candidate, Job } from '@/types/hiresort';
import { Interview, InterviewRoundType } from '@/types/interviews';
import { createInterview } from '@/lib/interview-storage';
import { downloadInterviewIcs, getGoogleCalendarUrl } from '@/lib/calendar-export';
import { logAuditEvent } from '@/lib/audit-logger';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mockJobs, mockCandidates } from '@/data/mockData';

interface AvailableJob {
  id: string;
  title: string;
  department?: string;
}

interface AvailableCandidate {
  id: string;
  name: string;
  email?: string;
  jobId: string;
  currentRole?: string;
  experience?: string;
  matchScore?: number;
}

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface ScheduleInterviewModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  candidate?: Candidate | null;
  job?: Job | null;
  onScheduled?: (interview: Interview) => void;
}

export function ScheduleInterviewModal({
  open: openProp,
  isOpen: isOpenProp,
  onOpenChange,
  onClose,
  candidate,
  job,
  onScheduled
}: ScheduleInterviewModalProps) {
  const open = openProp ?? isOpenProp ?? false;
  const handleOpenChange = (val: boolean) => {
    onOpenChange?.(val);
    if (!val) {
      onClose?.();
    }
  };
  const { user, client, clientId, role } = useAuth();
  const { toast } = useToast();

  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [availableCandidates, setAvailableCandidates] = useState<AvailableCandidate[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [title, setTitle] = useState('');
  const [roundType, setRoundType] = useState<InterviewRoundType>('technical');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingLink, setMeetingLink] = useState('');
  const [interviewerNames, setInterviewerNames] = useState('');
  const [availableInterviewers, setAvailableInterviewers] = useState<TeamMember[]>([]);
  const [selectedInterviewers, setSelectedInterviewers] = useState<TeamMember[]>([]);
  const [interviewerSearch, setInterviewerSearch] = useState('');
  const [showInterviewerDropdown, setShowInterviewerDropdown] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const [notes, setNotes] = useState('');
  const [downloadCalendarInvite, setDownloadCalendarInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load jobs and candidates when modal opens without preselected candidate
  useEffect(() => {
    if (!open) return;

    if (job?.id) {
      setSelectedJobId(job.id);
    } else {
      setSelectedJobId('');
    }

    if (candidate?.id) {
      setSelectedCandidateId(candidate.id);
    } else {
      setSelectedCandidateId('');
    }

    // Default scheduled date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split('T')[0]);

    if (!candidate) {
      const loadOptions = async () => {
        setLoadingOptions(true);
        try {
          // 1. Load active jobs
          let jobsList: AvailableJob[] = [];
          try {
            let q = supabase.from('jobs').select('id, title, department, client_id, status');
            if (clientId && clientId !== 'hiresort-platform-hq') {
              q = q.eq('client_id', clientId);
            }
            const { data } = await q;
            if (data && data.length > 0) {
              jobsList = data.map((j: any) => ({
                id: j.id,
                title: j.title,
                department: j.department || undefined
              }));
            }
          } catch (e) {}

          if (jobsList.length === 0) {
            jobsList = mockJobs.map(j => ({
              id: j.id,
              title: j.title,
              department: j.department
            }));
          }
          setAvailableJobs(jobsList);

          // 2. Load candidates — scoped to the jobs we just loaded, not all org candidates
          let candList: AvailableCandidate[] = [];
          try {
            const jobIds = jobsList.map(j => j.id);
            let q = supabase
              .from('candidates')
              .select('id, full_name, email, job_id, client_id, current_role, experience, overall_score, match_score')
              .limit(500);

            if (jobIds.length > 0) {
              // Only fetch candidates that belong to one of our active jobs
              q = q.in('job_id', jobIds);
            } else if (clientId && clientId !== 'hiresort-platform-hq') {
              q = q.eq('client_id', clientId);
            }

            const { data } = await q;
            if (data && data.length > 0) {
              candList = data.map((c: any) => ({
                id: c.id,
                name: c.full_name || 'Candidate',
                email: c.email || undefined,
                jobId: c.job_id || '',
                currentRole: c.current_role || undefined,
                experience: c.experience || undefined,
                matchScore: c.overall_score || c.match_score || undefined
              }));
            }
          } catch (e) {}

          if (candList.length === 0) {
            candList = mockCandidates.map(c => ({
              id: c.id,
              name: c.name,
              email: c.email,
              jobId: c.jobId,
              currentRole: c.currentRole,
              experience: c.experience,
              matchScore: c.aiScore?.overall
            }));
          }
          setAvailableCandidates(candList);

          // 3. Load team members from profiles for the interviewer picker
          try {
            let pq = supabase.from('profiles').select('id, full_name, email, role');
            if (clientId && clientId !== 'hiresort-platform-hq') {
              pq = pq.eq('client_id', clientId);
            }
            const { data: profilesData } = await pq;
            if (profilesData && profilesData.length > 0) {
              const members: TeamMember[] = profilesData
                .filter((p: any) => p.full_name)
                .map((p: any) => ({
                  id: p.id,
                  name: p.full_name,
                  email: p.email || undefined,
                  role: p.role || undefined
                }));
              setAvailableInterviewers(members);
              // Auto-select the current logged-in user as default interviewer
              const currentUser = members.find(m => m.id === user?.id);
              if (currentUser) {
                setSelectedInterviewers([currentUser]);
              }
            }
          } catch (e) {}

        } finally {
          setLoadingOptions(false);
        }
      };

      loadOptions();
    }
  }, [open, candidate, job, clientId]);

  // Per-job candidate count map (for displaying counts in the job dropdown)
  const candidatesPerJob = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of availableCandidates) {
      if (c.jobId) map[c.jobId] = (map[c.jobId] || 0) + 1;
    }
    return map;
  }, [availableCandidates]);

  // Total candidates across all loaded jobs (excludes orphaned records with no jobId)
  const totalScopedCandidates = useMemo(() => {
    return availableCandidates.filter(c => c.jobId).length;
  }, [availableCandidates]);

  // Candidates filtered by selected job
  const filteredCandidates = useMemo(() => {
    if (!selectedJobId || selectedJobId === 'all') {
      return availableCandidates;
    }
    return availableCandidates.filter(c => c.jobId === selectedJobId);
  }, [availableCandidates, selectedJobId]);

  // Active candidate object (either prop or selected from dropdown)
  const activeCandidate = useMemo(() => {
    if (candidate) {
      return {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        jobId: candidate.jobId,
        currentRole: candidate.currentRole,
        experience: candidate.experience
      };
    }
    return availableCandidates.find(c => c.id === selectedCandidateId) || null;
  }, [candidate, availableCandidates, selectedCandidateId]);

  // Active job object (either prop or matching the selected job / candidate's job)
  const activeJob = useMemo(() => {
    if (job) return { id: job.id, title: job.title };
    const jId = (selectedJobId && selectedJobId !== 'all') ? selectedJobId : activeCandidate?.jobId;
    return availableJobs.find(j => j.id === jId) || null;
  }, [job, availableJobs, selectedJobId, activeCandidate]);

  // Auto update title when active candidate or round type changes
  useEffect(() => {
    const roundLabel = roundType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (activeCandidate?.name) {
      setTitle(`${roundLabel} Evaluation - ${activeCandidate.name}`);
    } else {
      setTitle(`${roundLabel} Evaluation`);
    }
  }, [activeCandidate?.name, roundType]);

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    // If current selected candidate does not belong to this job, reset candidate
    if (selectedCandidateId && jobId !== 'all') {
      const cand = availableCandidates.find(c => c.id === selectedCandidateId);
      if (cand && cand.jobId && cand.jobId !== jobId) {
        setSelectedCandidateId('');
      }
    }
  };

  const handleCandidateSelect = (candId: string) => {
    setSelectedCandidateId(candId);
    const cand = availableCandidates.find(c => c.id === candId);
    if (cand && cand.jobId && (!selectedJobId || selectedJobId === 'all')) {
      setSelectedJobId(cand.jobId);
    }
  };

  const handleGenerateMeetingLink = (type: 'meet' | 'zoom') => {
    const code = Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
    if (type === 'meet') {
      setMeetingLink(`https://meet.google.com/${code}`);
    } else {
      setMeetingLink(`https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    }
  };

  const handleSchedule = async () => {
    if (!activeCandidate) {
      toast({
        title: 'Candidate Required',
        description: 'Please select a candidate applicant to schedule an interview.',
        variant: 'destructive'
      });
      return;
    }

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
      const parsedInterviewers = selectedInterviewers.length > 0
        ? selectedInterviewers.map(i => i.name)
        : interviewerNames.split(',').map(s => s.trim()).filter(Boolean);

      const created = await createInterview({
        clientId: client?.id || 'hiresort-platform-hq',
        clientName: client?.name || 'Workspace',
        candidateId: activeCandidate.id,
        candidateName: activeCandidate.name,
        candidateEmail: activeCandidate.email,
        jobId: activeJob?.id || activeCandidate.jobId || 'job-generic',
        jobTitle: activeJob?.title || 'Open Position',
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

      // Update candidate status to interviewing
      try {
        await supabase
          .from('candidates')
          .update({
            status: 'interviewing',
            pipeline_stage: 'interviewing',
            updated_at: new Date().toISOString()
          })
          .eq('id', activeCandidate.id);
      } catch (statusErr) {
        console.warn('Could not update candidate status in database:', statusErr);
      }

      // Audit log scheduling
      logAuditEvent({
        clientId: client?.id || 'hiresort-platform-hq',
        clientName: client?.name || 'Workspace',
        userId: user?.id,
        userEmail: user?.email || 'admin@hiresort.ai',
        userRole: role || 'recruiter',
        action: 'SCHEDULE_INTERVIEW',
        resourceType: 'candidate',
        resourceId: activeCandidate.id,
        details: {
          interview_id: created.id,
          title: created.title,
          round_type: created.roundType,
          scheduled_at: created.scheduledAt,
          candidate_name: activeCandidate.name,
          job_title: activeJob?.title || 'Open Position'
        }
      }).catch(() => {});

      if (downloadCalendarInvite) {
        try {
          downloadInterviewIcs(created);
        } catch (calErr) {
          console.warn('Calendar download error:', calErr);
        }
      }

      toast({
        title: 'Interview Scheduled! 🎙️',
        description: `Scheduled "${title}" with ${activeCandidate.name} for ${activeJob?.title || 'position'}.${downloadCalendarInvite ? ' Calendar invite (.ics) downloaded.' : ''}`
      });

      onScheduled?.(created);
      handleOpenChange(false);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Schedule Candidate Interview</DialogTitle>
              <DialogDescription className="text-xs">
                Select job and candidate, configure round parameters, calendar schedule, video links, and assign panel interviewers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Job & Candidate Selection (or preselected pill if candidate passed) */}
          {!candidate ? (
            <div className="p-3.5 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>1. Select Job & Candidate</span>
                </div>
                {loadingOptions && (
                  <span className="text-[10px] text-muted-foreground animate-pulse">Loading directory...</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Job Dropdown */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    <span>Target Job <span className="text-destructive">*</span></span>
                    {availableJobs.length > 0 && (
                      <span className="text-[10px] font-normal text-muted-foreground">{availableJobs.length} roles</span>
                    )}
                  </Label>
                  <Select value={selectedJobId} onValueChange={handleJobSelect}>
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder="Filter by job opening..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">
                        🌐 All Job Openings{totalScopedCandidates > 0 ? ` (${totalScopedCandidates} applicants)` : ''}
                      </SelectItem>
                      {availableJobs.map(j => {
                        const count = candidatesPerJob[j.id] || 0;
                        return (
                          <SelectItem key={j.id} value={j.id}>
                            {j.title}{j.department ? ` (${j.department})` : ''}{count > 0 ? ` — ${count}` : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Candidate Dropdown — searchable */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    <span>Candidate Applicant <span className="text-destructive">*</span></span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {filteredCandidates.length} available
                    </span>
                  </Label>

                  <div className="relative">
                    {/* Trigger button — shows selected candidate or placeholder */}
                    <button
                      type="button"
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 flex items-center justify-between gap-2 hover:border-primary/60 transition-colors"
                      onClick={() => {
                        setShowCandidateDropdown(v => !v);
                        setCandidateSearch('');
                      }}
                    >
                      <span className={selectedCandidateId && filteredCandidates.find(c => c.id === selectedCandidateId) ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        {selectedCandidateId && filteredCandidates.find(c => c.id === selectedCandidateId)
                          ? filteredCandidates.find(c => c.id === selectedCandidateId)!.name
                          : filteredCandidates.length === 0 ? 'No candidates found' : 'Select candidate...'}
                      </span>
                      <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {showCandidateDropdown && (
                      <div
                        className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg flex flex-col"
                        style={{ maxHeight: '260px' }}
                      >
                        {/* Sticky search input inside dropdown */}
                        <div className="p-2 border-b border-border sticky top-0 bg-popover z-10">
                          <input
                            autoFocus
                            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Search by name, email or role..."
                            value={candidateSearch}
                            onChange={e => setCandidateSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Escape' && setShowCandidateDropdown(false)}
                          />
                        </div>

                        {/* Scrollable results */}
                        <div className="overflow-y-auto flex-1">
                          {filteredCandidates
                            .filter(c => {
                              const q = candidateSearch.toLowerCase();
                              return !q ||
                                c.name.toLowerCase().includes(q) ||
                                (c.email || '').toLowerCase().includes(q) ||
                                (c.currentRole || '').toLowerCase().includes(q);
                            })
                            .map(c => (
                              <button
                                key={c.id}
                                type="button"
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center justify-between gap-2 ${
                                  selectedCandidateId === c.id ? 'bg-primary/5 text-primary font-semibold' : ''
                                }`}
                                onMouseDown={() => {
                                  handleCandidateSelect(c.id);
                                  setShowCandidateDropdown(false);
                                  setCandidateSearch('');
                                }}
                              >
                                <span className="font-medium truncate">{c.name}</span>
                                <span className="flex items-center gap-1.5 shrink-0">
                                  {c.matchScore && (
                                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                                      {Math.round(c.matchScore)}%
                                    </span>
                                  )}
                                  {c.currentRole && (
                                    <span className="text-[10px] text-muted-foreground">{c.currentRole}</span>
                                  )}
                                </span>
                              </button>
                            ))}

                          {filteredCandidates.filter(c => {
                            const q = candidateSearch.toLowerCase();
                            return !q ||
                              c.name.toLowerCase().includes(q) ||
                              (c.email || '').toLowerCase().includes(q) ||
                              (c.currentRole || '').toLowerCase().includes(q);
                          }).length === 0 && (
                            <p className="px-3 py-3 text-xs text-muted-foreground text-center">
                              {filteredCandidates.length === 0
                                ? 'No applicants for this job yet'
                                : `No candidates matching "${candidateSearch}"`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Click-outside overlay */}
                    {showCandidateDropdown && (
                      <div
                        className="fixed inset-0 z-40"
                        onMouseDown={() => setShowCandidateDropdown(false)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {activeCandidate && (
                <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-purple-500/15 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Applicant: <strong className="text-foreground">{activeCandidate.name}</strong>
                    {activeCandidate.email ? ` • ${activeCandidate.email}` : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                    Role: <strong className="text-foreground">{activeJob?.title || 'Open Position'}</strong>
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Candidate / Job Summary Pill */
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

          {/* Assigned Interviewers — searchable picker from DB profiles */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-primary" /> Assigned Interviewers
              <span className="font-normal text-muted-foreground">({selectedInterviewers.length} selected)</span>
            </Label>

            {/* Selected chips */}
            {selectedInterviewers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {selectedInterviewers.map(m => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                  >
                    {m.name}
                    {m.email && <span className="text-primary/60 text-[10px]">· {m.email}</span>}
                    <button
                      type="button"
                      onClick={() => setSelectedInterviewers(prev => prev.filter(i => i.id !== m.id))}
                      className="ml-0.5 hover:text-destructive transition-colors"
                      aria-label={`Remove ${m.name}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <Input
                value={interviewerSearch}
                onChange={e => {
                  setInterviewerSearch(e.target.value);
                  setShowInterviewerDropdown(true);
                }}
                onFocus={() => setShowInterviewerDropdown(true)}
                onBlur={() => setTimeout(() => setShowInterviewerDropdown(false), 150)}
                placeholder={availableInterviewers.length > 0 ? "Search team members..." : "No team members found in DB"}
                className="text-xs h-9"
              />
              {showInterviewerDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-44 overflow-y-auto">
                  {availableInterviewers
                    .filter(m =>
                      !selectedInterviewers.find(s => s.id === m.id) &&
                      (m.name.toLowerCase().includes(interviewerSearch.toLowerCase()) ||
                       (m.email || '').toLowerCase().includes(interviewerSearch.toLowerCase()))
                    )
                    .map(m => (
                      <button
                        key={m.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center justify-between gap-2"
                        onMouseDown={() => {
                          setSelectedInterviewers(prev => [...prev, m]);
                          setInterviewerSearch('');
                          setShowInterviewerDropdown(false);
                        }}
                      >
                        <span className="font-medium">{m.name}</span>
                        {m.email && <span className="text-muted-foreground text-[10px]">{m.email}</span>}
                      </button>
                    ))}
                  {availableInterviewers.filter(m =>
                    !selectedInterviewers.find(s => s.id === m.id) &&
                    (m.name.toLowerCase().includes(interviewerSearch.toLowerCase()) ||
                     (m.email || '').toLowerCase().includes(interviewerSearch.toLowerCase()))
                  ).length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      {availableInterviewers.length === 0
                        ? 'No team members in database yet'
                        : 'No matching members found'}
                    </p>
                  )}
                </div>
              )}
            </div>
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

          {/* Calendar Invite Option */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="auto-download-ics"
              checked={downloadCalendarInvite}
              onChange={(e) => setDownloadCalendarInvite(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <label
              htmlFor="auto-download-ics"
              className="text-xs text-muted-foreground cursor-pointer select-none flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Download Calendar Invite (<code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono">.ics</code> file) upon scheduling
            </label>
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
