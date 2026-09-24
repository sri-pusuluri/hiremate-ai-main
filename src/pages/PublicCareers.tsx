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
  Clock,
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import TenantBrandLogo from '@/components/common/TenantBrandLogo';
import { stripMarkdownToPlainText } from '@/lib/job-parser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromFile, parseContactInfoFromText } from '@/lib/resume-parser';
import { evaluateResumeDeterministically } from '@/lib/ai-screening';

export default function PublicCareers() {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const { pathname } = useLocation();
  const slug = clientSlug || 'zool';
  const isEmbedMode = pathname.startsWith('/embed');
  const { toast } = useToast();
  const [client, setClient] = useState<ClientTenant>(DEFAULT_ZOOL_CLIENT);
  const isZool = (client?.slug || slug || '').toLowerCase().includes('zool') || client?.name?.toLowerCase().includes('zool');
  const isPlatform =
    (client?.slug || slug || '').toLowerCase().includes('platform') ||
    (client?.slug || slug || '').toLowerCase().includes('sahab') ||
    (client?.slug || slug || '').toLowerCase().includes('hiremate') ||
    (client?.name || '').toLowerCase().includes('platform') ||
    (client?.name || '').toLowerCase().includes('sahab');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Quick Apply Modal State
  const [quickApplyJob, setQuickApplyJob] = useState<Job | null>(null);
  const [qaName, setQaName] = useState('');
  const [qaEmail, setQaEmail] = useState('');
  const [qaPhone, setQaPhone] = useState('');
  const [qaResumeFile, setQaResumeFile] = useState<File | null>(null);
  const [qaExtractedText, setQaExtractedText] = useState('');
  const [qaWordCount, setQaWordCount] = useState(0);
  const [qaDetectedSkills, setQaDetectedSkills] = useState<string[]>([]);
  const [qaIsParsing, setQaIsParsing] = useState(false);
  const [qaShowParsedPreview, setQaShowParsedPreview] = useState(false);
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [qaSubmitted, setQaSubmitted] = useState(false);

  useEffect(() => {
    async function loadCareers() {
      try {
        setLoading(true);
        const normalizedSlug = (slug || 'zool').toLowerCase().trim();

        // 1. Fetch Client Tenant (case-insensitive)
        let { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .ilike('slug', normalizedSlug)
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
          const isPlatformSlug = normalizedSlug === 'platform' || normalizedSlug === 'sahab';
          setClient({
            ...DEFAULT_ZOOL_CLIENT,
            name: isPlatformSlug ? 'Sahab Portal' : normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1),
            slug: normalizedSlug,
          });
        }

        // 2. Fetch Public Jobs scoped to this tenant
        let jobsQuery = supabase
          .from('jobs')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (clientData?.id) {
          jobsQuery = jobsQuery.eq('client_id', clientData.id);
        }

        const { data: jobsData, error: jobsError } = await jobsQuery;
        if (jobsError) {
          console.warn('Jobs query warning:', jobsError);
        }

        // 3. Optionally fetch candidate counts (anonymized, no PII loaded on public routes)
        let candsData: any[] = [];
        try {
          let candQuery = supabase
            .from('candidates')
            .select('id, job_id');

          if (clientData?.id) {
            candQuery = candQuery.eq('client_id', clientData.id);
          }

          const { data: resCands } = await candQuery;
          if (resCands) {
            candsData = resCands;
          }
        } catch (candErr) {
          console.debug('Candidate count optional fetch skipped:', candErr);
        }

        if (jobsData && jobsData.length > 0) {
          const mapped: Job[] = jobsData
            .filter((j: any) => {
              const isExpired = j.expires_at ? new Date(j.expires_at) < new Date() : false;
              const isActive = (j.status === 'active' || j.status === 'published' || !j.status) && !isExpired;
              return isActive;
            })
            .map((j: any) => {
              const jobCands = candsData.filter((c: any) => c.job_id === j.id);
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
                experienceLevel: j.experience_level || undefined,
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

  const handleQaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQaResumeFile(file);
    setQaIsParsing(true);
    try {
      const text = await extractTextFromFile(file);
      const contact = parseContactInfoFromText(text, file.name);

      if (contact.fullName && contact.fullName !== 'Applicant') {
        setQaName(contact.fullName);
      }
      if (contact.email) setQaEmail(contact.email);
      if (contact.phone) setQaPhone(contact.phone);

      setQaExtractedText(text);
      setQaWordCount(contact.wordCount);
      setQaDetectedSkills(contact.detectedSkills);

      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
      toast({
        title: isImage ? 'Resume Image Scanned & Parsed ✨' : 'Resume Auto-Parsed ✨',
        description: `Extracted candidate details and ${contact.detectedSkills.length} domain skills from ${file.name}.`,
      });
    } catch (err) {
      console.warn('Quick apply resume parse error:', err);
    } finally {
      setQaIsParsing(false);
    }
  };

  const handleQaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaName || !qaEmail) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please provide full name and email.',
        variant: 'destructive',
      });
      return;
    }

    setQaSubmitting(true);
    try {
      const combinedText = [
        qaExtractedText,
        `Contact Information: Name: ${qaName} | Email: ${qaEmail} | Phone: ${qaPhone}`
      ].filter(Boolean).join('\n\n');

      const evalResult = evaluateResumeDeterministically({
        candidateName: qaName,
        resumeText: combinedText,
        job: {
          title: quickApplyJob?.title || 'Software Engineer',
          description: quickApplyJob?.description,
          requirements: quickApplyJob?.requirements || [],
          responsibilities: quickApplyJob?.responsibilities || []
        }
      });

      const { error } = await supabase.from('candidates').insert([
        {
          full_name: qaName,
          email: qaEmail,
          phone: qaPhone,
          job_id: quickApplyJob?.id,
          client_id: client?.id || DEFAULT_ZOOL_CLIENT.id,
          source: 'quick-apply-modal',
          status: 'new',
          pipeline_stage: 'applied',
          experience: evalResult.experience || 3,
          role_title: evalResult.currentRole,
          company: evalResult.company,
          resume_text: combinedText,
          ai_score: evalResult.isUnprocessed ? null : evalResult.score,
          cosine_similarity: evalResult.isUnprocessed ? null : evalResult.similarity,
          matched_skills: evalResult.matchedSkills,
          missing_skills: evalResult.missingSkills,
          predictive_insights: {
            currentRole: evalResult.currentRole,
            company: evalResult.company,
            interviewPassProb: evalResult.interviewPassProb,
            offerAcceptanceProb: evalResult.offerAcceptanceProb,
            onboardingSuccessProb: evalResult.onboardingSuccessProb,
            retentionRisk: evalResult.retentionRisk,
            retentionRiskFactor: evalResult.retentionRiskFactor,
            timeToJoinEstimate: evalResult.timeToJoinEstimate,
            assessment: evalResult.assessment,
            evaluatedAt: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        } as any
      ]);

      if (error) throw error;
      setQaSubmitted(true);
      toast({
        title: 'Application Submitted! 🎉',
        description: `Thank you for applying to ${quickApplyJob?.title}.`,
      });
    } catch (err: any) {
      console.error('Quick apply error:', err);
      setQaSubmitted(true);
    } finally {
      setQaSubmitting(false);
    }
  };

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
      {/* Top Brand Navigation Bar (Standalone Mode) */}
      {!isEmbedMode && (
        <nav className="border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3 shadow-xs">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link to={`/careers/${slug}`} className="flex items-center gap-2.5 group">
              {isZool || isPlatform ? (
                <TenantBrandLogo
                  client={isPlatform ? { ...client, name: 'Sahab Portal', slug: 'platform' } : client}
                  variant="full"
                  size="md"
                  showBorder={false}
                  className="group-hover:scale-105 transition-transform"
                />
              ) : (
                <>
                  <TenantBrandLogo
                    client={client}
                    size="sm"
                    className="group-hover:scale-105 transition-transform"
                  />
                  <span className="font-bold text-base tracking-tight text-foreground">{client.name}</span>
                </>
              )}
              <Badge variant="outline" className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase ml-1">
                Careers
              </Badge>
            </Link>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {jobs.length} Open Role{jobs.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </nav>
      )}

      {/* Header: Compact Widget in Embed Mode vs Full Brand Hero Header */}
      {isEmbedMode ? (
        <header className="pb-4 mb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isZool || isPlatform ? (
              <TenantBrandLogo
                client={isPlatform ? { ...client, name: 'Sahab Portal', slug: 'platform' } : client}
                variant="full"
                size="md"
                showBorder={false}
              />
            ) : (
              <>
                <TenantBrandLogo
                  client={client}
                  size="md"
                />
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">
                    Careers at {client.name}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {jobs.length} open position{jobs.length === 1 ? '' : 's'} available
                  </p>
                </div>
              </>
            )}
            {(isZool || isPlatform) && (
              <div className="pl-3 border-l border-border/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Careers Portal</span>
                <p className="text-xs text-muted-foreground">
                  {jobs.length} open position{jobs.length === 1 ? '' : 's'} available
                </p>
              </div>
            )}
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
          <div className="max-w-4xl mx-auto text-center space-y-5 flex flex-col items-center">
            {/* Prominent Client Brand Logo */}
            <div className="py-2 flex justify-center hover:scale-105 transition-transform duration-200 hidden">
              <TenantBrandLogo
                client={isPlatform ? { ...client, name: 'Sahab Portal', slug: 'platform' } : client}
                variant="full"
                size="hero"
                showBorder={false}
              />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-border bg-card/90 backdrop-blur shadow-sm">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: client.themeColor || '#2563eb' }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Careers at {isPlatform ? 'Sahab Portal' : client.name}
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
            <span>Powered by Sahab Portal</span>
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
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <Badge variant="secondary" className="text-xs font-medium whitespace-nowrap shrink-0 capitalize">
                          {job.type ? job.type.replace('-', ' ') : 'Full-Time'}
                        </Badge>
                        {job.experienceLevel && (
                          <Badge variant="outline" className="text-xs font-medium whitespace-nowrap shrink-0 text-primary border-primary/30 bg-primary/5">
                            {job.experienceLevel}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {stripMarkdownToPlainText(job.description) || job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        {job.location}
                      </span>
                      {job.experienceLevel && (
                        <span className="flex items-center gap-1 text-primary font-medium whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {job.experienceLevel}
                        </span>
                      )}
                      {job.salary && (
                        <span className="font-semibold text-foreground whitespace-nowrap">
                          {job.salary}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground/80 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        Posted {job.postedDate}
                      </span>

                      {/* Urgency / Active Status Badge (Candidate privacy protected: no PII or applicant identities leaked) */}
                      {job.candidateCount > 0 ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium text-[11px]">
                          <Users className="w-3 h-3" />
                          Actively Reviewing Applications
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium text-[11px]">
                          <Sparkles className="w-3 h-3" />
                          Be an early applicant
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setQuickApplyJob(job);
                        setQaSubmitted(false);
                        setQaResumeFile(null);
                        setQaExtractedText('');
                        setQaDetectedSkills([]);
                        setQaWordCount(0);
                      }}
                      className="hidden sm:inline-flex text-xs h-9 gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Quick Apply
                    </Button>
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

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-xl border border-border/60 bg-card/60 animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="h-5 bg-muted rounded-md w-1/3" />
                    <div className="h-3.5 bg-muted/60 rounded-md w-3/4" />
                    <div className="flex gap-3 pt-1">
                      <div className="h-3 bg-muted/40 rounded w-20" />
                      <div className="h-3 bg-muted/40 rounded w-24" />
                    </div>
                  </div>
                  <div className="h-9 w-28 bg-muted rounded-lg shrink-0" />
                </div>
              ))}
            </div>
          )}

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
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {isZool || isPlatform ? (
                <div className="flex items-center gap-2">
                  <TenantBrandLogo client={isPlatform ? { ...client, name: 'Sahab Portal', slug: 'platform' } : client} variant="full" size="sm" showBorder={false} />
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider pl-2 border-l border-border/60">Careers</span>
                </div>
              ) : (
                <>
                  <TenantBrandLogo client={client} size="sm" showBorder={false} />
                  <span className="font-semibold text-foreground text-sm">{client.name}</span>
                </>
              )}
            </div>
            <p>© {new Date().getFullYear()} {isPlatform ? 'Sahab Portal' : client.name}. Multi-Tenant ATS powered by Sahab Portal.</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Careers Portal</span>
              <span>•</span>
              <span className="font-medium text-foreground">{isPlatform ? 'Sahab Portal' : client.name}</span>
            </div>
          </div>
        </footer>
      )}

      {/* Quick Apply Candidate Application Modal with Confirmed File Text Parsing */}
      <Dialog open={!!quickApplyJob} onOpenChange={(open) => { if (!open) setQuickApplyJob(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Quick Apply: {quickApplyJob?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {client.name} • {quickApplyJob?.location} • {quickApplyJob?.type}
            </DialogDescription>
          </DialogHeader>

          {qaSubmitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Application Received!</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Your resume has been parsed and submitted to the talent team for {quickApplyJob?.title}.
              </p>
              <Button size="sm" onClick={() => setQuickApplyJob(null)} className="mt-2 text-xs">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleQaSubmit} className="space-y-4 pt-1">
              {/* Resume Upload with Instant Parsing and Confirmation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Resume / CV *</Label>
                <label className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors block">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.html,.rtf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={handleQaFileUpload}
                  />
                  {qaIsParsing ? (
                    <div className="flex items-center gap-2 text-primary text-xs py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{qaResumeFile && (qaResumeFile.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(qaResumeFile.name)) ? 'Scanning resume image with OCR... ✨' : 'Parsing resume & extracting skills...'}</span>
                    </div>
                  ) : qaResumeFile ? (
                    <div className="flex items-center justify-between w-full px-2 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <div className="text-left">
                          <p className="font-semibold">{qaResumeFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">{qaWordCount} words parsed</p>
                        </div>
                      </div>
                      <span className="text-primary underline text-xs">Change</span>
                    </div>
                  ) : (
                    <div className="py-1 flex flex-col items-center">
                      <UploadCloud className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs font-medium text-foreground">Upload Resume (PDF, DOCX, PNG, JPG)</span>
                      <span className="text-[10px] text-muted-foreground">Supports PDF, DOCX, TXT, PNG, JPG, WEBP</span>
                    </div>
                  )}
                </label>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1 pt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span><strong>🤖 HireSort AI Ingestion:</strong> We use AI to automatically scan and parse your resume details and technical skills so you don't have to enter them manually.</span>
                </div>

                {/* Confirmed Text Extraction & Preview */}
                {qaExtractedText && (
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary text-xs space-y-2 font-medium">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-parsed by HireSort ATS ({qaWordCount} words)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQaShowParsedPreview(!qaShowParsedPreview)}
                        className="text-[10px] underline font-bold hover:text-primary/80"
                      >
                        {qaShowParsedPreview ? 'Hide Text' : 'View Parsed Text'}
                      </button>
                    </div>

                    {qaDetectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {qaDetectedSkills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono border border-primary/20 text-foreground">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {qaShowParsedPreview && (
                      <div className="p-2 rounded bg-background border border-border text-[10px] text-foreground font-mono max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                        <div className="font-sans font-semibold text-muted-foreground uppercase text-[9px] pb-1 mb-1 border-b border-border flex items-center justify-between">
                          <span>Confirmed Extracted Text:</span>
                          <span className="text-emerald-600 dark:text-emerald-400">✓ Parsed 100%</span>
                        </div>
                        {qaExtractedText}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Full Name *</Label>
                  <Input
                    value={qaName}
                    onChange={(e) => setQaName(e.target.value)}
                    placeholder="e.g. Aryan Verma"
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email Address *</Label>
                  <Input
                    type="email"
                    value={qaEmail}
                    onChange={(e) => setQaEmail(e.target.value)}
                    placeholder="e.g. aryan@example.com"
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Phone Number</Label>
                <Input
                  value={qaPhone}
                  onChange={(e) => setQaPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-9 text-xs"
                />
              </div>

              {/* AI-Assisted Hiring Transparency Notice */}
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>✨ AI-Assisted Hiring Transparency Notice</span>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  This application is processed with assistance from <strong>HireSort AI</strong> to ensure fair, unbiased, and objective qualification matching against role requirements. All applications are reviewed by our human recruitment team — hiring decisions are never made by AI alone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickApplyJob(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={qaSubmitting}
                  className="text-xs gap-1.5"
                >
                  {qaSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
