export type InterviewRoundType = 
  | 'screening' 
  | 'technical' 
  | 'system_design' 
  | 'cultural' 
  | 'managerial' 
  | 'hr';

export type InterviewStatus = 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'rescheduled';

export type HiringRecommendation = 
  | 'strong_hire' 
  | 'hire' 
  | 'lean_hire' 
  | 'no_hire' 
  | 'strong_no_hire';

export interface RubricRatings {
  technicalSkills?: number;
  problemSolving?: number;
  communication?: number;
  cultureFit?: number;
  leadership?: number;
  [key: string]: number | undefined;
}

export interface InterviewScorecard {
  id: string;
  interviewId: string;
  candidateId: string;
  interviewerId: string;
  interviewerName: string;
  interviewerEmail?: string;
  recommendation: HiringRecommendation;
  overallScore: number; // 1.0 - 5.0
  rubricRatings: RubricRatings;
  strengths: string;
  areasForImprovement: string;
  privateNotes?: string;
  submittedAt: string;
  createdAt: string;
}

export interface Interview {
  id: string;
  clientId: string;
  clientName?: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  jobId: string;
  jobTitle: string;
  title: string;
  roundType: InterviewRoundType;
  status: InterviewStatus;
  scheduledAt: string; // ISO date string
  durationMinutes: number; // e.g., 30, 45, 60
  meetingLink?: string;
  interviewerIds: string[];
  interviewerNames: string[];
  notes?: string;
  scorecard?: InterviewScorecard;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
