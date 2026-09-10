import { useState } from 'react';
import { 
  Compass, 
  Workflow as WorkflowIcon, 
  Briefcase, 
  Users, 
  Sparkles, 
  CalendarDays, 
  BarChart3, 
  ShieldCheck, 
  Building2, 
  LifeBuoy, 
  ArrowRight, 
  CheckCircle2, 
  Database, 
  Cpu, 
  Lock, 
  Globe, 
  Layers, 
  Play, 
  RotateCcw, 
  FileText, 
  Star, 
  ExternalLink,
  Bot,
  Sliders,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Clock,
  Video,
  KeyRound,
  Shield,
  Search,
  Code
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface WorkflowProps {
  onNavigate?: (view: string) => void;
  defaultTab?: 'lifecycle' | 'architecture' | 'roles' | 'simulator' | 'dictionary';
}

// 8 Stages of the Complete Hiring Lifecycle
interface LifecycleStage {
  id: number;
  title: string;
  badge: string;
  badgeColor: string;
  icon: any;
  shortDesc: string;
  purpose: string;
  whoExecutes: string;
  inputs: string[];
  algorithms: string[];
  outputs: string[];
  securityRules: string[];
  appRoute: string;
  appRouteLabel: string;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: 1,
    title: 'Job Architecture & Multi-Tenant Publishing',
    badge: 'Stage 1: Requisition',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    icon: Briefcase,
    shortDesc: 'Create structured requisitions with custom screening questions and publish across channels.',
    purpose: 'Define organizational hiring needs, department quotas, required competencies, custom screening questions, and publish to career hubs or third-party websites with anti-bot protection.',
    whoExecutes: 'Client Workspace Admin or Recruiter',
    inputs: [
      'Job Title, Department, Location (Remote/Hybrid/Onsite), Employment Type',
      'Detailed Job Description & Responsibilities',
      'Required Skills & Preferred Skills Taxonomies',
      'Years of Experience Range (Min/Max)',
      'Custom Candidate Screening Questions (Text, Multiple Choice, Yes/No)',
      'Publishing Status (Draft, Published, Closed) & Cloudflare Turnstile bot verification'
    ],
    algorithms: [
      'Slug generator creates SEO-friendly unique URL (`/careers/:clientSlug/:jobSlug`)',
      'Screening question schema validator stores structured JSON for candidate input forms',
      'Tenant Scoping: Automatically tagged with `client_id` for strict multi-tenant isolation'
    ],
    outputs: [
      'Live job requisition in ATS Dashboard',
      'Public Application Portal URL (`/apply/:jobSlug`)',
      'Embeddable Responsive Widget `<iframe/>` snippet for Webflow, WordPress, or React',
      'Cloudflare Turnstile token-protected submission endpoint'
    ],
    securityRules: [
      'Tenant Isolation: Job records are strictly bound to `client_id` via Postgres RLS',
      'Recruiter Permission: Only team members assigned to the tenant workspace can edit',
      'Spam Mitigation: Cloudflare Turnstile token verified before accepting applications'
    ],
    appRoute: 'jobs',
    appRouteLabel: 'Open Jobs & ATS'
  },
  {
    id: 2,
    title: 'Multi-Channel Candidate Application & Ingestion',
    badge: 'Stage 2: Sourcing',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    icon: Globe,
    shortDesc: 'Candidates discover jobs on branded career portals or embedded widgets and submit applications.',
    purpose: 'Provide a frictionless, accessible, and high-conversion candidate application experience across multiple channels while securely storing resumes in isolated storage buckets.',
    whoExecutes: 'External Candidates & Applicants',
    inputs: [
      'Candidate Personal Details: Full Name, Email, Phone Number',
      'Professional Identity: Current Role, Current Company, Years of Experience, LinkedIn/Portfolio URLs',
      'Resume Document: PDF / DOCX file upload (up to 10MB)',
      'Responses to Job-Specific Screening Questions',
      'Cloudflare Turnstile anti-bot verification challenge response'
    ],
    algorithms: [
      'File Type & MIME validation (enforces PDF, DOC, DOCX)',
      'Sanitized file storage upload to Supabase Storage `resumes/` bucket with timestamped UUID',
      'Candidate pipeline stage auto-initialized to `applied` with `pending` review status'
    ],
    outputs: [
      'Row inserted in `candidates` table tagged to `job_id` and `client_id`',
      'Secure public or signed URL generated for resume download',
      'Instant candidate confirmation feedback screen'
    ],
    securityRules: [
      'Zero Unauthorized Overwrites: Public users cannot modify existing candidate rows',
      'Bucket RLS: Resumes accessible only to recruiters belonging to the hiring tenant',
      'Rate Limiting & Anti-Bot: Turnstile token validated to thwart automated script spam'
    ],
    appRoute: 'careers',
    appRouteLabel: 'View Public Careers'
  },
  {
    id: 3,
    title: 'AI Screening Engine & Semantic Matching',
    badge: 'Stage 3: AI Screening',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    icon: Sparkles,
    shortDesc: 'Dual-engine AI evaluates semantic match score, extracts matched/missing skills, and generates predictive insights.',
    purpose: 'Eliminate hours of manual resume review by calculating deterministic semantic match percentages, identifying skill overlaps and gaps, and producing objective candidate summaries.',
    whoExecutes: 'HireSort AI Screening Engine (Autonomous or Triggered by Recruiter)',
    inputs: [
      'Candidate parsed resume text & application answers',
      'Job description requirements, responsibilities, and skill tags',
      'Tenant AI Strategy Configuration (BYOK OpenAI / Anthropic or Platform Default)'
    ],
    algorithms: [
      '1. TF-IDF & Cosine Similarity Vectorization: Converts resume and JD into vector representations and computes high-dimensional cosine angle (0% to 100% similarity)',
      '2. Skills Taxonomy Matching: Extracts keyword occurrences to categorize "Matched Skills" vs "Missing Skills"',
      '3. AI Match Tier Scoring: Categorizes candidates into High Match (75%+), Medium Match (50-74%), or Low Match (<50%)',
      '4. Generative AI Deep Evaluation: Synthesizes technical aptitude, cultural compatibility signals, and retention forecast'
    ],
    outputs: [
      'Cosine Similarity Score percentage (e.g. 88%)',
      'AI Score Tier (`high`, `medium`, `low`)',
      'Matched Skills list (e.g. React, TypeScript, Node.js, PostgreSQL)',
      'Missing Skills list (e.g. Kubernetes, AWS)',
      'Predictive Insights JSON: Executive summary, technical competence, and key strengths'
    ],
    securityRules: [
      'Data Privacy: Candidate PII is not stored by third-party LLMs when using zero-retention API endpoints',
      'BYOK Isolation: Client tenant API keys are encrypted at rest in `clients.ai_api_key`',
      'Audited Execution: AI scoring events and modifications logged in the audit ledger'
    ],
    appRoute: 'candidates',
    appRouteLabel: 'Inspect AI in Candidates'
  },
  {
    id: 4,
    title: 'Recruiter Triage & Candidate Shortlisting',
    badge: 'Stage 4: Evaluation',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    icon: Users,
    shortDesc: 'Recruiters filter by AI match score, inspect resumes side-by-side, and shortlist top candidates.',
    purpose: 'Empower hiring managers and recruiters to rapidly triage high-volume applicant pools, review AI summaries, download resumes, and mark top candidates for hiring committee review.',
    whoExecutes: 'Recruiter or Hiring Manager',
    inputs: [
      'Filter Criteria: Job requisition, AI score tier (High/Med/Low), similarity percentage, date range',
      'Candidate dossier: AI insights breakdown, matched skills chips, screening question answers',
      'Recruiter actions: Star / Shortlist toggle, pipeline stage advancement, rejection'
    ],
    algorithms: [
      'Dynamic multi-dimensional client-side filtering and real-time sorting',
      'Single-click status sync between `status` and `pipeline_stage` columns',
      'Shortlist state updates `is_pinned: true` for persistent spotlighting'
    ],
    outputs: [
      'Shortlisted candidate board populated at `/shortlisted`',
      'Candidate status transitioned to `shortlisted` or `rejected`',
      'Audit log entry emitted: `SHORTLIST_CANDIDATE` or `REMOVE_SHORTLIST_CANDIDATE`'
    ],
    securityRules: [
      'Tenant Scoping: Recruiters can strictly view candidates belonging to their assigned workspace',
      'Audit Trail: Every status change records the actor ID, timestamp, and previous state'
    ],
    appRoute: 'shortlisted',
    appRouteLabel: 'Open Shortlist Board'
  },
  {
    id: 5,
    title: 'Interview Orchestration & 5-Star Rubric Scorecards',
    badge: 'Stage 5: Interviews',
    badgeColor: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/30',
    icon: CalendarDays,
    shortDesc: 'Schedule multi-round interviews, generate video links, assign panels, and submit 5-star rubric scorecards.',
    purpose: 'Coordinate structured candidate interview rounds (Technical, System Design, Cultural, HR), synchronize Google Meet / Zoom meeting links, and standardize evaluations with quantitative rubrics.',
    whoExecutes: 'Hiring Panel, Technical Interviewers, and Recruiters',
    inputs: [
      'Round Type: Technical, System Design, Cultural & Values, Initial Screening, Managerial, HR',
      'Date, 24h Time, and Duration (30m, 45m, 60m, 90m)',
      'Meeting Room Link: Auto-generated Google Meet / Zoom URL or custom link',
      'Interviewer Panel: Selected team members assigned to evaluate the candidate',
      'Evaluation Rubric Ratings: Quantitative 1–5 stars across 4 standard pillars',
      'Qualitative Notes: Key strengths, areas for growth, and private committee recommendations'
    ],
    algorithms: [
      'Rubric Weighted Average: Computes quantitative composite score out of 5.0 stars',
      'Lifecycle Transition: Auto-updates interview status to `completed` upon scorecard submission',
      'Candidate Dossier Integration: Embeds interview round history directly in candidate details'
    ],
    outputs: [
      'Scheduled round entry in `interviews` table with video link',
      'Immutable scorecard record in `interview_scorecards` table',
      'Hiring Recommendation: `Strong Hire`, `Hire`, `Lean Hire`, `No Hire`, or `Strong No Hire`',
      'Audit log entry emitted: `SCHEDULE_INTERVIEW` and `SUBMIT_SCORECARD`'
    ],
    securityRules: [
      'Private Scorecards: Interviewer notes protected by role access',
      'Audit Traceability: Tracks who submitted the evaluation and when'
    ],
    appRoute: 'interviews',
    appRouteLabel: 'Open Interviews Hub'
  },
  {
    id: 6,
    title: 'Pipeline Analytics, Funnel Conversions & Reporting',
    badge: 'Stage 6: Analytics',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    icon: BarChart3,
    shortDesc: 'Track selection ratios, AI score distributions, conversion stages, and export CSV/PDF reports.',
    purpose: 'Provide executive visibility into hiring velocity, source effectiveness, AI match score distributions, stage transitions (Applied &rarr; Screened &rarr; Interview &rarr; Offered), and candidate exports.',
    whoExecutes: 'Hiring Executives, Client Admins, and Super Admins',
    inputs: [
      'Candidate pipeline datasets filtered by job, date range, or AI match tier',
      'Historical stage transitions and conversion metrics',
      'Skill frequency occurrences across top applicant cohorts'
    ],
    algorithms: [
      'AI Score Distribution Histogram: Buckets similarity percentiles into 0-40%, 40-60%, 60-80%, 80-100%',
      'Funnel Ratio Calculations: Computes conversion percentage at each hiring milestone',
      'Skills Frequency Aggregator: Identifies top in-demand skills and critical candidate skill gaps',
      'CSV Generation Engine: Formats candidate records into RFC 4180-compliant CSV export'
    ],
    outputs: [
      'Executive Analytics Dashboard with interactive charts (Pie, Bar, Area)',
      'One-click downloadable CSV file (`hiresort_candidates_report_*.csv`)',
      'Clean print-ready PDF view optimized with CSS `@media print`'
    ],
    securityRules: [
      'Super Admin vs Tenant: Super Admins can aggregate cross-tenant metrics; Client Admins only see company data',
      'Export Tracking: CSV generation logged in audit trail'
    ],
    appRoute: 'reports',
    appRouteLabel: 'Open Reports & Analytics'
  },
  {
    id: 7,
    title: 'Enterprise Governance, Audit Trail & Real-Time Security',
    badge: 'Stage 7: Governance',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
    icon: ShieldCheck,
    shortDesc: 'Comprehensive audit logging of user logins, role updates, tenant reassignments, and CRUD actions.',
    purpose: 'Maintain regulatory compliance (SOC 2, GDPR) and system transparency by capturing an immutable audit trail of every security-sensitive action taken across the platform.',
    whoExecutes: 'System Security Engine & Enterprise Administrators',
    inputs: [
      'Authentication events: Logins, login failures, logouts, password changes, signups',
      'User Management events: Member invitations, role changes, tenant reassignments, deletions',
      'Job & ATS actions: Job creation, publishing, closing, deletion, job reallotment',
      'Candidate actions: Status changes, shortlisting, rubric scorecard submissions'
    ],
    algorithms: [
      'Asynchronous non-blocking audit logger with fallback local caching',
      'Tenant isolation filter: Restricts audit log visibility by `client_id`',
      'JSON payload serialization of contextual details (previous vs new state)'
    ],
    outputs: [
      'Searchable, filterable audit log stream in Workspace Settings',
      'Real-time user presence tracking and activity timeline',
      'Exportable compliance audit history'
    ],
    securityRules: [
      'Append-Only: Audit records cannot be modified or deleted by users',
      'Strict Tenant Scoping: Client Admins cannot inspect audit logs of other client tenants'
    ],
    appRoute: 'tenant-settings',
    appRouteLabel: 'View Audit Logs'
  },
  {
    id: 8,
    title: 'Multi-Tenant Management & 🛟 Help Desk',
    badge: 'Stage 8: Operations',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    icon: LifeBuoy,
    shortDesc: 'Branding customization, team management, knowledge base docs, and 24/7 SLA support desk.',
    purpose: 'Provide enterprise client tenants with white-label branding, API key management, searchable developer documentation, and threaded support tickets with platform engineers.',
    whoExecutes: 'Platform Super Admins, Client Admins, and Support Engineers',
    inputs: [
      'Tenant Configuration: Company name, slug, custom logo URL, brand theme hex color, subscription tier',
      'Support Requests: Ticket category (Bug, Billing, Feature, Integration), urgency, and message thread',
      'Knowledge Base: Search queries across setup guides, widget embed docs, and API specs'
    ],
    algorithms: [
      'Tenant Switcher: Instant global state switch for Super Admins between Platform HQ and any tenant',
      'Support SLA Desk: Categorizes ticket urgency and manages live status transitions (`open`, `in_progress`, `resolved`)',
      'Threaded Chat Desk: Synchronous message exchange between client administrators and platform support'
    ],
    outputs: [
      'White-labeled candidate portal with client branding and colors',
      'Searchable documentation articles in Help Center',
      'Support ticket resolution queue with live status badges'
    ],
    securityRules: [
      'Super Admin Exclusivity: Only Super Admins can access Platform HQ and view cross-tenant ticket queues',
      'Ticket Scoping: Client Admins only see tickets raised by their own team members'
    ],
    appRoute: 'support',
    appRouteLabel: 'Open Help & Support'
  }
];

