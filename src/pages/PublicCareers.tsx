import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Job, ClientTenant } from '@/types/hiresort';
import { DEFAULT_ZOOL_CLIENT } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Search, 
  MapPin, 
  Briefcase, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  CheckCircle,
  ExternalLink,
  Users,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function PublicCareers() {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const { pathname } = useLocation();
  const slug = clientSlug || 'zool';
  const isEmbedMode = pathname.startsWith('/embed');

  const [client, setClient] = useState<ClientTenant>(DEFAULT_ZOOL_CLIENT);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [candidatesData, setCandidatesData] = useState<any[]>([]);
  const [inspectingJob, setInspectingJob] = useState<Job | null>(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);

  useEffect(() => {
    async function loadCareers() {
      try {
        setLoading(true);
        // 1. Fetch Client Tenant
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (clientData) {
          setClient({
            id: (clientData as any).id,
            name: (clientData as any).name,
            slug: (clientData as any).slug,
            logoUrl: (clientData as any).logo_url,
            themeColor: (clientData as any).theme_color || '#2563eb',
            subscriptionTier: (clientData as any).subscription_tier || 'pro',
          });
        } else {
          setClient({
            ...DEFAULT_ZOOL_CLIENT,
            name: slug.charAt(0).toUpperCase() + slug.slice(1),
            slug: slug,
          });
        }

        // 2. Fetch Public Jobs & Candidates scoped to this tenant
        let jobsQuery = supabase
          .from('jobs')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (clientData?.id) {
          jobsQuery = jobsQuery.eq('client_id', clientData.id);
        }

        const { data: jobsData } = await jobsQuery;

        let candQuery = supabase
          .from('candidates')
          .select('id, full_name, email, job_id, created_at, status, pipeline_stage, experience');

        if (clientData?.id) {
          candQuery = candQuery.eq('client_id', clientData.id);
        }

        const { data: candsData } = await candQuery;

        if (candsData) {
          setCandidatesData(candsData);
        }

        if (jobsData && jobsData.length > 0) {
          const mapped: Job[] = jobsData
            .filter((j: any) => {
              const isExpired = j.expires_at ? new Date(j.expires_at) < new Date() : false;
              const isActive = (j.status === 'active' || j.status === 'published' || !j.status) && !isExpired;
              return isActive;
            })
            .map((j: any) => {
              const jobCands = candsData ? candsData.filter((c: any) => c.job_id === j.id) : [];
              return {
                id: j.id,
                title: j.title,
                department: j.department || 'General',
                location: j.location || 'Remote',
                type: j.type || 'full-time',
                salary: j.salary,
                description: j.description,
                responsibilities: j.responsibilities || [],
                requirements: j.requirements || [],
                niceToHave: j.nice_to_have || [],
                postedDate: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : '2026-02-01',
                candidateCount: jobCands.length,
                isPublic: true,
                slug: j.slug || j.id,
              };
            });
          setJobs(mapped);
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error('Error loading public careers:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCareers();
  }, [slug]);

  const departments = Array.from(new Set(jobs.map(j => j.department)));

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || j.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Automatically broadcast height to host website (WordPress, React, HTML) when in embed mode
  useEffect(() => {
    if (!isEmbedMode || typeof window === 'undefined' || window === window.parent) return;

    const notifyParentHeight = () => {
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      window.parent.postMessage({
        type: 'HIRESORT_RESIZE',
        height: Math.max(scrollHeight, 450),
        clientSlug: slug
      }, '*');
    };

    // Immediate calculation + delay to catch layout reflow
    notifyParentHeight();
    const timer = setTimeout(notifyParentHeight, 250);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        notifyParentHeight();
      });
      observer.observe(document.body);
    }

    window.addEventListener('resize', notifyParentHeight);

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', notifyParentHeight);
    };
  }, [isEmbedMode, jobs, filteredJobs, loading, slug]);

  return (
    <div className={isEmbedMode ? "bg-background text-foreground flex flex-col p-4 font-sans" : "min-h-screen bg-background text-foreground flex flex-col"}>
      {/* Header: Compact Widget in Embed Mode vs Full Brand Hero Header */}
      {isEmbedMode ? (
        <header className="pb-4 mb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0" 
              style={{ backgroundColor: client.themeColor || '#2563eb' }}
            />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">
                Careers at {client.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {jobs.length} open position{jobs.length === 1 ? '' : 's'} available
              </p>
            </div>
          </div>
          <a 
            href={`/careers/${slug}`} 
            target="_blank" 
            rel="noreferrer" 
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium bg-muted/60 px-2.5 py-1.5 rounded-md border border-border"
          >
            <span>Full Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </header>
      ) : (
        <header 
          className="relative border-b border-border py-16 px-6 overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${client.themeColor || '#2563eb'}22 0%, transparent 70%)`
          }}
        >
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/80 backdrop-blur shadow-sm">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: client.themeColor || '#2563eb' }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Careers at {client.name}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Build the future with us.
            </h1>

            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We are hiring ambitious innovators, engineers, and creators. Explore open roles and join our team.
            </p>

            <div className="pt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Fast-Track AI Screening
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Competitive Compensation
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Remote & Hybrid Flexibility
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Main Jobs Listing */}
      <main className={isEmbedMode ? "w-full flex-1 space-y-5" : "max-w-4xl mx-auto w-full px-6 py-10 flex-1 space-y-8"}>
        {/* Search & Dept Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title, skills, or location..."
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={selectedDept === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDept('all')}
              className="rounded-lg text-xs"
            >
              All Roles ({jobs.length})
            </Button>
            {departments.map((dept) => (
              <Button
                key={dept}
                variant={selectedDept === dept ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDept(dept)}
                className="rounded-lg text-xs shrink-0"
              >
                {dept}
              </Button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
            <span>Open Opportunities ({filteredJobs.length})</span>
            <span>Powered by HireSort AI</span>
          </div>

          {filteredJobs.map((job) => (
            <Link 
              key={job.id} 
              to={`/careers/${client.slug}/${job.slug || job.id}`}
              target={isEmbedMode ? "_blank" : undefined}
              rel={isEmbedMode ? "noopener noreferrer" : undefined}
              className="block group"
            >
              <Card className="border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-card">
                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs capitalize font-medium">
                        {job.type}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </span>
                      {job.salary && (
                        <span className="font-semibold text-foreground">
                          {job.salary}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground/80">
                        <Calendar className="w-3.5 h-3.5" />
                        Posted {job.postedDate}
                      </span>

                      {/* Applicant Count Badge */}
                      {job.candidateCount > 0 ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium text-[11px]">
                          <Users className="w-3 h-3" />
                          {job.candidateCount} {job.candidateCount === 1 ? 'applicant' : 'applicants'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium text-[11px]">
                          <Sparkles className="w-3 h-3" />
                          Be an early applicant
                        </span>
                      )}

                      {/* Recruiter / Client View Applicants Button */}
                      {job.candidateCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setInspectingJob(job);
                            setShowApplicantsModal(true);
                          }}
                          className="flex items-center gap-1 text-primary hover:underline font-medium cursor-pointer"
                          title="View applied candidates"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Applied ({job.candidateCount})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Button 
                      className="group-hover:bg-primary group-hover:text-primary-foreground gap-1.5"
                    >
                      Apply Now
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {filteredJobs.length === 0 && !loading && (
            <div className="p-12 text-center border border-dashed border-border rounded-xl">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold">No open roles found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for another keyword or department filter.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer (hidden in embed mode for clean host integration) */}
      {!isEmbedMode && (
        <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground mt-auto bg-muted/20">
          <p>© {new Date().getFullYear()} {client.name}. Powered by HireSortAi Multi-Tenant ATS.</p>
        </footer>
      )}
      {/* Applied Candidates Modal for Client Listing */}
      <Dialog open={showApplicantsModal} onOpenChange={setShowApplicantsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Applied Candidates
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {inspectingJob?.title} • {candidatesData.filter(c => c.job_id === inspectingJob?.id).length} total applications received
                </DialogDescription>
              </div>
              <a
                href="/jobs"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20"
              >
                Open in HireSort ATS
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </DialogHeader>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 divide-y divide-border">
            {candidatesData.filter(c => c.job_id === inspectingJob?.id).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No candidates have applied to this role yet.
              </div>
            ) : (
              candidatesData
                .filter(c => c.job_id === inspectingJob?.id)
                .map((cand, idx) => (
                  <div key={cand.id || idx} className="pt-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs">
                        {cand.full_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{cand.full_name}</p>
                        <p className="text-muted-foreground text-xs">{cand.email || 'applicant@email.com'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-[11px]">
                        Applied {cand.created_at ? new Date(cand.created_at).toLocaleDateString() : 'Recently'}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize bg-muted font-medium">
                        {cand.status || cand.pipeline_stage || 'Applied'}
                      </Badge>
                      <a
                        href="/jobs"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-medium text-xs flex items-center gap-0.5"
                      >
                        Evaluate
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
