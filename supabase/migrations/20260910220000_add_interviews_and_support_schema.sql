-- =========================================================================
-- HireSort ATS: Migration for Interviews & Help/Support Module
-- =========================================================================

-- 1. Interviews Table
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  round_type TEXT NOT NULL DEFAULT 'technical', -- 'screening', 'technical', 'system_design', 'cultural', 'managerial', 'hr'
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  meeting_link TEXT,
  interviewer_ids UUID[] DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Interview Scorecards Table
CREATE TABLE IF NOT EXISTS public.interview_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES auth.users(id),
  interviewer_name TEXT NOT NULL,
  interviewer_email TEXT,
  recommendation TEXT NOT NULL, -- 'strong_hire', 'hire', 'lean_hire', 'no_hire', 'strong_no_hire'
  overall_score NUMERIC(3, 2) NOT NULL,
  rubric_ratings JSONB NOT NULL DEFAULT '{}',
  strengths TEXT,
  areas_for_improvement TEXT,
  private_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- 'bug', 'billing', 'feature_request', 'integration', 'general'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'waiting_on_client', 'resolved', 'closed'
  description TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 4. Support Ticket Messages (Threaded chat)
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_email TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'client_user', -- 'super_admin', 'client_admin', 'recruiter', 'support_agent'
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_interviews_client ON public.interviews(client_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON public.interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_interview ON public.interview_scorecards(interview_id);
CREATE INDEX IF NOT EXISTS idx_tickets_client ON public.support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);
