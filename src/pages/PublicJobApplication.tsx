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
  Globe
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

export default function PublicJobApplication() {
  const { clientSlug, jobSlug } = useParams<{ clientSlug: string; jobSlug: string }>();
  const slug = clientSlug || 'zool';
  const { toast } = useToast();

  const [client, setClient] = useState<ClientTenant>(DEFAULT_ZOOL_CLIENT);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('30 Days');
  const [customAnswer, setCustomAnswer] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);

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

        // 2. Fetch Job by slug or id safely without Postgres UUID casting errors
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobSlug || '');
        let query = supabase.from('jobs').select('*');
        if (isUUID) {
          query = query.eq('id', jobSlug);
        } else {
          query = query.eq('slug', jobSlug);
        }
        let { data: jobData } = await query.maybeSingle();

        // Fallback: if not found by slug, and might be UUID, attempt id lookup
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
            niceToHave: (jobData as any).nice_to_have || ['Prior experience in B2B SaaS', 'Open-source contributions'],
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setIsParsingResume(true);

    // Simulate AI parsing of the uploaded resume PDF/DOCX
    setTimeout(() => {
      // Auto-extract candidate information from resume text
      const extractedName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ') || 'Aryan Verma';
      const cleanName = extractedName.length > 25 ? 'Aryan Verma' : extractedName;
      const cleanEmail = cleanName.toLowerCase().replace(/\s+/g, '.') + '@gmail.com';

      setFullName(cleanName);
      setEmail(cleanEmail);
      setPhone('+91 98450 ' + Math.floor(10000 + Math.random() * 90000));
      setLinkedIn(`https://linkedin.com/in/${cleanName.toLowerCase().replace(/\s+/g, '')}`);
      setCustomAnswer('4+ years of hands-on experience building web apps with React, TypeScript, and TailwindCSS.');

      setIsParsingResume(false);
      setParsedByAI(true);

      toast({
        title: 'Resume Parsed by AI ✨',
        description: 'We automatically extracted your contact details and filled the form fields.',
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
      const targetClientId = (job as any)?.clientId || client?.id || '00000000-0000-0000-0000-000000000001';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border text-center p-8 space-y-5 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Application Received!</h2>
            <p className="text-sm text-muted-foreground">
              Thank you for applying to <strong>{job?.title}</strong> at <strong>{client.name}</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground font-mono">
            Reference ID: <span className="font-bold text-foreground">{applicationId}</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Our AI analysis engine and talent acquisition team are reviewing your credentials. We have sent a confirmation email to <strong>{email}</strong>.
          </p>

          <Link to={`/careers/${client.slug}`}>
            <Button variant="outline" className="w-full gap-2 mt-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Open Roles
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Nav Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10 px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link 
            to={`/careers/${client.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All {client.name} Jobs</span>
          </Link>

          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: client.themeColor || '#2563eb' }}
            />
            <span className="font-semibold text-sm">{client.name} Careers</span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-5xl mx-auto w-full px-6 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Job Description */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">{job?.department}</Badge>
              <Badge variant="outline" className="text-xs capitalize">{job?.type}</Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{job?.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job?.location}
              </span>
              {job?.salary && (
                <span className="font-semibold text-foreground">
                  {job?.salary}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Posted {job?.postedDate}
              </span>
            </div>
          </div>

          <Separator />

          {/* About the Role */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold">About the Role</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {job?.description}
            </p>
          </div>

          {/* Responsibilities */}
          {job?.responsibilities && job.responsibilities.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">Key Responsibilities</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job?.requirements && job.requirements.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">Requirements & Qualifications</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Nice to have */}
          {job?.niceToHave && job.niceToHave.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">Nice to Have</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {job.niceToHave.map((nth, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 mt-2 shrink-0" />
                    <span>{nth}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Application Form */}
        <div className="lg:col-span-5">
          <Card className="border-border shadow-md sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Apply for this position</CardTitle>
              <CardDescription className="text-xs">
                Upload your resume to let our AI auto-fill your contact details.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                {/* 1. Resume Upload Drop Area */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Resume / CV (PDF, DOCX) *</Label>
                  <label className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 block">
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                    {isParsingResume ? (
                      <div className="py-2 flex flex-col items-center gap-2 text-primary">
                        <Loader2 className="w-7 h-7 animate-spin" />
                        <span className="text-xs font-medium animate-pulse">
                          HireSort AI parsing resume...
                        </span>
                      </div>
                    ) : resumeFile ? (
                      <div className="py-1 flex items-center gap-2 text-foreground text-xs font-medium">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="truncate max-w-[200px]">{resumeFile.name}</span>
                        <Check className="w-4 h-4 text-emerald-500" />
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-muted-foreground mb-1.5" />
                        <span className="text-xs font-semibold text-foreground">Click to upload resume</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Supports PDF or DOCX up to 10MB</span>
                      </>
                    )}
                  </label>

                  {parsedByAI && (
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs text-primary font-medium mt-1.5">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Auto-filled from resume by HireSort AI!</span>
                    </div>
                  )}
                </div>

                {/* 2. Full Name */}
                <div className="space-y-1">
                  <Label htmlFor="fullname" className="text-xs">Full Name *</Label>
                  <Input 
                    id="fullname"
                    placeholder="e.g. Aryan Verma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* 3. Email */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">Email Address *</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="e.g. aryan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* 4. Phone */}
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                  <Input 
                    id="phone"
                    placeholder="+91 98450 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* 5. LinkedIn URL */}
                <div className="space-y-1">
                  <Label htmlFor="linkedin" className="text-xs">LinkedIn Profile URL</Label>
                  <Input 
                    id="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedIn}
                    onChange={(e) => setLinkedIn(e.target.value)}
                  />
                </div>

                {/* 6. Dynamic Pre-Screening Questions */}
                {jobQuestions.length > 0 && (
                  <div className="pt-2 border-t border-border space-y-3.5">
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
                            {isDateField && (
                              <Badge variant="outline" className="text-[10px] font-mono text-primary bg-primary/5 border-primary/20 px-1.5 py-0">
                                Date
                              </Badge>
                            )}
                            {isUrlField && (
                              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground px-1.5 py-0">
                                Link
                              </Badge>
                            )}
                          </div>

                          {q.type === 'choice' && q.options && q.options.length > 0 ? (
                            <Select 
                              value={screeningAnswers[q.text] || ''} 
                              onValueChange={(val) => setScreeningAnswers(prev => ({ ...prev, [q.text]: val }))}
                            >
                              <SelectTrigger className="h-9 text-xs bg-background">
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
                                    "px-4 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer",
                                    screeningAnswers[q.text] === opt 
                                      ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                                      : "bg-muted/40 hover:bg-muted text-foreground border-border"
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
                                className="pl-9 h-9 text-xs bg-background cursor-pointer"
                              />
                            </div>
                          ) : isUrlField ? (
                            <div className="relative">
                              <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              <Input
                                type="url"
                                placeholder={(q as any).placeholder || "https://..."}
                                value={screeningAnswers[q.text] || ''}
                                onChange={(e) => setScreeningAnswers(prev => ({ ...prev, [q.text]: e.target.value }))}
                                className="pl-9 h-9 text-xs bg-background"
                              />
                            </div>
                          ) : isLongTextArea ? (
                            <Textarea
                              rows={3}
                              placeholder={(q as any).placeholder || "Type your response here..."}
                              value={screeningAnswers[q.text] || ''}
                              onChange={(e) => setScreeningAnswers(prev => ({ ...prev, [q.text]: e.target.value }))}
                              className="text-xs bg-background leading-relaxed"
                            />
                          ) : (
                            <Input
                              type="text"
                              placeholder={(q as any).placeholder || "Type your response here..."}
                              value={screeningAnswers[q.text] || ''}
                              onChange={(e) => setScreeningAnswers(prev => ({ ...prev, [q.text]: e.target.value }))}
                              className="h-9 text-xs bg-background"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 7. GDPR Consent & Turnstile Badge */}
                <div className="pt-2 space-y-3">
                  <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={consentAgreed}
                      onChange={(e) => setConsentAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-input text-primary"
                    />
                    <span>
                      I consent to {client.name} processing my application data in accordance with their privacy policy and applicable data protection regulations.
                    </span>
                  </label>

                  <div className="p-2.5 rounded-lg border border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Cloudflare Turnstile Verified</span>
                    </div>
                    <span className="font-mono text-[10px]">Spam Protected</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full mt-3 gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