// Technical Architecture Nodes
interface ArchitectureNode {
  id: string;
  category: string;
  name: string;
  tech: string;
  icon: any;
  color: string;
  description: string;
  details: string[];
}

const ARCHITECTURE_NODES: ArchitectureNode[] = [
  {
    id: 'frontend',
    category: 'Client Presentation Layer',
    name: 'Single Page Web App & Portals',
    tech: 'React 18 + Vite + TailwindCSS + Radix UI',
    icon: Globe,
    color: 'from-blue-600 to-cyan-600',
    description: 'Fast, responsive interface serving both internal recruiter dashboards and external public candidate portals.',
    details: [
      'Routing: React Router v6 with clean nested paths (`/jobs`, `/candidates`, `/interviews`, `/reports`)',
      'Public Careers Portal (`/careers/:slug`): Candidate discovery and direct job applications',
      'Embeddable Responsive Widget (`/embed/job/:id`): Embeds into Webflow, WordPress, Squarespace, and custom sites',
      'State Management: TanStack React Query + Context API (`useAuth`) for responsive caching and real-time updates'
    ]
  },
  {
    id: 'edge_security',
    category: 'Edge & Security Layer',
    name: 'Cloudflare Turnstile & Edge Functions',
    tech: 'Cloudflare Turnstile + Deno Edge Functions',
    icon: Lock,
    color: 'from-amber-600 to-orange-600',
    description: 'Enforces anti-bot challenge validation and executes server-side administrative operations with service role keys.',
    details: [
      'Turnstile Bot Defense: Invisible challenge on public job application forms prevents spam submissions',
      '`invite-user` Edge Function: Validates inviter role, scopes invitation to tenant `client_id`, and triggers Supabase auth emails',
      'CORS & Security Headers: Enforces strict origin matching for API requests and iframe embed widgets',
      'Zero-Trust Auth: JWT tokens verified on every Supabase Edge Function execution'
    ]
  },
  {
    id: 'ai_engine',
    category: 'AI Screening Core',
    name: 'Semantic Cosine Vector Engine',
    tech: 'TF-IDF Vectorizer + Cosine Math + BYOK LLMs',
    icon: Cpu,
    color: 'from-purple-600 to-indigo-600',
    description: 'Dual-phase AI screening combining deterministic high-dimensional vector similarity with LLM generative insights.',
    details: [
      'High-Dimensional Cosine Similarity: Evaluates semantic overlap between candidate resume and job requirements (0-100%)',
      'Skills Taxonomy Extractor: Automatically identifies matched skills vs missing critical competencies',
      'Rubric Scoring Matrix: Classifies applicants into High Match (75%+), Medium Match (50-74%), or Low Match (<50%)',
      'BYOK Integration: Allows tenants to configure their private OpenAI or Anthropic API keys in Workspace Settings'
    ]
  },
  {
    id: 'database',
    category: 'Data & Persistence Layer',
    name: 'PostgreSQL Multi-Tenant Database',
    tech: 'Supabase Postgres + Row Level Security (RLS)',
    icon: Database,
    color: 'from-emerald-600 to-teal-600',
    description: 'Relational data store enforcing strict multi-tenant isolation, automatic foreign key cascades, and real-time streams.',
    details: [
      'Multi-Tenant Schema: Every operational table contains `client_id` foreign key referencing `clients.id`',
      'Row Level Security (RLS): Database policies guarantee that tenant users cannot read or write data of other clients',
      'Supabase Storage: Isolated `resumes/` bucket with signed URL access controls for candidate resumes',
      'Realtime Database Engine: Supabase Realtime enables immediate state synchronization across browser sessions'
    ]
  },
  {
    id: 'governance',
    category: 'Governance & Auditing',
    name: 'Audit Trail & Rubric Evaluation Engine',
    tech: 'Append-Only Audit Ledger + 5-Star Rubrics',
    icon: ShieldCheck,
    color: 'from-rose-600 to-red-600',
    description: 'Tracks every platform action for SOC 2 / GDPR compliance and standardizes interview evaluations.',
    details: [
      'Append-Only Audit Logs: Captures user logins, role modifications, tenant reassignments, job actions, and shortlists',
      '5-Star Rubric Engine: Quantitative ratings across Technical, Problem Solving, Communication, and Culture pillars',
      'Live Presence System: Real-time user heartbeat and active session monitoring',
      'CSV / PDF Report Generator: Formats multi-dimensional candidate data for stakeholder reviews'
    ]
  }
];

