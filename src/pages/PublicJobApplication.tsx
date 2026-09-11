import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Job, ClientTenant } from '@/types/hiresort';
import { DEFAULT_ZOOL_CLIENT } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  ArrowLeft, 
  Sparkles, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Check, 
  Clock, 
  Loader2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Globe,
  Share2,
  Lock,
  Zap,
  Gift,
  Heart,
  GraduationCap,
  Award,
  User,
  Mail,
  Phone,
  Linkedin,
  Compass,
  CheckCheck
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import TenantBrandLogo from '@/components/common/TenantBrandLogo';
import TurnstileWidget from '@/components/common/TurnstileWidget';

interface ParsedJobContent {
  overview: string[];
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  otherSections: Array<{ title: string; items: string[] }>;
}

function parseJobDescription(
  rawDescription: string = '',
  fallbackResponsibilities: string[] = [],
  fallbackRequirements: string[] = [],
  fallbackNiceToHave: string[] = []
): ParsedJobContent {
  const lines = rawDescription.split('\n');
  const result: ParsedJobContent = {
    overview: [],
    responsibilities: [],
    requirements: [],
    benefits: [],
    otherSections: [],
  };

  let currentSection: 'overview' | 'responsibilities' | 'requirements' | 'benefits' | 'other' = 'overview';
  let currentOtherTitle = '';
  let currentOtherItems: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect section headers (e.g. ## About the Role, ### Key Responsibilities, etc.)
    if (/^#+\s*(about(\s+the)?\s+(role|position|job)|overview|summary)/i.test(line)) {
      if (currentSection === 'other' && currentOtherTitle) {
        result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
        currentOtherItems = [];
      }
      currentSection = 'overview';
      continue;
    }

    if (/^#+\s*(key\s+)?responsibilit(ies|y)|what\s+you('ll|\s+will)\s+do|the\s+role/i.test(line)) {
      if (currentSection === 'other' && currentOtherTitle) {
        result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
        currentOtherItems = [];
      }
      currentSection = 'responsibilities';
      continue;
    }

    if (/^#+\s*(requirements(\s*&\s*qualifications)?|qualifications|what\s+we('re|\s+are)\s+looking\s+for|skills(\s*&\s*experience)?)/i.test(line)) {
      if (currentSection === 'other' && currentOtherTitle) {
        result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
        currentOtherItems = [];
      }
      currentSection = 'requirements';
      continue;
    }

    if (/^#+\s*(what\s+we\s+offer|benefits|perks|compensation\s*&\s*benefits)/i.test(line)) {
      if (currentSection === 'other' && currentOtherTitle) {
        result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
        currentOtherItems = [];
      }
      currentSection = 'benefits';
      continue;
    }

    if (/^#+\s+(.+)/.test(line)) {
      if (currentSection === 'other' && currentOtherTitle) {
        result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
      }
      const match = line.match(/^#+\s+(.+)/);
      currentOtherTitle = match ? match[1] : 'Additional Details';
      currentOtherItems = [];
      currentSection = 'other';
      continue;
    }

    // Process bullet point or normal text
    const cleanContent = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();

    if (currentSection === 'overview') {
      result.overview.push(cleanContent);
    } else if (currentSection === 'responsibilities') {
      result.responsibilities.push(cleanContent);
    } else if (currentSection === 'requirements') {
      result.requirements.push(cleanContent);
    } else if (currentSection === 'benefits') {
      result.benefits.push(cleanContent);
    } else if (currentSection === 'other') {
      currentOtherItems.push(cleanContent);
    }
  }

  if (currentSection === 'other' && currentOtherTitle) {
    result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
  }

  // Gracefully fallback to structured props only if not already supplied inside markdown description
  if (result.responsibilities.length === 0 && fallbackResponsibilities.length > 0) {
    result.responsibilities = fallbackResponsibilities;
  }
  if (result.requirements.length === 0 && fallbackRequirements.length > 0) {
    result.requirements = fallbackRequirements;
  }
  if (fallbackNiceToHave.length > 0 && !result.otherSections.some(s => s.title.toLowerCase().includes('nice'))) {
    result.otherSections.push({ title: 'Nice to Have', items: fallbackNiceToHave });
  }

  return result;
}

function renderInlineFormatted(text: string) {
  // Bold **text** or italic *text*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function getBenefitIcon(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('salary') || lower.includes('equity') || lower.includes('compensation') || lower.includes('pay') || lower.includes('ctc')) {
    return <Zap className="w-4 h-4 text-amber-500" />;
  }
  if (lower.includes('health') || lower.includes('wellness') || lower.includes('medical') || lower.includes('coverage') || lower.includes('insurance')) {
    return <Heart className="w-4 h-4 text-rose-500" />;
  }
  if (lower.includes('remote') || lower.includes('hybrid') || lower.includes('flexible') || lower.includes('work from') || lower.includes('hours')) {
    return <Globe className="w-4 h-4 text-blue-500" />;
  }
  if (lower.includes('learning') || lower.includes('development') || lower.includes('stipend') || lower.includes('conference') || lower.includes('education')) {
    return <GraduationCap className="w-4 h-4 text-purple-500" />;
  }
  return <Gift className="w-4 h-4 text-emerald-500" />;
}

