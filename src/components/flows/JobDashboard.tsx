import { useState } from 'react';
import { Job } from '@/types/hiresort';
import { mockJobs } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { AIBadge } from '@/components/ui/ai-badges';
import { JobDescriptionModal } from './JobDescriptionModal';
import { 
  Briefcase, 
  MapPin, 
  Users, 
  Calendar,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobDashboardProps {
  onSelectJob: (job: Job) => void;
  onEnableHireSort: (job: Job) => void;
}

export function JobDashboard({ onSelectJob, onEnableHireSort }: JobDashboardProps) {
  const [jobs] = useState<Job[]>(mockJobs);
  const [selectedJobForJD, setSelectedJobForJD] = useState<Job | null>(null);
  const [showJDModal, setShowJDModal] = useState(false);

  const handleViewJD = (job: Job) => {
    setSelectedJobForJD(job);
    setShowJDModal(true);
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-1">Active Jobs</h2>
        <p className="text-muted-foreground">
          Manage your job postings and review candidates
        </p>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-4">
        {jobs.map((job) => (
          <JobCard 
            key={job.id} 
            job={job} 
            onSelect={() => onSelectJob(job)}
            onEnableHireSort={() => onEnableHireSort(job)}
            onViewJD={() => handleViewJD(job)}
          />
        ))}
      </div>

      {/* JD Modal */}
      <JobDescriptionModal 
        job={selectedJobForJD}
        open={showJDModal}
        onOpenChange={setShowJDModal}
      />
    </div>
  );
}

interface JobCardProps {
  job: Job;
  onSelect: () => void;
  onEnableHireSort: () => void;
  onViewJD: () => void;
}

function JobCard({ job, onSelect, onEnableHireSort, onViewJD }: JobCardProps) {
  const getAIStatusDisplay = () => {
    if (!job.hireSortEnabled) {
      return null;
    }
    
    switch (job.aiProcessingStatus) {
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-ai-accent">
              <Clock className="w-4 h-4 animate-pulse-soft" />
              <span className="font-medium">Ranking in progress...</span>
            </div>
            <div className="w-24 h-1.5 bg-ai-surface rounded-full overflow-hidden">
              <div 
                className="h-full bg-ai-accent rounded-full transition-all duration-500"
                style={{ width: `${job.aiProcessingProgress || 0}%` }}
              />
            </div>
            <span className="text-muted-foreground text-xs">{job.aiProcessingProgress}%</span>
          </div>
        );
      case 'complete':
        return (
          <div className="flex items-center gap-1.5 text-success text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">Ranked</span>
            <span className="text-muted-foreground ml-1">• Updated {job.lastRankedAt}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-card-hover transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {job.title}
            </h3>
            {job.hireSortEnabled && <AIBadge size="sm" />}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              {job.department}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Posted {job.postedDate}
            </span>
            {job.screeningEndDate && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Screening ends {job.screeningEndDate}
              </span>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onViewJD();
              }}
              className="flex items-center gap-1.5 text-primary hover:underline cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              View JD
            </button>
          </div>

          {/* AI Status */}
          {getAIStatusDisplay()}
        </div>

        {/* Right: Candidate Count & Actions */}
        <div className="flex flex-col items-end gap-3">
          {/* Candidate Count */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-semibold text-foreground">{job.candidateCount}</span>
            <span className="text-sm text-muted-foreground">candidates</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!job.hireSortEnabled && (
              <Button 
                variant="ai" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnableHireSort();
                }}
              >
                <Sparkles className="w-4 h-4" />
                Enable Hiresort GenAI
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSelect}
              className="group-hover:border-primary group-hover:text-primary"
            >
              View Candidates
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