// Role Capabilities Matrix
interface RoleOperation {
  operation: string;
  category: string;
  superAdmin: boolean;
  clientAdmin: boolean;
  recruiter: boolean;
  publicApplicant: boolean;
  notes: string;
}

const ROLE_OPERATIONS: RoleOperation[] = [
  { operation: 'Manage Client Tenants & Subscriptions', category: 'Tenancy', superAdmin: true, clientAdmin: false, recruiter: false, publicApplicant: false, notes: 'Global platform configuration' },
  { operation: 'Switch Global Workspace Context', category: 'Tenancy', superAdmin: true, clientAdmin: false, recruiter: false, publicApplicant: false, notes: 'Super Admins can switch into any client' },
  { operation: 'Invite Client Admins & Recruiters', category: 'Team', superAdmin: true, clientAdmin: true, recruiter: false, publicApplicant: false, notes: 'Client Admins can invite into own workspace' },
  { operation: 'Modify Workspace Branding & Theme Colors', category: 'Settings', superAdmin: true, clientAdmin: true, recruiter: false, publicApplicant: false, notes: 'White-label customizations' },
  { operation: 'Configure BYOK AI API Keys', category: 'Settings', superAdmin: true, clientAdmin: true, recruiter: false, publicApplicant: false, notes: 'OpenAI / Anthropic enterprise keys' },
  { operation: 'Configure Cloudflare Turnstile Bot Guard', category: 'Security', superAdmin: true, clientAdmin: true, recruiter: false, publicApplicant: false, notes: 'Anti-spam protection keys' },
  { operation: 'Create, Edit & Publish Job Requisitions', category: 'ATS', superAdmin: true, clientAdmin: true, recruiter: true, publicApplicant: false, notes: 'Full job posting lifecycle' },
  { operation: 'View Public Careers & Submit Application', category: 'Public', superAdmin: true, clientAdmin: true, recruiter: true, publicApplicant: true, notes: 'Accessible to all candidates' },
  { operation: 'Access AI Semantic Match Scores & Insights', category: 'AI', superAdmin: true, clientAdmin: true, recruiter: true, publicApplicant: false, notes: 'Recruiter intelligence tools' },
  { operation: 'Shortlist Candidates & Move Stages', category: 'Pipeline', superAdmin: true, clientAdmin: true, recruiter: true, publicApplicant: false, notes: 'Triage and pipeline management' },
  { operation: 'Schedule Interviews & Generate Video Links', category: 'Interviews', superAdmin: true, clientAdmin: true, recruiter: true, publicApplicant: false, notes: 'Google Meet / Zoom sync' },
  { operation: 'Submit 5-Star Rubric Interview Scorecards', category: 'Interviews', superAdmin: true, clientAdmin: true, recruiter: true, publicApplicant: false, notes: 'Standardized candidate rubric' },
  { operation: 'Export Candidate Data as CSV / Print Reports', category: 'Reports', superAdmin: true, clientAdmin: true, recruiter: true, publicApplicant: false, notes: 'Executive metrics export' },
  { operation: 'Inspect Security Audit Trail Logs', category: 'Governance', superAdmin: true, clientAdmin: true, recruiter: false, publicApplicant: false, notes: 'Compliance tracking' },
  { operation: 'Submit Support Help Desk Tickets', category: 'Support', superAdmin: true, clientAdmin: true, recruiter: true, publicApplicant: false, notes: '24/7 SLA desk access' },
  { operation: 'Manage Global Support Ticket Resolution Queue', category: 'Support', superAdmin: true, clientAdmin: false, recruiter: false, publicApplicant: false, notes: 'Platform HQ engineers only' },
];

