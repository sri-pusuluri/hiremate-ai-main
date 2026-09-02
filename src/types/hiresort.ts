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
  // ATS Fields
  clientId?: string;
  pipelineStage?: 'applied' | 'ai_screened' | 'interviewing' | 'offered' | 'rejected';
  phone?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  customAnswers?: Record<string, any>;
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

  // ATS & Multi-Tenancy
  clientId?: string;
  isPublic?: boolean;
  slug?: string;
  departmentId?: string;
  positionId?: string;
  customQuestions?: Array<{
    id: string;
    question: string;
    type: 'text' | 'choice' | 'boolean';
    required?: boolean;
    options?: string[];
  }>;
}

export interface ClientTenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  themeColor?: string;
  subscriptionTier?: 'free' | 'pro' | 'enterprise';
  stripeCustomerId?: string | null;
  createdAt?: string;
}

export interface Department {
  id: string;
  clientId: string;
  name: string;
  createdAt?: string;
}

export interface Position {
  id: string;
  clientId: string;
  title: string;
  createdAt?: string;
}

export interface QuestionBankItem {
  id: string;
  clientId: string;
  questionText: string;
  questionType: 'text' | 'choice' | 'boolean';
  options?: string[];
  createdAt?: string;
}

export interface CandidateNote {
  id: string;
  candidateId: string;
  authorId: string;
  authorName?: string;
  noteText: string;
  createdAt: string;
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