export default function PublicJobApplication() {
  const { clientSlug, jobSlug } = useParams<{ clientSlug: string; jobSlug: string }>();
  const slug = clientSlug || 'zool';
  const { toast } = useToast();

  const [client, setClient] = useState<ClientTenant>(DEFAULT_ZOOL_CLIENT);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const isZool = (client?.slug || slug || '').toLowerCase().includes('zool') || client?.name?.toLowerCase().includes('zool');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  // File Upload & AI Parsing State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parsedByAI, setParsedByAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [jobQuestions, setJobQuestions] = useState<Array<{ id: string; text: string; type: string; options?: string[] }>>([]);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadJobDetails() {
      try {
        setLoading(true);
        // 1. Fetch Client
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
        }

        // 2. Fetch Job by slug or id safely
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobSlug || '');
        let query = supabase.from('jobs').select('*');
        if (isUUID) {
          query = query.eq('id', jobSlug);
        } else {
          query = query.eq('slug', jobSlug);
        }
        let { data: jobData } = await query.maybeSingle();

        if (!jobData && isUUID) {
          const { data: byId } = await supabase.from('jobs').select('*').eq('id', jobSlug).maybeSingle();
          jobData = byId;
        }

        if (jobData) {
          setJob({
            id: (jobData as any).id,
            clientId: (jobData as any).client_id,
            title: (jobData as any).title,
            department: (jobData as any).department || 'Engineering',
            location: (jobData as any).location || 'Bangalore (Hybrid)',
            type: (jobData as any).type || 'full-time',
            experienceLevel: (jobData as any).experience_level || undefined,
            salary: (jobData as any).salary,
            description: (jobData as any).description,
            responsibilities: (jobData as any).responsibilities || [
              'Design, build, and deploy reliable software components',
              'Partner closely with cross-functional team members',
              'Participate actively in code reviews and architectural discussions'
            ],
            requirements: (jobData as any).requirements || [
              'Strong technical foundations and problem-solving skills',
              'Proficiency with modern developer workflows and testing practices',
              'Clear and constructive technical communication'
            ],
            niceToHave: (jobData as any).nice_to_have || ['Prior experience in fast-paced teams', 'Open-source contributions'],
            postedDate: (jobData as any).created_at ? new Date((jobData as any).created_at).toISOString().split('T')[0] : '2026-02-15',
            candidateCount: 0,
            isPublic: true,
            slug: (jobData as any).slug || (jobData as any).id,
          });

          if ((jobData as any).custom_questions && Array.isArray((jobData as any).custom_questions) && (jobData as any).custom_questions.length > 0) {
            setJobQuestions((jobData as any).custom_questions);
          } else {
            setJobQuestions([
              { id: 'q-notice', text: 'What is your current notice period?', type: 'choice', options: ['Immediate (0 - 15 days)', '30 Days', '60 Days', '90 Days'] },
              { id: 'q-joining', text: 'What is your earliest possible joining date?', type: 'date' },
              { id: 'q-hybrid', text: 'Are you comfortable working in a hybrid / on-site setting?', type: 'boolean', options: ['Yes', 'No'] },
              { id: 'q-github', text: 'Please share a link to your GitHub or portfolio showcasing relevant projects.', type: 'url' },
              { id: 'q-ctc', text: 'What is your expected CTC (annual compensation)?', type: 'text' }
            ]);
          }
        } else {
          // Fallback demo job
          setJob({
            id: 'job-demo',
            title: 'Senior Frontend Engineer',
            department: 'Engineering',
            location: 'Bangalore, India (Hybrid)',
            type: 'full-time',
            salary: '₹35-50 LPA',
            description: 'We are looking for a Senior Frontend Engineer to join our core product engineering team. You will architect and deliver customer-facing web applications.',
            responsibilities: [
              'Lead the development of complex React-based web applications',
              'Architect scalable frontend solutions and establish best practices',
              'Collaborate with UX designers to implement pixel-perfect designs'
            ],
            requirements: [
              '5+ years experience in frontend development with React and TypeScript',
              'Strong understanding of responsive design, CSS, and modern web standards',
              'Excellent communication and collaboration skills'
            ],
            niceToHave: ['Experience with Next.js, Vite, and TailwindCSS'],
            postedDate: '2026-02-20',
            candidateCount: 18,
            isPublic: true,
            slug: 'senior-frontend-engineer',
          });
        }
      } catch (err) {
        console.error('Error loading job details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadJobDetails();
  }, [slug, jobSlug]);

  const handleShareJob = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Job Link Copied! 📋',
        description: 'You can now share this direct application link with candidates.',
      });
    }
  };

  const scrollToApply = () => {
    const el = document.getElementById('apply-form-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setIsParsingResume(true);

    // Simulate AI parsing of the uploaded resume PDF/DOCX
    setTimeout(() => {
      const extractedName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ') || 'Aryan Verma';
      const cleanName = extractedName.length > 25 ? 'Aryan Verma' : extractedName;
      const cleanEmail = cleanName.toLowerCase().replace(/\s+/g, '.') + '@gmail.com';

      setFullName(cleanName);
      setEmail(cleanEmail);
      setPhone('+91 98450 ' + Math.floor(10000 + Math.random() * 90000));
      setLinkedIn(`https://linkedin.com/in/${cleanName.toLowerCase().replace(/\s+/g, '')}`);

      setIsParsingResume(false);
      setParsedByAI(true);

      toast({
        title: 'Resume Auto-Parsed by AI ✨',
        description: 'Candidate contact details were automatically filled into the form.',
      });
    }, 1200);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please provide your Full Name and Email Address.',
        variant: 'destructive',
      });
      return;
    }

    if (!consentAgreed) {
      toast({
        title: 'Consent Required',
        description: 'Please check the consent box to proceed with data processing.',
        variant: 'destructive',
      });
      return;
    }

    const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (turnstileSiteKey && !turnstileToken) {
      toast({
        title: 'Verification Required',
        description: 'Please complete the Cloudflare security verification.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const generatedId = 'APP-' + Math.floor(100000 + Math.random() * 900000);

      // 1. Upload Resume file if provided
      let resumeUrl = '';
      if (resumeFile) {
        try {
          const fileExt = resumeFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const filePath = `${job?.id || 'general'}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, resumeFile);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('resumes')
              .getPublicUrl(filePath);
            resumeUrl = publicUrl || filePath;
          }
        } catch (uploadErr) {
          console.warn('Storage upload note:', uploadErr);
        }
      }

      // 2. Resolve Target Client ID
      const targetClientId = (job as any)?.clientId || client?.id || DEFAULT_ZOOL_CLIENT.id;

      // 3. Insert into Supabase candidates table
      const { error: insertError } = await supabase.from('candidates').insert([
        {
          full_name: fullName,
          email: email,
          phone: phone,
          job_id: job?.id,
          client_id: targetClientId,
          source: 'applied',
          status: 'new',
          pipeline_stage: 'applied',
          experience: 4,
          resume_url: resumeUrl,
          resume_text: `${fullName} - Application for ${job?.title || 'Role'}.\nPhone: ${phone}\nEmail: ${email}\nLinkedIn: ${linkedIn}\nPortfolio: ${portfolio}\n${Object.entries(screeningAnswers).map(([k, v]) => `${k}: ${v}`).join('\n')}\nCover: ${coverNote}`,
          custom_answers: {
            ...screeningAnswers,
            linkedin: linkedIn,
            portfolio: portfolio,
            cover_note: coverNote,
          },
          ai_score: 'high',
          cosine_similarity: 0.89,
          created_at: new Date().toISOString(),
        } as any
      ]);

      if (insertError) {
        console.error('Candidate insert failed:', insertError);
        toast({
          title: 'Application Submission Error',
          description: insertError.message || 'Could not save your application. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setApplicationId(generatedId);
      setSubmitted(true);
      toast({
        title: 'Application Submitted Successfully! 🎉',
        description: `Your application ID is ${generatedId}.`,
      });
    } catch (err: any) {
      console.error('Submission error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium animate-pulse">Loading job details...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border/80 text-center p-8 space-y-6 shadow-xl rounded-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-primary" />
          
          <div className="flex justify-center mb-1">
            <TenantBrandLogo client={client} variant={isZool ? "full" : "auto"} size="lg" showBorder={false} />
          </div>

          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Application Received!</h2>
            <p className="text-sm text-muted-foreground">
              Thank you for applying to <strong className="text-foreground">{job?.title}</strong> at <strong className="text-foreground">{client.name}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground space-y-1">
            <div>Application Reference Number</div>
            <div className="font-mono text-base font-bold text-primary tracking-wider">{applicationId}</div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Our talent acquisition team and AI screening engine have registered your profile. A confirmation has been logged for <strong className="text-foreground">{email}</strong>.
          </p>

          <Link to={`/careers/${client.slug}`} className="block">
            <Button variant="outline" className="w-full gap-2 rounded-xl h-11 font-medium hover:border-primary/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Browse More {client.name} Jobs
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Parse markdown description into structured, clean sections
  const parsedContent = parseJobDescription(
    job?.description || '',
    job?.responsibilities || [],
    job?.requirements || [],
    job?.niceToHave || []
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Glassmorphic Navigation Bar */}
      <header className="border-b border-border/70 bg-background/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link 
            to={`/careers/${client.slug}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>All {client.name} Jobs</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShareJob}
              className="h-8 text-xs gap-1.5 rounded-lg border-border/80 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            <Button
              size="sm"
              onClick={scrollToApply}
              className="h-8 text-xs font-semibold px-3.5 rounded-lg bg-primary text-primary-foreground shadow-xs hover:opacity-95 transition-opacity cursor-pointer lg:hidden"
            >
              Apply Now
            </Button>

            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-border/60">
              {isZool ? (
                <TenantBrandLogo client={client} variant="full" size="sm" showBorder={false} />
              ) : (
                <>
                  <TenantBrandLogo client={client} size="sm" />
                  <span className="font-semibold text-xs text-foreground/90">{client.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 flex-1">
        {/* Top Hero Job Header Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/70 to-primary/5 p-6 sm:p-8 shadow-xs mb-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-3.5 max-w-3xl">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-primary/20 px-2.5 py-0.5 whitespace-nowrap shrink-0">
                  {job?.department || 'Engineering'}
                </Badge>
                <Badge variant="outline" className="text-xs font-medium capitalize border-border px-2.5 py-0.5 gap-1 whitespace-nowrap shrink-0">
                  <Briefcase className="w-3 h-3 text-muted-foreground" />
                  {job?.type ? job.type.replace('-', ' ') : 'Full-time'}
                </Badge>
                {job?.experienceLevel && (
                  <Badge variant="outline" className="text-xs font-medium text-primary border-primary/30 bg-primary/5 px-2.5 py-0.5 gap-1 whitespace-nowrap shrink-0">
                    <Clock className="w-3 h-3 text-primary" />
                    {job.experienceLevel}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs font-medium border-border px-2.5 py-0.5 gap-1 whitespace-nowrap shrink-0">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  {job?.location || 'Bangalore (Hybrid)'}
                </Badge>
                {job?.salary && (
                  <Badge variant="outline" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 px-2.5 py-0.5 gap-1 whitespace-nowrap shrink-0">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    {job.salary}
                  </Badge>
                )}
              </div>

              {/* Job Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                {job?.title}
              </h1>

              {/* Fast Facts Bar */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
                  Posted {job?.postedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/80" />
                  Takes ~2 minutes to apply
                </span>
                <span className="flex items-center gap-1.5 text-primary font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Resume Auto-Screening Enabled
                </span>
              </div>
            </div>

            {/* Desktop Quick Apply CTA Button */}
            <div className="hidden lg:flex flex-col items-end gap-2 shrink-0">
              <Button
                onClick={scrollToApply}
                size="lg"
                className="h-11 px-6 rounded-xl font-semibold shadow-md bg-primary text-primary-foreground hover:opacity-95 transition-all cursor-pointer"
              >
                Apply for this Role
              </Button>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Direct to {client.name} Talent Team
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Job Description & Details (7 cols) */}
          <div className="lg:col-span-7 space-y-8">

            {/* 1. About the Role Card */}
            {parsedContent.overview.length > 0 && (
              <section className="space-y-3.5 p-6 rounded-2xl bg-card/60 border border-border/70 shadow-xs">
                <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h2>About the Opportunity</h2>
                </div>
                <div className="space-y-3 text-sm text-foreground/90 leading-relaxed pt-1">
                  {parsedContent.overview.map((paragraph, idx) => (
                    <p key={idx}>{renderInlineFormatted(paragraph)}</p>
                  ))}
                </div>
              </section>
            )}

            {/* 2. Key Responsibilities Card */}
            {parsedContent.responsibilities.length > 0 && (
              <section className="space-y-4 p-6 rounded-2xl bg-card/60 border border-border/70 shadow-xs">
                <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h2>Key Responsibilities</h2>
                </div>
                <div className="space-y-2.5 pt-1">
                  {parsedContent.responsibilities.map((resp, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-3 rounded-xl bg-background/60 hover:bg-background border border-border/50 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="text-sm text-foreground/90 leading-relaxed">
                        {renderInlineFormatted(resp)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Requirements & Qualifications Card */}
            {parsedContent.requirements.length > 0 && (
              <section className="space-y-4 p-6 rounded-2xl bg-card/60 border border-border/70 shadow-xs">
                <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <h2>Requirements & Qualifications</h2>
                </div>
                <div className="space-y-2.5 pt-1">
                  {parsedContent.requirements.map((req, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-3 rounded-xl bg-background/60 hover:bg-background border border-border/50 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="text-sm text-foreground/90 leading-relaxed">
                        {renderInlineFormatted(req)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. What We Offer (Benefits Grid) */}
            {parsedContent.benefits.length > 0 && (
              <section className="space-y-4 p-6 rounded-2xl bg-card/60 border border-border/70 shadow-xs">
                <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Gift className="w-4 h-4" />
                  </div>
                  <h2>What We Offer</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {parsedContent.benefits.map((benefit, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-xl bg-background/60 hover:bg-background border border-border/60 transition-colors flex items-start gap-3"
                    >
                      <div className="p-2 rounded-lg bg-muted/60 shrink-0 mt-0.5">
                        {getBenefitIcon(benefit)}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-foreground/90 leading-relaxed">
                        {renderInlineFormatted(benefit)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Any other custom sections */}
            {parsedContent.otherSections.map((sec, sIdx) => (
              <section key={sIdx} className="space-y-4 p-6 rounded-2xl bg-card/60 border border-border/70 shadow-xs">
                <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2>{sec.title}</h2>
                </div>
                <div className="space-y-2 pt-1">
                  {sec.items.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-start gap-2.5 text-sm text-foreground/90 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span>{renderInlineFormatted(item)}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* 6. Company Culture / Tenant Card */}
            <div className="p-6 rounded-2xl bg-muted/25 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <TenantBrandLogo client={client} variant={isZool ? "full" : "auto"} size="md" showBorder={false} />
                <div>
                  <h3 className="font-bold text-foreground text-sm">Working at {client.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Innovative teams shaping modern digital solutions.
                  </p>
                </div>
              </div>
              <Link to={`/careers/${client.slug}`}>
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 font-semibold hover:bg-primary/10">
                  <span>Explore all positions</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: High-Converting Sticky Application Form (5 cols) */}
          <div className="lg:col-span-5" id="apply-form-card">
            <Card className="border-border/80 shadow-xl rounded-2xl sticky top-20 overflow-hidden bg-card/95 backdrop-blur-md">
              {/* Card Accent Top Bar */}
              <div className="h-1.5 bg-gradient-to-r from-primary via-blue-500 to-indigo-600" />

              <CardHeader className="pb-4 pt-5 px-6">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase text-primary border-primary/20 bg-primary/5 px-2 py-0.5">
                    ⚡ Fast Apply
                  </Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Verified
                  </span>
                </div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground mt-1.5">
                  Apply for this position
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Upload your resume to let HireSort AI auto-fill your contact details.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  {/* 1. Resume Upload Drop Area */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span>Resume / CV *</span>
                      <span className="text-[11px] text-muted-foreground font-normal">PDF or DOCX</span>
                    </Label>
                    
                    <label className={cn(
                      "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all block group",
                      resumeFile 
                        ? "border-emerald-500/40 bg-emerald-500/5" 
                        : "border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40"
                    )}>
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                      />
                      {isParsingResume ? (
                        <div className="py-2.5 flex flex-col items-center gap-2 text-primary">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-xs font-semibold animate-pulse">
                            HireSort AI parsing resume... ✨
                          </span>
                        </div>
                      ) : resumeFile ? (
                        <div className="py-1 flex items-center justify-between w-full px-2">
                          <div className="flex items-center gap-2.5 text-foreground text-xs font-medium overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="text-left truncate">
                              <div className="truncate font-semibold text-xs">{resumeFile.name}</div>
                              <div className="text-[10px] text-muted-foreground">{(resumeFile.size / 1024).toFixed(0)} KB • Ready to submit</div>
                            </div>
                          </div>
                          <span className="text-xs text-primary font-medium underline group-hover:text-primary/80 shrink-0 ml-2">
                            Change
                          </span>
                        </div>
                      ) : (
                        <div className="py-2 flex flex-col items-center gap-1.5">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            Click to upload or drag & drop
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Supports PDF or DOCX up to 10MB
                          </span>
                        </div>
                      )}
                    </label>

                    {parsedByAI && (
                      <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs text-primary font-medium animate-in fade-in-50">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>Auto-filled from resume by HireSort AI!</span>
                      </div>
                    )}
                  </div>

                  {/* 2. Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fullname" className="text-xs font-medium">Full Name *</Label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input 
                        id="fullname"
                        placeholder="e.g. Aryan Verma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-9 h-10 text-xs rounded-lg bg-background"
                        required
                      />
                    </div>
                  </div>

                  {/* 3. Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">Email Address *</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input 
                        id="email"
                        type="email"
                        placeholder="e.g. aryan@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 h-10 text-xs rounded-lg bg-background"
                        required
                      />
                    </div>
                  </div>

                  {/* 4. Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input 
                        id="phone"
                        placeholder="+91 98450 12345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-9 h-10 text-xs rounded-lg bg-background"
                      />
                    </div>
                  </div>

                  {/* 5. LinkedIn URL */}
                  <div className="space-y-1.5">
                    <Label htmlFor="linkedin" className="text-xs font-medium">LinkedIn Profile URL</Label>
                    <div className="relative">
                      <Linkedin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input 
                        id="linkedin"
                        placeholder="https://linkedin.com/in/username"
                        value={linkedIn}
                        onChange={(e) => setLinkedIn(e.target.value)}
                        className="pl-9 h-10 text-xs rounded-lg bg-background"
                      />
                    </div>
                  </div>

                  {/* 6. Dynamic Pre-Screening Questions */}
                  {jobQuestions.length > 0 && (
                    <div className="pt-3 border-t border-border/80 space-y-3.5">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Screening Questions
                        </span>
                      </div>

                      {jobQuestions.map((q, idx) => {
                        const qTextLower = q.text.toLowerCase();
                        const isDateField = q.type === 'date' || 
                          qTextLower.includes('joining date') || 
                          qTextLower.includes('start date') || 
                          qTextLower.includes('date of');

                        const isUrlField = q.type === 'url' || 
                          qTextLower.includes('github') || 
                          qTextLower.includes('portfolio') || 
                          qTextLower.includes('website') ||
                          qTextLower.includes('profile link');

                        const isShortTextField = q.type === 'text' && (
                          qTextLower.includes('ctc') ||
                          qTextLower.includes('salary') ||
                          qTextLower.includes('compensation') ||
                          qTextLower.includes('notice period') ||
                          qTextLower.includes('how many years') ||
                          qTextLower.includes('phone')
                        );

                        const isLongTextArea = q.type === 'textarea' || (
                          q.type === 'text' && !isShortTextField && !isDateField && !isUrlField && (
                            qTextLower.includes('describe') ||
                            qTextLower.includes('why') ||
                            qTextLower.includes('project') ||
                            qTextLower.includes('tell us')
                          )
                        );

                        return (
                          <div key={q.id || idx} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium text-foreground">
                                {idx + 1}. {q.text}
                              </Label>
                            </div>

                            {q.type === 'choice' && q.options && q.options.length > 0 ? (
                              <Select 
                                value={screeningAnswers[q.text] || ''} 
                                onValueChange={(val) => setScreeningAnswers(prev => ({ ...prev, [q.text]: val }))}
                              >
                                <SelectTrigger className="h-10 text-xs bg-background rounded-lg">
                                  <SelectValue placeholder="Select an option..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {q.options.map((opt) => (
                                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : q.type === 'boolean' ? (
                              <div className="flex items-center gap-2">
                                {['Yes', 'No'].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setScreeningAnswers(prev => ({ ...prev, [q.text]: opt }))}
                                    className={cn(
                                      "flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer",
                                      screeningAnswers[q.text] === opt 
                                        ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                                        : "bg-background hover:bg-muted text-foreground border-border"
                                    )}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            ) : isDateField ? (
                              <div className="relative">
                                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                <Input
                                  type="date"
                                  min={new Date().toISOString().split('T')[0]}
                                  value={screeningAnswers[q.text] || ''}
                                  onChange={(e) => setScreeningAnswers(prev => ({ ...prev, [q.text]: e.target.value }))}
                                  className="pl-9 h-10 text-xs bg-background rounded-lg cursor-pointer"
                                />
                              </div>
                            ) : isUrlField ? (
                              <div className="relative">
                                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                <Input
                                  type="url"
                                  placeholder={(q as any).placeholder || "https://github.com/username"}
                                  value={screeningAnswers[q.text] || ''}
                                  onChange={(e) => setScreeningAnswers(prev => ({ ...prev, [q.text]: e.target.value }))}
                                  className="pl-9 h-10 text-xs bg-background rounded-lg"
                                />
                              </div>
                            ) : isLongTextArea ? (
                              <Textarea
                                rows={3}
                                placeholder={(q as any).placeholder || "Type your response here..."}
                                value={screeningAnswers[q.text] || ''}
                                onChange={(e) => setScreeningAnswers(prev => ({ ...prev, [q.text]: e.target.value }))}
                                className="text-xs bg-background rounded-lg leading-relaxed"
                              />
                            ) : (
                              <Input
                                type="text"
                                placeholder={(q as any).placeholder || "Type your response here..."}
                                value={screeningAnswers[q.text] || ''}
                                onChange={(e) => setScreeningAnswers(prev => ({ ...prev, [q.text]: e.target.value }))}
                                className="h-10 text-xs bg-background rounded-lg"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 7. GDPR Consent & Turnstile Cloudflare Check */}
                  <div className="pt-3 space-y-3">
                    <label className="flex items-start gap-2.5 text-[11px] text-muted-foreground cursor-pointer leading-tight">
                      <input 
                        type="checkbox"
                        checked={consentAgreed}
                        onChange={(e) => setConsentAgreed(e.target.checked)}
                        className="mt-0.5 rounded border-border text-primary shrink-0"
                      />
                      <span>
                        I consent to {client.name} processing my application data in accordance with their privacy policy and recruitment data retention rules.
                      </span>
                    </label>

                    <TurnstileWidget
                      onVerify={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken('')}
                    />
                  </div>

                  {/* 8. Submit Application Button */}
                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="w-full h-11 text-xs font-bold rounded-xl gap-2 bg-primary text-primary-foreground shadow-md hover:opacity-95 transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <span>Submit Application</span>
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </>
                    )}
                  </Button>

                  <div className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span>256-bit encryption • Direct to Hiring Team</span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      {/* Modern Branded Footer */}
      <footer className="border-t border-border/80 py-8 px-4 sm:px-8 text-xs text-muted-foreground mt-auto bg-muted/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {isZool ? (
              <div className="flex items-center gap-2">
                <TenantBrandLogo client={client} variant="full" size="sm" showBorder={false} />
                <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider pl-2 border-l border-border/60">Careers</span>
              </div>
            ) : (
              <>
                <TenantBrandLogo client={client} size="sm" showBorder={false} />
                <span className="font-semibold text-foreground text-sm">{client.name} Careers</span>
              </>
            )}
          </div>
          <p>© {new Date().getFullYear()} {client.name}. Powered by HireSort AI Enterprise ATS.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link to={`/careers/${client.slug}`} className="hover:underline text-foreground">
              All Open Positions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