export default function Workflow({ onNavigate, defaultTab }: WorkflowProps) {
  const { isSuperAdmin, isAdmin, role, client } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'lifecycle' | 'architecture' | 'roles' | 'simulator' | 'dictionary'>(defaultTab || 'lifecycle');
  const [selectedStageId, setSelectedStageId] = useState<number>(1);
  const [selectedRoleView, setSelectedRoleView] = useState<'super_admin' | 'client_admin' | 'recruiter' | 'public'>('client_admin');

  // Simulator State
  const [simJobTitle, setSimJobTitle] = useState('Senior Full-Stack Engineer');
  const [simCandidateName, setSimCandidateName] = useState('Alexandra Chen');
  const [simCandidateSkills, setSimCandidateSkills] = useState('React, TypeScript, Node.js, PostgreSQL, Docker, GraphQL');
  const [simExperienceYears, setSimExperienceYears] = useState(6);
  const [simRunning, setSimRunning] = useState(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [simCompleted, setSimCompleted] = useState(false);

  const handleNavigateTo = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      navigate(`/${route}`);
    }
  };

  const runSimulation = () => {
    setSimRunning(true);
    setSimStep(1);
    setSimCompleted(false);

    const stepIntervals = [
      { step: 2, delay: 1000 },
      { step: 3, delay: 2200 },
      { step: 4, delay: 3400 },
      { step: 5, delay: 4600 },
      { step: 6, delay: 5800 },
      { step: 7, delay: 7000 },
    ];

    stepIntervals.forEach(({ step, delay }) => {
      setTimeout(() => {
        setSimStep(step);
        if (step === 7) {
          setSimRunning(false);
          setSimCompleted(true);
        }
      }, delay);
    });
  };

  const resetSimulation = () => {
    setSimRunning(false);
    setSimStep(0);
    setSimCompleted(false);
  };

  const currentStage = LIFECYCLE_STAGES.find(s => s.id === selectedStageId) || LIFECYCLE_STAGES[0];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl animate-fade-in">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 border border-blue-500/20 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs font-semibold">
                System Blueprint & Ops
              </Badge>
              <span className="text-xs text-muted-foreground">
                Enterprise Multi-Tenant ATS & GenAI Screening Architecture
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              HireSort AI Operational Workflow & Blueprint
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
              An interactive, end-to-end operational guide explaining every step of candidate ingestion, high-dimensional AI vector scoring, multi-round interview rubric evaluation, and multi-tenant isolation.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleNavigateTo('support')}
              className="text-xs gap-1.5 border-border bg-card shadow-xs"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-blue-500" />
              SLA Help Desk
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setActiveTab('simulator');
                runSimulation();
              }}
              className="text-xs gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              Run Pipeline Simulator
            </Button>
          </div>
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Hiring Journey</span>
            <span className="font-bold text-foreground text-sm">8 Structured Stages</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">AI Engine</span>
            <span className="font-bold text-foreground text-sm">Cosine Vectors + BYOK LLMs</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Tenancy Isolation</span>
            <span className="font-bold text-foreground text-sm">Postgres RLS Multi-Tenant</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Audit Coverage</span>
            <span className="font-bold text-foreground text-sm">100% Append-Only Security</span>
          </div>
        </div>
      </div>

      {/* Navigation Mode Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <TabsList className="bg-muted p-1 grid grid-cols-2 sm:grid-cols-5 w-full h-auto">
          <TabsTrigger value="lifecycle" className="text-xs font-semibold py-2 gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>1. Hiring Lifecycle</span>
          </TabsTrigger>
          <TabsTrigger value="architecture" className="text-xs font-semibold py-2 gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>2. Architecture & Data</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="text-xs font-semibold py-2 gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Role Matrix</span>
          </TabsTrigger>
          <TabsTrigger value="simulator" className="text-xs font-semibold py-2 gap-1.5">
            <Play className="w-3.5 h-3.5 text-purple-500" />
            <span>4. Live Simulator</span>
          </TabsTrigger>
          <TabsTrigger value="dictionary" className="text-xs font-semibold py-2 gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            <span>5. Data Dictionary</span>
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: 8-STAGE HIRING LIFECYCLE                                */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="lifecycle" className="space-y-6">
          {/* Horizontal Stage Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {LIFECYCLE_STAGES.map((s) => {
              const isSelected = s.id === selectedStageId;
              const IconComponent = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStageId(s.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected 
                      ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20' 
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      0{s.id}
                    </span>
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">
                    {s.title.split('&')[0].trim()}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Stage Inspector */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${currentStage.badgeColor} text-xs font-semibold`}>
                      {currentStage.badge}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">Stage {currentStage.id} of 8</span>
                  </div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <currentStage.icon className="w-5 h-5 text-primary" />
                    {currentStage.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {currentStage.purpose}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleNavigateTo(currentStage.appRoute)}
                    className="gap-1.5 text-xs bg-primary hover:bg-primary/90 shadow-2xs"
                  >
                    {currentStage.appRouteLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Operator & Core Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block">
                    Responsible Actor
                  </span>
                  <p className="text-xs font-medium text-foreground mt-0.5">{currentStage.whoExecutes}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block">
                    Execution Mode
                  </span>
                  <p className="text-xs font-medium text-foreground mt-0.5">Real-Time Reactive Event</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block">
                    Target Workspace
                  </span>
                  <p className="text-xs font-medium text-foreground mt-0.5">{client?.name || 'Active Tenant'}</p>
                </div>
              </div>

              {/* 4 Quadrants: Inputs, Algorithms, Outputs, Security */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Inputs & Data Required */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Inputs & Data Payloads
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {currentStage.inputs.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Algorithms & Technical Processing */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Cpu className="w-4 h-4 text-purple-500" />
                    Algorithms & Processing Logic
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {currentStage.algorithms.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Outputs & Produced Artifacts */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Database className="w-4 h-4 text-emerald-500" />
                    Outputs & System State Changes
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {currentStage.outputs.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Security & Tenant Governance */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Lock className="w-4 h-4 text-rose-500" />
                    Security, RLS & Isolation Rules
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {currentStage.securityRules.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedStageId === 1}
                  onClick={() => setSelectedStageId(prev => Math.max(1, prev - 1))}
                  className="text-xs"
                >
                  &larr; Previous Stage
                </Button>
                <span className="text-xs text-muted-foreground font-mono">
                  {selectedStageId} / {LIFECYCLE_STAGES.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedStageId === LIFECYCLE_STAGES.length}
                  onClick={() => setSelectedStageId(prev => Math.min(LIFECYCLE_STAGES.length, prev + 1))}
                  className="text-xs"
                >
                  Next Stage &rarr;
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: SYSTEM ARCHITECTURE & DATA PIPELINES                    */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="architecture" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ARCHITECTURE_NODES.map((node) => {
              const IconComp = node.icon;
              return (
                <Card key={node.id} className="border-border shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase bg-muted">
                        {node.category}
                      </Badge>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${node.color} flex items-center justify-center text-white shadow-xs`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                    </div>
                    <CardTitle className="text-base font-bold">{node.name}</CardTitle>
                    <div className="text-[11px] font-mono text-primary">{node.tech}</div>
                    <CardDescription className="text-xs mt-1">
                      {node.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 border-t border-border/60">
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {node.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-primary font-bold">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* End-to-End Data Pipeline Flowchart */}
          <Card className="border-border bg-gradient-to-b from-card to-muted/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <WorkflowIcon className="w-4 h-4 text-primary" />
                End-to-End Data Pipeline Journey
              </CardTitle>
              <CardDescription className="text-xs">
                How data streams from candidate submission through AI vectorization into the recruiter workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-primary/30 ml-4 pl-6 space-y-6 py-2 text-xs">
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-background" />
                  <span className="font-bold text-foreground block">1. Applicant Ingestion & Turnstile Token Handshake</span>
                  <p className="text-muted-foreground mt-0.5">
                    Candidate completes form on `/apply/:slug` or embed widget. Cloudflare Turnstile token validated to thwart automated scrapers. Resume file uploaded to Supabase Storage `resumes/` bucket.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-purple-500 border-2 border-background" />
                  <span className="font-bold text-foreground block">2. Text Extraction & High-Dimensional Vector Math</span>
                  <p className="text-muted-foreground mt-0.5">
                    Resume text tokenized and passed into TF-IDF vectorizer. Cosine angle calculated between job requirements vector and applicant vector. Skills matched against taxonomy to identify competencies and missing gaps.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-500 border-2 border-background" />
                  <span className="font-bold text-foreground block">3. Multi-Tenant Isolated DB Persistence</span>
                  <p className="text-muted-foreground mt-0.5">
                    Record inserted into `public.candidates` with `client_id = activeClient.id`. Postgres RLS enforces that only recruiters belonging to that tenant can access the record.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
                  <span className="font-bold text-foreground block">4. Recruiter Review, Shortlisting & Interview Rounds</span>
                  <p className="text-muted-foreground mt-0.5">
                    Hiring team filters by AI score, stars candidate into `/shortlisted`, schedules interview round (generates Google Meet link), and submits 5-star rubric evaluation scorecards.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-rose-500 border-2 border-background" />
                  <span className="font-bold text-foreground block">5. Immutable Security Audit Logging & Realtime Broadcast</span>
                  <p className="text-muted-foreground mt-0.5">
                    Action logged to `public.audit_logs` with actor ID, timestamp, and metadata. Supabase Realtime notifies active team members instantly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: ROLE MATRIX & PERMISSIONS SIMULATOR                    */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="roles" className="space-y-6">
          {/* Role Persona Switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'super_admin', title: 'Platform Super Admin', subtitle: 'Global HQ Level', icon: Shield, badge: 'Full Authority' },
              { id: 'client_admin', title: 'Client Workspace Admin', subtitle: 'Company Admin (e.g. Zool)', icon: Building2, badge: 'Workspace Level' },
              { id: 'recruiter', title: 'Recruiter / Hiring Team', subtitle: 'Pipeline Operator', icon: Users, badge: 'ATS Operator' },
              { id: 'public', title: 'External Candidate', subtitle: 'Job Applicant', icon: Globe, badge: 'Public Applicant' },
            ].map((r) => {
              const isSelected = selectedRoleView === r.id;
              const IconComp = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleView(r.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected 
                      ? 'border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20' 
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <IconComp className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">{r.badge}</Badge>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground">{r.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Matrix Table */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Operational Permissions Matrix</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Comparing capabilities across all 4 platform roles
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Operation / Capability</th>
                      <th className="py-2.5 px-3 text-center">Platform Super Admin</th>
                      <th className="py-2.5 px-3 text-center">Client Workspace Admin</th>
                      <th className="py-2.5 px-3 text-center">Recruiter</th>
                      <th className="py-2.5 px-3 text-center">Public Applicant</th>
                      <th className="py-2.5 px-3">Operational Boundary & Security Rules</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ROLE_OPERATIONS.map((op, i) => {
                      const isRowActiveRole = 
                        (selectedRoleView === 'super_admin' && op.superAdmin) ||
                        (selectedRoleView === 'client_admin' && op.clientAdmin) ||
                        (selectedRoleView === 'recruiter' && op.recruiter) ||
                        (selectedRoleView === 'public' && op.publicApplicant);

                      return (
                        <tr 
                          key={i} 
                          className={`transition-colors ${
                            isRowActiveRole ? 'bg-primary/5 font-medium' : 'hover:bg-muted/30'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium text-foreground">
                            {op.operation}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {op.superAdmin ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-rose-500/40 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {op.clientAdmin ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-rose-500/40 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {op.recruiter ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-rose-500/40 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {op.publicApplicant ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-rose-500/40 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                            {op.notes}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: LIVE OPERATIONS SIMULATOR                              */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="simulator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Simulator Configuration Panel */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  Simulation Parameters
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure a mock candidate application to step through the live pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Job Requisition
                  </label>
                  <input
                    type="text"
                    value={simJobTitle}
                    onChange={(e) => setSimJobTitle(e.target.value)}
                    className="w-full h-8 px-2.5 rounded border border-border bg-background text-xs"
                    disabled={simRunning}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Candidate Full Name
                  </label>
                  <input
                    type="text"
                    value={simCandidateName}
                    onChange={(e) => setSimCandidateName(e.target.value)}
                    className="w-full h-8 px-2.5 rounded border border-border bg-background text-xs"
                    disabled={simRunning}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Extracted Resume Skills
                  </label>
                  <textarea
                    rows={2}
                    value={simCandidateSkills}
                    onChange={(e) => setSimCandidateSkills(e.target.value)}
                    className="w-full p-2 rounded border border-border bg-background text-xs resize-none"
                    disabled={simRunning}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Years of Relevant Experience: {simExperienceYears} yrs
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    value={simExperienceYears}
                    onChange={(e) => setSimExperienceYears(Number(e.target.value))}
                    className="w-full cursor-pointer accent-primary"
                    disabled={simRunning}
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={runSimulation}
                    disabled={simRunning}
                    className="w-full gap-1.5 text-xs bg-primary hover:bg-primary/90"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {simRunning ? 'Simulating Pipeline...' : 'Run Pipeline Simulation'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetSimulation}
                    disabled={simRunning}
                    className="text-xs shrink-0"
                    title="Reset Simulator"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Simulation Execution Stepper */}
            <Card className="lg:col-span-2 border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Real-Time Pipeline Execution Trace
                  </CardTitle>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {simRunning ? 'Processing Live...' : simCompleted ? 'Completed ✅' : 'Ready'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Visual Step Trace */}
                <div className="space-y-3 text-xs">
                  {/* Step 1 */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    simStep >= 1 ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border/50 opacity-40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        {simStep >= 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Clock className="w-3.5 h-3.5" />}
                        1. Public Form Submission & Cloudflare Turnstile Handshake
                      </span>
                      {simStep >= 1 && <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Turnstile OK</Badge>}
                    </div>
                    {simStep >= 1 && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Application received for <strong>{simCandidateName}</strong>. Resume uploaded to `resumes/{simCandidateName.toLowerCase().replace(' ', '_')}.pdf`.
                      </p>
                    )}
                  </div>

                  {/* Step 2 */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    simStep >= 2 ? 'border-purple-500/40 bg-purple-500/5' : 'border-border/50 opacity-40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        {simStep >= 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> : <Clock className="w-3.5 h-3.5" />}
                        2. TF-IDF High-Dimensional Vectorization & Cosine Similarity
                      </span>
                      {simStep >= 2 && <span className="text-[11px] font-mono font-bold text-purple-600">89% Match</span>}
                    </div>
                    {simStep >= 2 && (
                      <div className="mt-1 space-y-1">
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-purple-600 h-1.5 rounded-full transition-all duration-1000" style={{ width: '89%' }} />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Calculated high semantic cosine alignment against `{simJobTitle}` requirements vector.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step 3 */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    simStep >= 3 ? 'border-blue-500/40 bg-blue-500/5' : 'border-border/50 opacity-40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        {simStep >= 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> : <Clock className="w-3.5 h-3.5" />}
                        3. Skills Extraction & Competency Gap Analysis
                      </span>
                      {simStep >= 3 && <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">High Match 🟢</Badge>}
                    </div>
                    {simStep >= 3 && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="font-semibold text-foreground mr-1">Matched:</span>
                          {simCandidateSkills.split(',').slice(0, 4).map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-medium">{s.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 4 */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    simStep >= 4 ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/50 opacity-40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        {simStep >= 4 ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> : <Clock className="w-3.5 h-3.5" />}
                        4. Recruiter Triage & Starred Shortlist Advancement
                      </span>
                      {simStep >= 4 && <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">Shortlisted ⭐</Badge>}
                    </div>
                    {simStep >= 4 && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Candidate pinned to `/shortlisted` board. Stage updated to `shortlisted`.
                      </p>
                    )}
                  </div>

                  {/* Step 5 */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    simStep >= 5 ? 'border-fuchsia-500/40 bg-fuchsia-500/5' : 'border-border/50 opacity-40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        {simStep >= 5 ? <CheckCircle2 className="w-3.5 h-3.5 text-fuchsia-500" /> : <Clock className="w-3.5 h-3.5" />}
                        5. Technical Interview Scheduling & Google Meet Room Sync
                      </span>
                      {simStep >= 5 && <Badge variant="outline" className="text-[10px] bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20">Meet Room Generated</Badge>}
                    </div>
                    {simStep >= 5 && (
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 font-mono">
                        <Video className="w-3 h-3 text-fuchsia-500" />
                        meet.google.com/hsa-sim-{Math.random().toString(36).substring(7)}
                      </p>
                    )}
                  </div>

                  {/* Step 6 */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    simStep >= 6 ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-border/50 opacity-40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        {simStep >= 6 ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> : <Clock className="w-3.5 h-3.5" />}
                        6. 5-Star Rubric Scorecard Evaluation Submitted
                      </span>
                      {simStep >= 6 && <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20">Strong Hire 🌟 (4.8/5)</Badge>}
                    </div>
                    {simStep >= 6 && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Technical Architecture: 5/5 • Problem Solving: 5/5 • Communication: 4.5/5 • Culture: 4.8/5.
                      </p>
                    )}
                  </div>

                  {/* Step 7 */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    simStep >= 7 ? 'border-rose-500/40 bg-rose-500/5' : 'border-border/50 opacity-40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        {simStep >= 7 ? <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" /> : <Clock className="w-3.5 h-3.5" />}
                        7. SOC 2 / GDPR Append-Only Audit Trail Ledger
                      </span>
                      {simStep >= 7 && <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20">Audited 🛡️</Badge>}
                    </div>
                    {simStep >= 7 && (
                      <p className="text-[11px] text-muted-foreground mt-1 font-mono text-[10px]">
                        Event: `SUBMIT_SCORECARD` | Candidate: {simCandidateName} | Client: {client?.name || 'Zool'} | Status: 200 OK
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: DATABASE SCHEMA & FIELD DICTIONARY                     */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="dictionary" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                Relational Database Schemas & Field Dictionary
              </CardTitle>
              <CardDescription className="text-xs">
                Comprehensive dictionary of all PostgreSQL tables, foreign key cascades, and multi-tenant constraints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 1. jobs table */}
              <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-primary flex items-center gap-2">
                    <Code className="w-3.5 h-3.5" />
                    public.jobs
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">Multi-Tenant (client_id)</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Stores job requisitions, publishing status, screening questions, and Turnstile settings.</p>
                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="py-1.5 px-2">Column</th>
                        <th className="py-1.5 px-2">Type</th>
                        <th className="py-1.5 px-2">Constraints</th>
                        <th className="py-1.5 px-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      <tr><td className="py-1 px-2 text-foreground font-semibold">id</td><td className="py-1 px-2 text-muted-foreground">UUID</td><td className="py-1 px-2 text-emerald-600">PRIMARY KEY</td><td>Unique job identifier</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">client_id</td><td className="py-1 px-2 text-muted-foreground">UUID</td><td className="py-1 px-2 text-blue-600">FK -&gt; clients.id</td><td>Tenant boundary isolation</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">title</td><td className="py-1 px-2 text-muted-foreground">TEXT</td><td className="py-1 px-2">NOT NULL</td><td>Job role title (e.g. Frontend Engineer)</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">slug</td><td className="py-1 px-2 text-muted-foreground">TEXT</td><td className="py-1 px-2">UNIQUE</td><td>SEO URL path for public applications</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">status</td><td className="py-1 px-2 text-muted-foreground">TEXT</td><td className="py-1 px-2">DEFAULT 'published'</td><td>'published' | 'draft' | 'closed'</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">screening_questions</td><td className="py-1 px-2 text-muted-foreground">JSONB</td><td className="py-1 px-2">DEFAULT '[]'</td><td>Custom candidate questions schema</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">is_public</td><td className="py-1 px-2 text-muted-foreground">BOOLEAN</td><td className="py-1 px-2">DEFAULT true</td><td>Visibility on `/careers/:slug`</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. candidates table */}
              <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    <Code className="w-3.5 h-3.5" />
                    public.candidates
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">Multi-Tenant (client_id)</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Stores applicant dossiers, resume links, vector similarity scores, and predictive insights.</p>
                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="py-1.5 px-2">Column</th>
                        <th className="py-1.5 px-2">Type</th>
                        <th className="py-1.5 px-2">Constraints</th>
                        <th className="py-1.5 px-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      <tr><td className="py-1 px-2 text-foreground font-semibold">id</td><td className="py-1 px-2 text-muted-foreground">UUID</td><td className="py-1 px-2 text-emerald-600">PRIMARY KEY</td><td>Candidate record identifier</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">job_id</td><td className="py-1 px-2 text-muted-foreground">UUID</td><td className="py-1 px-2 text-blue-600">FK -&gt; jobs.id</td><td>Applied job requisition</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">client_id</td><td className="py-1 px-2 text-muted-foreground">UUID</td><td className="py-1 px-2 text-blue-600">FK -&gt; clients.id</td><td>Tenant company owner</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">cosine_similarity</td><td className="py-1 px-2 text-muted-foreground">FLOAT</td><td className="py-1 px-2">0.0 to 1.0</td><td>Vector semantic match percentage</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">ai_score</td><td className="py-1 px-2 text-muted-foreground">TEXT</td><td className="py-1 px-2">'high'|'medium'|'low'</td><td>Rubric classification tier</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">matched_skills</td><td className="py-1 px-2 text-muted-foreground">TEXT[]</td><td className="py-1 px-2">DEFAULT '{}'</td><td>Competencies found in resume</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">missing_skills</td><td className="py-1 px-2 text-muted-foreground">TEXT[]</td><td className="py-1 px-2">DEFAULT '{}'</td><td>Unsatisfied requirements</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">pipeline_stage</td><td className="py-1 px-2 text-muted-foreground">TEXT</td><td className="py-1 px-2">DEFAULT 'applied'</td><td>'applied'|'screened'|'interviewing'|'offered'|'rejected'</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. interviews & scorecards */}
              <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 flex items-center gap-2">
                    <Code className="w-3.5 h-3.5" />
                    public.interviews & public.interview_scorecards
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">5-Star Rubrics</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Multi-round schedule coordinates video rooms, panel assignments, and 4-pillar 5-star rubric scoring.</p>
                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="py-1.5 px-2">Column</th>
                        <th className="py-1.5 px-2">Type</th>
                        <th className="py-1.5 px-2">Constraints</th>
                        <th className="py-1.5 px-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      <tr><td className="py-1 px-2 text-foreground font-semibold">round_type</td><td className="py-1 px-2 text-muted-foreground">TEXT</td><td className="py-1 px-2">NOT NULL</td><td>'technical'|'system_design'|'cultural'|'hr'</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">meeting_url</td><td className="py-1 px-2 text-muted-foreground">TEXT</td><td className="py-1 px-2">-</td><td>Google Meet, Zoom, or Teams video room</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">ratings</td><td className="py-1 px-2 text-muted-foreground">JSONB</td><td className="py-1 px-2">1.0 to 5.0</td><td>Technical, ProblemSolving, Comm, Culture</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">recommendation</td><td className="py-1 px-2 text-muted-foreground">TEXT</td><td className="py-1 px-2">NOT NULL</td><td>'strong_hire'|'hire'|'no_hire'|'strong_no_hire'</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. audit_logs table */}
              <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <Code className="w-3.5 h-3.5" />
                    public.audit_logs
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">SOC 2 Compliance</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Append-only security ledger capturing user actions, logins, role assignments, and CRUD modifications.</p>
                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="py-1.5 px-2">Column</th>
                        <th className="py-1.5 px-2">Type</th>
                        <th className="py-1.5 px-2">Constraints</th>
                        <th className="py-1.5 px-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      <tr><td className="py-1 px-2 text-foreground font-semibold">action</td><td className="py-1 px-2 text-muted-foreground">TEXT</td><td className="py-1 px-2">NOT NULL</td><td>'INVITE_USER' | 'UPDATE_USER_ROLE' | 'PUBLISH_JOB'</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">user_id</td><td className="py-1 px-2 text-muted-foreground">UUID</td><td className="py-1 px-2">-</td><td>Actor performing the operation</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">client_id</td><td className="py-1 px-2 text-muted-foreground">UUID</td><td className="py-1 px-2">-</td><td>Tenant boundary of event</td></tr>
                      <tr><td className="py-1 px-2 text-foreground font-semibold">details</td><td className="py-1 px-2 text-muted-foreground">JSONB</td><td className="py-1 px-2">DEFAULT '{}'</td><td>Contextual before/after metadata</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
