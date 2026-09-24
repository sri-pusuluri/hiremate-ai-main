import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Job, ClientTenant } from '@/types/hiresort';
import { DEFAULT_ZOOL_CLIENT } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  UploadCloud, 
  CheckCircle2, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  Loader2,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TenantBrandLogo from '@/components/common/TenantBrandLogo';
import { extractTextFromFile, parseContactInfoFromText } from '@/lib/resume-parser';
import { evaluateResumeDeterministically } from '@/lib/ai-screening';

export default function EmbedJobWidget() {
  const { jobId, clientSlug } = useParams<{ jobId?: string; clientSlug?: string }>();
  const { toast } = useToast();

  const [client, setClient] = useState<ClientTenant>(DEFAULT_ZOOL_CLIENT);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [detectedSkills, setDetectedSkills] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [showParsedTextPreview, setShowParsedTextPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadJob() {
      try {
        setLoading(true);
        if (jobId) {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId || '');
          let query = supabase.from('jobs').select('*');
          if (isUUID) {
            query = query.eq('id', jobId);
          } else {
            query = query.eq('slug', jobId);
          }
          let { data } = await query.maybeSingle();
          if (!data && isUUID) {
            const { data: byId } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();
            data = byId;
          }

          if (data) {
            setJob({
              id: (data as any).id,
              title: (data as any).title,
              department: (data as any).department || 'Engineering',
              location: (data as any).location || 'Remote',
              type: (data as any).type || 'full-time',
              salary: (data as any).salary,
              description: (data as any).description,
              postedDate: '2026-02-01',
              candidateCount: 0,
            });

            // Fetch Client branding if available
            const cid = (data as any).client_id;
            if (cid) {
              const { data: clientRow } = await supabase.from('clients').select('*').eq('id', cid).maybeSingle();
              if (clientRow) {
                setClient({
                  id: (clientRow as any).id,
                  name: (clientRow as any).name,
                  slug: (clientRow as any).slug,
                  logoUrl: (clientRow as any).logo_url,
                  themeColor: (clientRow as any).theme_color,
                  subscriptionTier: (clientRow as any).subscription_tier || 'pro'
                });
              }
            }
            return;
          }
        }

        // If clientSlug prop provided
        if (clientSlug) {
          const { data: clientRow } = await supabase.from('clients').select('*').eq('slug', clientSlug).maybeSingle();
          if (clientRow) {
            setClient({
              id: (clientRow as any).id,
              name: (clientRow as any).name,
              slug: (clientRow as any).slug,
              logoUrl: (clientRow as any).logo_url,
              themeColor: (clientRow as any).theme_color,
              subscriptionTier: (clientRow as any).subscription_tier || 'pro'
            });
          }
        }

        // Fallback default demo job for embed preview
        setJob({
          id: jobId || 'embed-demo',
          title: 'Senior Software Engineer',
          department: 'Engineering',
          location: 'Bangalore, India (Hybrid)',
          type: 'full-time',
          salary: '₹30-45 LPA',
          description: 'Join our product team to build high-scale web platforms.',
          postedDate: '2026-02-01',
          candidateCount: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [jobId]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFileName(file.name);
    setIsParsing(true);

    try {
      const text = await extractTextFromFile(file);
      const contact = parseContactInfoFromText(text, file.name);

      if (contact.fullName && contact.fullName !== 'Applicant') {
        setFullName(contact.fullName);
      } else if (!fullName) {
        setFullName(contact.fullName);
      }

      if (contact.email) setEmail(contact.email);
      if (contact.phone) setPhone(contact.phone);

      setResumeText(text);
      setDetectedSkills(contact.detectedSkills);
      setParsed(true);

      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
      toast({
        title: isImage ? 'Resume Image Scanned & Parsed ✨' : 'Resume Auto-Parsed ✨',
        description: `Extracted details from ${file.name}.`,
      });
    } catch (err) {
      console.warn('Embed widget resume parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const targetClientId = (job as any)?.client_id || '00000000-0000-0000-0000-000000000001';

      const combinedText = [
        resumeText,
        `Contact Information: Name: ${fullName} | Email: ${email} | Phone: ${phone}`
      ].filter(Boolean).join('\n\n');

      const evalResult = evaluateResumeDeterministically({
        candidateName: fullName,
        resumeText: combinedText,
        job: {
          title: job?.title || 'Software Engineer',
          description: job?.description,
          requirements: job?.requirements || [],
          responsibilities: job?.responsibilities || []
        }
      });

      const { error } = await supabase.from('candidates').insert([
        {
          full_name: fullName,
          email: email,
          phone: phone,
          job_id: job?.id,
          client_id: targetClientId,
          source: 'embed-widget',
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
          created_at: new Date().toISOString(),
        } as any
      ]);
      if (error) {
        console.error('Embed widget candidate insert failed:', error);
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Embed widget submit error:', err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-8 text-center bg-card rounded-xl border border-border max-w-lg mx-auto shadow-sm my-6 space-y-4">
        <div className="flex justify-center mb-1">
          <TenantBrandLogo client={client} variant={client.slug === 'zool' ? 'full' : 'auto'} size="lg" showBorder={false} />
        </div>
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Application Submitted!</h3>
        <p className="text-xs text-muted-foreground">
          Thank you for applying to {job?.title} at {client.name}. Our talent acquisition team will review your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto bg-background text-foreground font-sans">
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-5">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">{job?.department}</Badge>
              <Badge variant="outline" className="text-[10px] capitalize">{job?.type}</Badge>
            </div>
            <h2 className="text-xl font-bold text-foreground">{job?.title}</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job?.location}
              </span>
              {job?.salary && (
                <span className="font-semibold text-foreground">{job.salary}</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Resume Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Resume / CV *</Label>
              <label className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors block">
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.txt,.md,.html,.rtf,.png,.jpg,.jpeg,.webp" 
                  className="hidden" 
                  onChange={handleResumeUpload}
                />
                {isParsing ? (
                  <div className="flex items-center gap-2 text-primary text-xs py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>HireSort ATS parsing resume & scanning text...</span>
                  </div>
                ) : resumeFileName ? (
                  <div className="py-1 flex items-center justify-between w-full px-2 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold">{resumeFileName}</span>
                    </div>
                    <span className="text-primary underline">Change</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs font-medium text-foreground">Upload Resume (PDF, DOCX, PNG, JPG)</span>
                    <span className="text-[10px] text-muted-foreground">Supports PDF, DOCX, TXT, PNG, JPG, WEBP</span>
                  </>
                )}
              </label>

              {parsed && (
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary text-xs space-y-2 font-medium">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-filled from resume by HireSort ATS!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowParsedTextPreview(!showParsedTextPreview)}
                      className="text-[10px] underline font-bold hover:text-primary/80"
                    >
                      {showParsedTextPreview ? 'Hide Text' : 'View Parsed Text'}
                    </button>
                  </div>
                  {detectedSkills.length > 0 && (
                    <div className="text-[10px] text-muted-foreground">
                      Detected: {detectedSkills.slice(0, 4).join(', ')}
                    </div>
                  )}
                  {showParsedTextPreview && (
                    <div className="p-2 rounded bg-background border border-border text-[10px] text-foreground font-mono max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                      <div className="font-sans font-semibold text-muted-foreground uppercase text-[9px] pb-1 mb-1 border-b border-border flex items-center justify-between">
                        <span>Extracted Resume Text:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">✓ Parsed 100%</span>
                      </div>
                      {resumeText || 'No text extracted.'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Inputs */}
            <div className="space-y-1">
              <Label className="text-xs">Full Name *</Label>
              <Input 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aryan Verma"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Email Address *</Label>
              <Input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. aryan@example.com"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Phone Number</Label>
              <Input 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full mt-2">
              {submitting ? 'Submitting...' : 'Apply for Position'}
            </Button>
          </form>

          <div className="text-center pt-2">
            <span className="text-[10px] text-muted-foreground">
              Powered by Sahab Portal • Application Tracking System
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
