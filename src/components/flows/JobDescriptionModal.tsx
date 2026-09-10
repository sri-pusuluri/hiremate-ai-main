import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Clock, Banknote, CheckCircle2, Sparkles, Download, Gift } from 'lucide-react';
import { Job } from '@/types/hiresort';
import { JDPredictivePanel } from '@/components/predictive/JDPredictivePanel';
import { assembleJobDescription, parseJobMarkdown } from '@/lib/job-parser';

interface JobDescriptionModalProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDescriptionModal({ job, open, onOpenChange }: JobDescriptionModalProps) {
  if (!job) return null;

  const fullMarkdown = assembleJobDescription(job);
  const parsed = parseJobMarkdown(fullMarkdown);

  const handleDownloadJD = () => {
    // Generate JD content as text
    const jdContent = `
${job.title}
${'='.repeat(job.title.length)}

Department: ${job.department}
Location: ${job.location}
Type: ${job.type}
Status: ${job.status}
${job.salary ? `Salary: ${job.salary}` : ''}

${parsed.overview.length ? `ABOUT THE ROLE\n${'-'.repeat(15)}\n${parsed.overview.join('\n\n')}\n` : ''}
${parsed.responsibilities.length ? `RESPONSIBILITIES\n${'-'.repeat(15)}\n${parsed.responsibilities.map(r => `• ${r}`).join('\n')}\n` : ''}
${parsed.requirements.length ? `REQUIREMENTS\n${'-'.repeat(15)}\n${parsed.requirements.map(r => `• ${r}`).join('\n')}\n` : ''}
${parsed.benefits.length ? `WHAT WE OFFER\n${'-'.repeat(15)}\n${parsed.benefits.map(b => `• ${b}`).join('\n')}\n` : ''}
${parsed.niceToHave.length ? `NICE TO HAVE\n${'-'.repeat(15)}\n${parsed.niceToHave.map(r => `• ${r}`).join('\n')}\n` : ''}

Posted: ${job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'Recent'}
Applicants: ${job.candidateCount || 0}
    `.trim();

    // Create and download the file
    const blob = new Blob([jdContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.title.replace(/\s+/g, '-').toLowerCase()}-jd.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-semibold">{job.title}</DialogTitle>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {job.department}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {job.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadJD}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                {job.status}
              </Badge>
            </div>
          </div>
          {job.salary && (
            <div className="flex items-center gap-1 mt-3 text-sm font-medium text-primary">
              <Banknote className="w-4 h-4" />
              {job.salary}
            </div>
          )}
        </DialogHeader>

        <Separator className="my-4" />

        <ScrollArea className="px-6 pb-6 max-h-[55vh]">
          <div className="space-y-6">

            {/* Predictive Effectiveness */}
            {job.predictiveEffectiveness && (
              <section>
                <JDPredictivePanel job={job} />
              </section>
            )}

            {/* Overview / About the Role */}
            {parsed.overview.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">About the Role</h3>
                <div className="space-y-3">
                  {parsed.overview.map((para, i) => (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                      {para.trim()}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* Responsibilities */}
            {parsed.responsibilities.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Key Responsibilities</h3>
                <ul className="space-y-2">
                  {parsed.responsibilities.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Requirements */}
            {parsed.requirements.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Requirements & Qualifications</h3>
                <ul className="space-y-2">
                  {parsed.requirements.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* What We Offer / Benefits */}
            {parsed.benefits.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-500" />
                  What We Offer
                </h3>
                <ul className="space-y-2">
                  {parsed.benefits.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Nice to Have */}
            {parsed.niceToHave.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Nice to Have
                </h3>
                <ul className="space-y-2">
                  {parsed.niceToHave.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Other Custom Sections */}
            {parsed.otherSections.map((sec, idx) => (
              <section key={idx}>
                <h3 className="text-sm font-semibold text-foreground mb-2">{sec.title}</h3>
                <ul className="space-y-2">
                  {sec.items.map((item, iIdx) => (
                    <li key={iIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {/* Job Meta */}
            <section className="pt-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Posted: {new Date(job.postedDate).toLocaleDateString()}</span>
                <span>•</span>
                <span>{job.candidateCount} applicants</span>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
