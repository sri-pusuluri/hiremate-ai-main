import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JobDashboard } from '@/components/flows/JobDashboard';
import { OnboardingModal } from '@/components/flows/OnboardingModal';
import { ProcessingState } from '@/components/flows/ProcessingState';
import { RankedCandidatesList } from '@/components/flows/RankedCandidatesList';
import { CandidateDetail } from '@/components/flows/CandidateDetail';
import { ShortlistReview } from '@/components/flows/ShortlistReview';
import { FeedbackModal } from '@/components/flows/FeedbackModal';
import { EdgeStatesPreview } from '@/components/flows/EdgeStates';
import { FlowScreen, Job, Candidate } from '@/types/hiresort';
import { mockJobs, mockCandidates } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { ChevronRight, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const FLOW_SCREENS: { id: FlowScreen; label: string; description: string }[] = [
  { id: 'job-dashboard', label: '1. Job Dashboard', description: 'Entry point with HireSort discovery' },
  { id: 'onboarding-modal', label: '2. Onboarding Modal', description: 'First-time enable with trust messaging' },
  { id: 'processing', label: '3. Processing State', description: 'Async background ranking' },
  { id: 'ranked-list', label: '4. Ranked Candidates', description: 'Core AI-ranked list experience' },
  { id: 'candidate-detail', label: '5. Candidate Detail', description: 'Explainability & feedback' },
  { id: 'shortlist-review', label: '6. Shortlist Review', description: 'Pre-confirmation human ownership' },
  // Hidden from flow preview but code kept for future use:
  // { id: 'feedback', label: '7. Feedback Modal', description: 'Post-shortlist trust loop' },
  // { id: 'edge-states', label: '8. Edge States', description: 'Poor JD, low volume, errors' },
];

const logAICosting = async (
  jobId: string,
  candidateName: string,
  provider: string,
  modelName: string,
  prompt: string,
  outputJson: any
) => {
  const inputTokens = Math.round(prompt.length / 4);
  const outputTokens = Math.round(JSON.stringify(outputJson || {}).length / 4);
  
  let inputCostPerMillion = 1.0;
  let outputCostPerMillion = 3.0;

  if (provider === 'openai') {
    if (modelName === 'gpt-5.6-luna') {
      inputCostPerMillion = 0.15;
      outputCostPerMillion = 0.60;
    } else if (modelName === 'gpt-5.6-terra') {
      inputCostPerMillion = 1.0;
      outputCostPerMillion = 3.0;
    } else if (modelName === 'gpt-5.6-sol') {
      inputCostPerMillion = 3.0;
      outputCostPerMillion = 12.0;
    } else {
      inputCostPerMillion = 2.50;
      outputCostPerMillion = 10.00;
    }
  } else if (provider === 'claude') {
    inputCostPerMillion = 3.00;
    outputCostPerMillion = 15.00;
  } else if (provider === 'gemini') {
    if (modelName.includes('flash')) {
      inputCostPerMillion = 0.075;
      outputCostPerMillion = 0.30;
    } else {
      inputCostPerMillion = 1.25;
      outputCostPerMillion = 5.00;
    }
  }

  const inputCostUsd = (inputTokens / 1_000_000) * inputCostPerMillion;
  const outputCostUsd = (outputTokens / 1_000_000) * outputCostPerMillion;

  const logData = {
    job_id: jobId,
    candidate_name: candidateName,
    model_name: modelName,
    provider: provider,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    input_cost_usd: parseFloat(inputCostUsd.toFixed(6)),
    output_cost_usd: parseFloat(outputCostUsd.toFixed(6)),
    analyzed_prompt: prompt,
    output_received: outputJson || {},
    created_at: new Date().toISOString()
  };

  const useMock = localStorage.getItem('use_mock_supabase') === 'true';
  if (useMock) {
    const existingLogsStr = localStorage.getItem('hiremate_ai_analysis_logs') || '[]';
    const logs = JSON.parse(existingLogsStr);
    logs.push({ ...logData, id: Math.random().toString(36).substring(7) });
    localStorage.setItem('hiremate_ai_analysis_logs', JSON.stringify(logs));
    console.log("[Client AI Log] Saved mock costing log:", logData);
  } else {
    try {
      const { error } = await supabase
        .from('ai_analysis_logs')
        .insert(logData);
      if (error) {
        console.error("[Client AI Log] Failed to save DB log:", error);
      } else {
        console.log("[Client AI Log] Saved DB costing log successfully!");
      }
    } catch (err) {
      console.error("[Client AI Log] DB log insert error:", err);
    }
  }
};

export function HireSortApp() {
  const [currentView, setCurrentView] = useState('jobs');
  const [currentScreen, setCurrentScreen] = useState<FlowScreen>('job-dashboard');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showShortlist, setShowShortlist] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [shortlistCandidates, setShortlistCandidates] = useState<Candidate[]>([]);
  const [showFlowNav, setShowFlowNav] = useState(true);

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    if (job.hireSortEnabled && job.aiProcessingStatus === 'complete') {
      setCurrentScreen('ranked-list');
    } else if (job.hireSortEnabled && job.aiProcessingStatus === 'processing') {
      setCurrentScreen('processing');
    } else {
      setCurrentScreen('ranked-list');
    }
  };

  const handleEnableHireSort = (job: Job) => {
    setSelectedJob(job);
    setShowOnboarding(true);
  };

  const handleConfirmOnboarding = async () => {
    setShowOnboarding(false);
    setCurrentScreen('processing');

    if (selectedJob) {
      try {
        await supabase
          .from('jobs')
          .update({
            hire_sort_enabled: true,
            ai_processing_status: 'processing'
          })
          .eq('id', selectedJob.id);
      } catch (err) {
        console.error("Failed to enable HireSort in database:", err);
      }
    }
  };

  const analyzeCandidateWithLLM = async (candidateName: string, resumeText: string, jobTitle: string, jobDesc: string) => {
    const provider = localStorage.getItem('ai_provider') || 'gemini';
    const geminiKey = localStorage.getItem('gemini_api_key');
    const openaiKey = localStorage.getItem('openai_api_key');
    const claudeKey = localStorage.getItem('claude_api_key');
    const geminiModel = localStorage.getItem('gemini_model') || 'gemini-1.5-pro';
    const openaiModel = localStorage.getItem('openai_model') || 'gpt-5.6-luna';
    const claudeModel = localStorage.getItem('claude_model') || 'claude-3-5-sonnet-latest';

    const prompt = `You are an AI recruitment system. Analyze this candidate's resume against the Job Description.
    
    Job Title: ${jobTitle}
    Job Description: ${jobDesc}
    
    Candidate Name: ${candidateName}
    Candidate Resume: ${resumeText || 'No resume text provided.'}
    
    Return a structured JSON object matching this schema:
    {
      "score": "high" | "medium" | "low",
      "similarity": number (between 0.0 and 1.0 representing overall match percentage),
      "interviewPassProb": number (0 to 100),
      "offerAcceptanceProb": number (0 to 100),
      "onboardingSuccessProb": number (0 to 100),
      "retentionRisk": "low" | "medium" | "high",
      "retentionRiskFactor": "short reason why retention is low/medium/high, e.g. Stable tenure",
      "timeToJoinEstimate": "estimated time to join, e.g. 15 days, 30 days, Immediate",
      "assessment": "detailed recruiter assessment of candidate fit",
      "matchedSkills": ["skill1", "skill2"],
      "missingSkills": ["skill1", "skill2"]
    }
    
    Return ONLY the raw JSON object. Do not include markdown blocks or wrappers.`;

    let result: any = null;
    try {
      if (provider === 'openai' && openaiKey) {
        console.log("[Client AI] Calling OpenAI GPT-4o API directly...");
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          })
        });
        if (res.ok) {
          const data = await res.json();
          result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
        }
      } else if (provider === 'claude' && claudeKey) {
        console.log("[Client AI] Calling Anthropic Claude Messages API directly...");
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": claudeKey,
            "anthropic-version": "2023-06-01",
            "dangerously-allow-browser": "true"
          },
          body: JSON.stringify({
            model: claudeModel,
            max_tokens: 1000,
            system: "You are a recruiter. Output ONLY a valid JSON object matching the requested schema. No markdown ticks or wrappers.",
            messages: [{ role: "user", content: prompt }]
          })
        });
        if (res.ok) {
          const data = await res.json();
          result = JSON.parse(data.content?.[0]?.text || "{}");
        }
      } else if (provider === 'gemini' && geminiKey) {
        console.log("[Client AI] Calling Google Gemini API directly...");
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        if (res.ok) {
          const data = await res.json();
          result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
        }
      }

      if (result && selectedJob) {
        const activeModel = provider === 'openai' ? openaiModel : (provider === 'claude' ? claudeModel : geminiModel);
        await logAICosting(selectedJob.id, candidateName, provider, activeModel, prompt, result);
      }
    } catch (err) {
      console.error("[Client AI] API request failed:", err);
    }
    return result;
  };

  const handleProcessingComplete = async () => {
    setCurrentScreen('ranked-list');

    if (selectedJob) {
      try {
        const nowStr = new Date().toISOString();
        
        // 1. Update job status to complete
        await supabase
          .from('jobs')
          .update({
            hire_sort_enabled: true,
            ai_processing_status: 'complete',
            last_ranked_at: nowStr
          })
          .eq('id', selectedJob.id);

        // 2. Perform mock candidate analysis updates for this job
        const { data: jobCands } = await supabase
          .from('candidates')
          .select('id, full_name, resume_text')
          .eq('job_id', selectedJob.id);

        if (jobCands) {
          for (let i = 0; i < jobCands.length; i++) {
            const cand = jobCands[i];

            // Try to analyze with configured LLM directly from browser
            const analysis = await analyzeCandidateWithLLM(
              cand.full_name,
              cand.resume_text || '',
              selectedJob.title,
              selectedJob.description || ''
            );

            const score = analysis?.score || (i % 2 === 0 ? 'high' : 'medium');
            const similarity = analysis?.similarity || (i % 2 === 0 ? 0.89 - (i * 0.02) : 0.68 - (i * 0.02));
            const passProb = analysis?.interviewPassProb || (i % 2 === 0 ? 92 : 68);
            const acceptProb = analysis?.offerAcceptanceProb || 80;
            const onboardingSuccess = analysis?.onboardingSuccessProb || (i % 2 === 0 ? 95 : 78);
            const risk = analysis?.retentionRisk || 'low';
            const riskFactor = analysis?.retentionRiskFactor || (i % 2 === 0 ? 'Stable 3+ year average tenure' : 'Previous short tenure');
            const joinEstimate = analysis?.timeToJoinEstimate || (i % 2 === 0 ? '15 days' : '30 days');
            const textAssessment = analysis?.assessment || `Processed via local simulation.`;
            const foundSkills = analysis?.matchedSkills || [];
            const lackSkills = analysis?.missingSkills || [];

            await supabase
              .from('candidates')
              .update({
                ai_score: score,
                cosine_similarity: similarity,
                matched_skills: foundSkills,
                missing_skills: lackSkills,
                predictive_insights: {
                  interviewPassProb: passProb,
                  offerAcceptanceProb: acceptProb,
                  onboardingSuccessProb: onboardingSuccess,
                  retentionRisk: risk,
                  retentionRiskFactor: riskFactor,
                  timeToJoinEstimate: joinEstimate,
                  assessment: textAssessment
                }
              })
              .eq('id', cand.id);
          }
        }

        setSelectedJob(prev => prev ? {
          ...prev,
          hireSortEnabled: true,
          aiProcessingStatus: 'complete',
          lastRankedAt: nowStr.split('T')[0]
        } : null);
      } catch (err) {
        console.error("Failed to complete processing in database:", err);
      }
    }
  };

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleCreateShortlist = (candidates: Candidate[]) => {
    setShortlistCandidates(candidates);
    setShowShortlist(true);
  };

  const handleConfirmShortlist = () => {
    setShowShortlist(false);
    setShowFeedback(true);
  };

  const handleFeedbackComplete = () => {
    setShowFeedback(false);
    setCurrentScreen('job-dashboard');
    setSelectedJob(null);
  };

  const navigateToScreen = (screen: FlowScreen) => {
    // Reset modals
    setShowOnboarding(false);
    setShowShortlist(false);
    setShowFeedback(false);
    setSelectedCandidate(null);
    
    // Handle special screens that are modals
    if (screen === 'onboarding-modal') {
      setCurrentScreen('job-dashboard');
      setShowOnboarding(true);
      setSelectedJob(selectedJob || mockJobs[0]);
    } else if (screen === 'candidate-detail') {
      setCurrentScreen('ranked-list');
      setSelectedCandidate(selectedCandidate || mockCandidates[0]);
    } else if (screen === 'shortlist-review') {
      setCurrentScreen('ranked-list');
      setShortlistCandidates(shortlistCandidates.length > 0 ? shortlistCandidates : mockCandidates.slice(0, 3));
      setShowShortlist(true);
    } else if (screen === 'feedback') {
      setCurrentScreen('ranked-list');
      setShortlistCandidates(shortlistCandidates.length > 0 ? shortlistCandidates : mockCandidates.slice(0, 3));
      setShowFeedback(true);
    } else {
      setCurrentScreen(screen);
    }
  };

  const getTopBarProps = () => {
    switch (currentScreen) {
      case 'job-dashboard':
        return { title: 'Jobs', subtitle: 'Manage your open positions' };
      case 'processing':
        return { title: selectedJob?.title || 'Processing', subtitle: 'AI ranking in progress' };
      case 'ranked-list':
        return { title: selectedJob?.title || 'Candidates', subtitle: `${selectedJob?.candidateCount || 0} candidates` };
      case 'edge-states':
        return { title: 'Edge States', subtitle: 'Handling exceptional scenarios' };
      default:
        return { title: 'Hiresort GenAI', subtitle: '' };
    }
  };

  const renderMainContent = () => {
    switch (currentScreen) {
      case 'job-dashboard':
        return (
          <JobDashboard 
            onSelectJob={handleSelectJob}
            onEnableHireSort={handleEnableHireSort}
          />
        );
      case 'processing':
        return (
          <ProcessingState
            jobTitle={selectedJob?.title || 'Job'}
            totalCandidates={selectedJob?.candidateCount || 100}
            onComplete={handleProcessingComplete}
          />
        );
      case 'ranked-list':
        return (
          <RankedCandidatesList
            onSelectCandidate={handleSelectCandidate}
            onCreateShortlist={handleCreateShortlist}
            selectedJob={selectedJob || undefined}
          />
        );
      case 'edge-states':
        return <EdgeStatesPreview />;
      default:
        return (
          <JobDashboard 
            onSelectJob={handleSelectJob}
            onEnableHireSort={handleEnableHireSort}
          />
        );
    }
  };

  return (
    <div className="flex h-full">
      {/* Flow Navigation Panel */}
      {showFlowNav && (
        <div className="w-72 bg-card border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4" />
              UX Flow Preview
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Click to navigate screens
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {FLOW_SCREENS.map((screen) => {
                const isActive = currentScreen === screen.id || 
                  (screen.id === 'onboarding-modal' && showOnboarding) ||
                  (screen.id === 'candidate-detail' && selectedCandidate) ||
                  (screen.id === 'shortlist-review' && showShortlist) ||
                  (screen.id === 'feedback' && showFeedback);
                
                return (
                  <button
                    key={screen.id}
                    onClick={() => navigateToScreen(screen.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm font-medium",
                        isActive ? "text-primary-foreground" : "text-foreground"
                      )}>
                        {screen.label}
                      </span>
                      <ChevronRight className={cn(
                        "w-4 h-4",
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )} />
                    </div>
                    <p className={cn(
                      "text-xs mt-0.5",
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {screen.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-border">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              onClick={() => setShowFlowNav(false)}
            >
              Hide Navigator
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        {renderMainContent()}
        
        {/* Show Navigator Button */}
        {!showFlowNav && (
          <button
            onClick={() => setShowFlowNav(true)}
            className="absolute top-4 left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Show Flow Navigator
          </button>
        )}
      </div>

      {/* Modals & Overlays */}
      {showOnboarding && selectedJob && (
        <OnboardingModal
          jobTitle={selectedJob.title}
          candidateCount={selectedJob.candidateCount}
          onEnable={handleConfirmOnboarding}
          onCancel={() => setShowOnboarding(false)}
        />
      )}

      {selectedCandidate && (
        <CandidateDetail
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onFeedback={(type) => console.log('Feedback:', type)}
        />
      )}

      {showShortlist && (
        <ShortlistReview
          candidates={shortlistCandidates}
          onConfirm={handleConfirmShortlist}
          onClose={() => setShowShortlist(false)}
        />
      )}

      {showFeedback && (
        <FeedbackModal
          shortlistSize={shortlistCandidates.length}
          onComplete={handleFeedbackComplete}
          onSkip={handleFeedbackComplete}
        />
      )}
    </div>
  );
}
