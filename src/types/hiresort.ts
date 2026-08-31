export interface Candidate {
  id: string;
  name: string;
  email: string;
  currentRole: string;
  company: string;
  experience: number;
  location: string;
  appliedDate: string;
  jobId?: string; // Reference to the job they applied for
  resumeUrl?: string;
  lastUpdated?: string; // For talent pool freshness filtering
  source?: 'applied' | 'talent-pool'; // Whether candidate applied or from talent pool
  avatarUrl?: string;

  // AI ranking data
  aiRank?: number;
  aiScore?: 'high' | 'medium' | 'low';
  cosineSimilarity?: number; // Cosine similarity between JD and resume embeddings (0-1)
  matchedSkills?: string[];
  missingSkills?: string[];
  experienceAlignment?: string;
  aiExplanation?: string;

  // Recruiter overrides
  isOverridden?: boolean;
  isPinned?: boolean;
  isBoosted?: boolean;
  isDemoted?: boolean;
  manualTags?: string[];
  recruiterNotes?: string;

  // Feedback
  recruiterFeedback?: 'good' | 'poor' | null;

  // Predictive AI Layer
  predictiveInsights?: {
    llmGuessedSimilarity?: number;
    interviewPassProb: number; // 0-100
    offerAcceptanceProb: number; // 0-100
    onboardingSuccessProb: number; // 0-100
    retentionRisk: 'low' | 'medium' | 'high';
    retentionRiskFactor?: string;
    timeToJoinEstimate?: string;
    assessment?: string; // Detailed predictive assessment
    resumeFormat?: 'AI Generated' | 'Human Written' | 'Mixed';
  };
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  postedDate: string;
  screeningEndDate?: string;
  status: 'active' | 'paused' | 'closed';
  candidateCount: number;

  // Job Description
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  salary?: string;

  // HireSort AI
  hireSortEnabled?: boolean;
  aiProcessingStatus?: 'idle' | 'processing' | 'complete' | 'error';
  aiProcessingProgress?: number;
  lastRankedAt?: string;

  // Predictive AI Layer
  predictiveEffectiveness?: {
    score: number; // 0-100
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
}

export interface AIProcessingState {
  status: 'idle' | 'processing' | 'complete' | 'error';
  progress: number;
  estimatedTime?: string;
  candidatesProcessed?: number;
  totalCandidates?: number;
  errorMessage?: string;
}

export interface ShortlistItem {
  candidateId: string;
  addedBy: 'ai' | 'recruiter';
  addedAt: string;
  notes?: string;
}

export type FlowScreen =
  | 'job-dashboard'
  | 'onboarding-modal'
  | 'processing'
  | 'ranked-list'
  | 'candidate-detail'
  | 'shortlist-review'
  | 'feedback'
  | 'edge-states';
