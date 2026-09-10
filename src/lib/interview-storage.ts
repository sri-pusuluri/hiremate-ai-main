import { supabase } from '@/integrations/supabase/client';
import { Interview, InterviewScorecard, InterviewRoundType, InterviewStatus } from '@/types/interviews';

const LOCAL_STORAGE_INTERVIEWS_KEY = 'hiresort_interviews_data';
const LOCAL_STORAGE_SCORECARDS_KEY = 'hiresort_scorecards_data';

// Enterprise seed demo data for instant out-of-the-box experience
export const SEED_DEMO_INTERVIEWS: Interview[] = [
  {
    id: 'int-demo-101',
    clientId: '00000000-0000-0000-0000-000000000001',
    clientName: 'Zool',
    candidateId: 'cand-1',
    candidateName: 'Priya Sharma',
    candidateEmail: 'priya.sharma@example.com',
    jobId: 'job-1',
    jobTitle: 'Senior Frontend Engineer',
    title: 'Round 1: React & Architecture Deep Dive',
    roundType: 'technical',
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    durationMinutes: 45,
    meetingLink: 'https://meet.google.com/hsa-tech-eval',
    interviewerIds: ['usr-1'],
    interviewerNames: ['Naushad Recruiter', 'Srini Admin'],
    notes: 'Focus on state machines, performance optimizations, and React 18 concurrent features.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'int-demo-102',
    clientId: '00000000-0000-0000-0000-000000000001',
    clientName: 'Zool',
    candidateId: 'cand-2',
    candidateName: 'Alex Mercer',
    candidateEmail: 'alex.mercer@example.com',
    jobId: 'job-1',
    jobTitle: 'Senior Frontend Engineer',
    title: 'Round 2: System Design & Live Coding',
    roundType: 'system_design',
    status: 'completed',
    scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/zool-sys-design',
    interviewerIds: ['usr-2'],
    interviewerNames: ['Srini Admin'],
    notes: 'Excellent grasp of caching and decoupled component hierarchies.',
    scorecard: {
      id: 'sc-demo-1',
      interviewId: 'int-demo-102',
      candidateId: 'cand-2',
      interviewerId: 'usr-2',
      interviewerName: 'Srini Admin',
      interviewerEmail: 'srini@zool.in',
      recommendation: 'strong_hire',
      overallScore: 4.8,
      rubricRatings: {
        technicalSkills: 5,
        problemSolving: 5,
        communication: 4,
        cultureFit: 5
      },
      strengths: 'Outstanding architectural intuition; articulated clean boundaries for component microfrontends.',
      areasForImprovement: 'Could improve familiarity with Tailwind typography plugins.',
      privateNotes: 'Top 1% candidate for the lead role.',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'int-demo-103',
    clientId: '00000000-0000-0000-0000-000000000002',
    clientName: 'Commit',
    candidateId: 'cand-3',
    candidateName: 'David Chen',
    candidateEmail: 'david.chen@example.com',
    jobId: 'job-2',
    jobTitle: 'Product Manager - AI Platform',
    title: 'Initial HR & Leadership Screen',
    roundType: 'screening',
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // in 2 days
    durationMinutes: 30,
    meetingLink: 'https://zoom.us/j/984271891',
    interviewerIds: ['usr-3'],
    interviewerNames: ['HR Director Commit'],
    notes: 'Verify B2B AI roadmap delivery experience and enterprise customer discovery.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function fetchInterviews(clientId?: string): Promise<Interview[]> {
  // 1. Try Supabase
  try {
    let query = supabase.from('interviews').select('*, interview_scorecards(*)').order('scheduled_at', { ascending: true });
    if (clientId && clientId !== 'hiresort-platform-hq') {
      query = query.eq('client_id', clientId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((d: any) => {
        const sc = Array.isArray(d.interview_scorecards) ? d.interview_scorecards[0] : d.interview_scorecards;
        return {
          id: d.id,
          clientId: d.client_id,
          candidateId: d.candidate_id,
          candidateName: d.candidate_name || 'Candidate',
          candidateEmail: d.candidate_email,
          jobId: d.job_id,
          jobTitle: d.job_title || 'Position',
          title: d.title,
          roundType: d.round_type as InterviewRoundType,
          status: d.status as InterviewStatus,
          scheduledAt: d.scheduled_at,
          durationMinutes: d.duration_minutes || 45,
          meetingLink: d.meeting_link,
          interviewerIds: d.interviewer_ids || [],
          interviewerNames: d.interviewer_names || ['Hiring Team'],
          notes: d.notes,
          scorecard: sc ? {
            id: sc.id,
            interviewId: sc.interview_id,
            candidateId: sc.candidate_id,
            interviewerId: sc.interviewer_id,
            interviewerName: sc.interviewer_name,
            interviewerEmail: sc.interviewer_email,
            recommendation: sc.recommendation,
            overallScore: parseFloat(sc.overall_score),
            rubricRatings: sc.rubric_ratings || {},
            strengths: sc.strengths || '',
            areasForImprovement: sc.areas_for_improvement || '',
            privateNotes: sc.private_notes,
            submittedAt: sc.submitted_at,
            createdAt: sc.created_at
          } : undefined,
          createdBy: d.created_by,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        };
      });
    }
  } catch (e) {
    console.warn('Could not query Supabase interviews, using cached store:', e);
  }

  // 2. Fallback to localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INTERVIEWS_KEY);
    if (raw) {
      const parsed: Interview[] = JSON.parse(raw);
      if (clientId && clientId !== 'hiresort-platform-hq') {
        return parsed.filter(i => i.clientId === clientId);
      }
      return parsed;
    }
  } catch (e) {}

  // 3. Fallback to SEED_DEMO_INTERVIEWS
  localStorage.setItem(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify(SEED_DEMO_INTERVIEWS));
  if (clientId && clientId !== 'hiresort-platform-hq') {
    return SEED_DEMO_INTERVIEWS.filter(i => i.clientId === clientId);
  }
  return SEED_DEMO_INTERVIEWS;
}

export async function createInterview(interviewData: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>): Promise<Interview> {
  const newInterview: Interview = {
    ...interviewData,
    id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Update localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INTERVIEWS_KEY);
    const list: Interview[] = raw ? JSON.parse(raw) : [...SEED_DEMO_INTERVIEWS];
    list.unshift(newInterview);
    localStorage.setItem(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify(list));
  } catch (e) {}

  // 2. Update Supabase
  try {
    await supabase.from('interviews').insert([{
      id: newInterview.id,
      client_id: newInterview.clientId,
      candidate_id: newInterview.candidateId,
      job_id: newInterview.jobId,
      title: newInterview.title,
      round_type: newInterview.roundType,
      status: newInterview.status,
      scheduled_at: newInterview.scheduledAt,
      duration_minutes: newInterview.durationMinutes,
      meeting_link: newInterview.meetingLink,
      interviewer_ids: newInterview.interviewerIds,
      notes: newInterview.notes,
      created_by: newInterview.createdBy
    } as any]);

    // Also update candidate stage to 'interviewing'
    await supabase.from('candidates').update({
      pipeline_stage: 'interviewing',
      status: 'interviewing'
    } as any).eq('id', newInterview.candidateId);
  } catch (e) {
    console.warn('Non-blocking Supabase insert interview fallback:', e);
  }

  return newInterview;
}

export async function submitInterviewScorecard(scorecard: Omit<InterviewScorecard, 'id' | 'submittedAt' | 'createdAt'>): Promise<InterviewScorecard> {
  const newScorecard: InterviewScorecard = {
    ...scorecard,
    id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  // 1. Update localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INTERVIEWS_KEY);
    const list: Interview[] = raw ? JSON.parse(raw) : [...SEED_DEMO_INTERVIEWS];
    const updated = list.map(i => {
      if (i.id === scorecard.interviewId) {
        return {
          ...i,
          status: 'completed' as InterviewStatus,
          scorecard: newScorecard,
          updatedAt: new Date().toISOString()
        };
      }
      return i;
    });
    localStorage.setItem(LOCAL_STORAGE_INTERVIEWS_KEY, JSON.stringify(updated));
  } catch (e) {}

  // 2. Insert into Supabase
  try {
    await supabase.from('interview_scorecards').insert([{
      id: newScorecard.id,
      interview_id: newScorecard.interviewId,
      candidate_id: newScorecard.candidateId,
      interviewer_id: newScorecard.interviewerId,
      interviewer_name: newScorecard.interviewerName,
      interviewer_email: newScorecard.interviewerEmail,
      recommendation: newScorecard.recommendation,
      overall_score: newScorecard.overallScore,
      rubric_ratings: newScorecard.rubricRatings,
      strengths: newScorecard.strengths,
      areas_for_improvement: newScorecard.areasForImprovement,
      private_notes: newScorecard.privateNotes
    } as any]);

    // Update interview status to completed
    await supabase.from('interviews').update({
      status: 'completed',
      updated_at: new Date().toISOString()
    } as any).eq('id', newScorecard.interviewId);
  } catch (e) {
    console.warn('Non-blocking Supabase scorecard insert:', e);
  }

  return newScorecard;
}
