import { useState } from 'react';
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

export function HireSortApp() {
  const [currentView, setCurrentView] = useState('jobs');
  const [currentScreen, setCurrentScreen] = useState<FlowScreen>('job-dashboard');
  const [selectedJob, setSelectedJob] = useState<Job | null>(mockJobs[0]);
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

  const handleConfirmOnboarding = () => {
    setShowOnboarding(false);
    setCurrentScreen('processing');
  };

  const handleProcessingComplete = () => {
    setCurrentScreen('ranked-list');
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
      setSelectedJob(mockJobs[0]);
    } else if (screen === 'candidate-detail') {
      setCurrentScreen('ranked-list');
      setSelectedCandidate(mockCandidates[0]);
    } else if (screen === 'shortlist-review') {
      setCurrentScreen('ranked-list');
      setShortlistCandidates(mockCandidates.slice(0, 3));
      setShowShortlist(true);
    } else if (screen === 'feedback') {
      setCurrentScreen('ranked-list');
      setShortlistCandidates(mockCandidates.slice(0, 3));
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
