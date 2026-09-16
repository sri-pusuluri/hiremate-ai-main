import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Mail,
  Phone,
  User,
  Building2,
  Zap
} from 'lucide-react';
import { Job, Candidate } from '@/types/hiresort';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromFile, parseContactInfoFromText } from '@/lib/resume-parser';
import { evaluateResumeDeterministically } from '@/lib/ai-screening';
import { AIBadge } from '@/components/ui/ai-badges';

interface AddCandidateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetJob?: Job;
  availableJobs?: Job[];
  onCandidateAdded?: (candidate: any) => void;
}

export function AddCandidateModal({
  open,
  onOpenChange,
  targetJob,
  availableJobs = [],
  onCandidateAdded
}: AddCandidateModalProps) {
  const { toast } = useToast();

  const [selectedJobId, setSelectedJobId] = useState<string>(targetJob?.id || '');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  
  // Candidate form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [company, setCompany] = useState('');
  const [experience, setExperience] = useState<number>(3);
  const [resumeText, setResumeText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  // States
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedSkills, setDetectedSkills] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);

  // Sync selected job if targetJob changes
  useEffect(() => {
    if (targetJob?.id) {
      setSelectedJobId(targetJob.id);
    }
  }, [targetJob?.id]);

  const activeJob = availableJobs.find(j => j.id === selectedJobId) || targetJob;

  // Real-time ATS match calculation
  const atsPreview = React.useMemo(() => {
    if (!resumeText || resumeText.trim().length < 25 || !activeJob) {
      return null;
    }

    return evaluateResumeDeterministically({
      candidateName: fullName || 'Candidate',
      resumeText,
      job: {
        title: activeJob.title,
        description: activeJob.description,
        requirements: activeJob.requirements || [],
        responsibilities: activeJob.responsibilities || []
      }
    });
  }, [resumeText, activeJob, fullName]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsParsing(true);

    try {
      const text = await extractTextFromFile(file);
      const contact = parseContactInfoFromText(text, file.name);

      if (contact.fullName && contact.fullName !== 'Applicant') {
        setFullName(contact.fullName);
      }
      if (contact.email) setEmail(contact.email);
      if (contact.phone) setPhone(contact.phone);
      if (contact.roleTitle) setRoleTitle(contact.roleTitle);
      if (contact.company) setCompany(contact.company);
      if (contact.experienceYears) setExperience(contact.experienceYears);

      setResumeText(text);
      setDetectedSkills(contact.detectedSkills);
      setWordCount(contact.wordCount);

      // Auto-extract role title / company if not already detected
      if (!contact.roleTitle || !contact.company) {
        const roleMatch = text.match(/###?\s*([^|\n]+)\s*\|\s*([^\n]+)/);
        if (roleMatch) {
          if (!contact.roleTitle) setRoleTitle(roleMatch[1].trim());
          if (!contact.company) setCompany(roleMatch[2].trim().replace(/\*.*$/, ''));
        }
      }

      toast({
        title: 'Resume Extracted Successfully ✨',
        description: `Parsed ${contact.wordCount} words and identified ${contact.detectedSkills.length} domain skills.`,
      });
    } catch (err) {
      console.warn('Upload error:', err);
      toast({
        title: 'Parse Warning',
        description: 'Unable to extract text automatically. You can paste the resume text directly in the Paste tab.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteChange = (text: string) => {
    setResumeText(text);
    const contact = parseContactInfoFromText(text);
    if (contact.fullName && contact.fullName !== 'Applicant' && !fullName) {
      setFullName(contact.fullName);
    }
    if (contact.email && !email) setEmail(contact.email);
    if (contact.phone && !phone) setPhone(contact.phone);
    setDetectedSkills(contact.detectedSkills);
    setWordCount(contact.wordCount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast({
        title: 'Missing Required Fields',
        description: 'Candidate full name, email address, and phone number are required.',
        variant: 'destructive',
      });
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      toast({
        title: 'Invalid Email Address',
        description: 'Please enter a valid candidate email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!activeJob) {
      toast({
        title: 'No Job Selected',
        description: 'Please select a target job position for this candidate.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const targetClientId = (activeJob as any)?.clientId || (activeJob as any)?.client_id || '00000000-0000-0000-0000-000000000001';

      // Run ATS screening
      const evalResult = evaluateResumeDeterministically({
        candidateName: fullName,
        resumeText: resumeText || `Candidate ${fullName} - ${roleTitle || activeJob.title}`,
        job: {
          title: activeJob.title,
          description: activeJob.description,
          requirements: activeJob.requirements || [],
          responsibilities: activeJob.responsibilities || []
        }
      });

      const newCandidate = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        job_id: activeJob.id,
        client_id: targetClientId,
        source: 'recruiter-import',
        status: 'new',
        pipeline_stage: 'applied',
        experience: evalResult.experience || experience || 3,
        role_title: roleTitle.trim() || evalResult.currentRole || activeJob.title,
        company: company.trim() || evalResult.company || 'Independent',
        resume_text: resumeText || null,
        ai_score: evalResult.isUnprocessed ? null : evalResult.score,
        cosine_similarity: evalResult.isUnprocessed ? null : evalResult.similarity,
        matched_skills: evalResult.matchedSkills,
        missing_skills: evalResult.missingSkills,
        predictive_insights: {
          currentRole: roleTitle || evalResult.currentRole,
          company: company || evalResult.company,
          interviewPassProb: evalResult.interviewPassProb,
          offerAcceptanceProb: evalResult.offerAcceptanceProb,
          onboardingSuccessProb: evalResult.onboardingSuccessProb,
          retentionRisk: evalResult.retentionRisk,
          retentionRiskFactor: evalResult.retentionRiskFactor,
          timeToJoinEstimate: evalResult.timeToJoinEstimate,
          assessment: evalResult.assessment,
          evaluatedAt: new Date().toISOString(),
          isUnprocessed: evalResult.isUnprocessed
        },
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('candidates')
        .insert([newCandidate])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Candidate Added & Evaluated! 🎯',
        description: `${fullName} was added to ${activeJob.title} with a ${Math.round((evalResult.similarity || 0) * 100)}% match score.`,
      });

      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setRoleTitle('');
      setCompany('');
      setResumeText('');
      setUploadedFileName('');
      setDetectedSkills([]);

      onCandidateAdded?.(data || newCandidate);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to add candidate:', err);
      toast({
        title: 'Error Adding Candidate',
        description: err.message || 'An unexpected error occurred while saving the candidate.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Add Candidate & Evaluate ATS</DialogTitle>
                <DialogDescription className="text-xs">
                  Upload a resume or paste text to instantly extract details and compute honest ATS match scores.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {/* Target Job Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                Target Position *
              </Label>
              {availableJobs.length > 0 ? (
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="" disabled>Select an active position...</option>
                  {availableJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.department || 'Engineering'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-medium text-foreground p-2 rounded-lg bg-muted/40 border border-border">
                  {targetJob?.title || 'Active Role'}
                </div>
              )}
            </div>

            {/* Resume Ingestion Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'paste')} className="w-full">
              <TabsList className="grid grid-cols-2 h-9 p-1 bg-muted/60">
                <TabsTrigger value="upload" className="text-xs flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Resume File
                </TabsTrigger>
                <TabsTrigger value="paste" className="text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Paste Resume Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-3">
                <label className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors block">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.html,.rtf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {isParsing ? (
                    <div className="flex flex-col items-center gap-2 py-3 text-primary text-xs">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="font-semibold">Extracting text & contact details...</span>
                    </div>
                  ) : uploadedFileName ? (
                    <div className="flex items-center justify-between w-full px-2 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold">{uploadedFileName}</span>
                        <span className="text-[11px] text-muted-foreground">({wordCount} words)</span>
                      </div>
                      <span className="text-primary underline text-xs font-medium">Change File</span>
                    </div>
                  ) : (
                    <div className="py-2 flex flex-col items-center gap-1.5">
                      <UploadCloud className="w-6 h-6 text-muted-foreground mb-0.5" />
                      <span className="text-xs font-semibold text-foreground">
                        Drop resume file here (PDF, TXT, MD, DOCX)
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Auto-extracts Name, Email, Phone, and Skills instantly
                      </span>
                    </div>
                  )}
                </label>
              </TabsContent>

              <TabsContent value="paste" className="mt-3 space-y-1.5">
                <Textarea
                  placeholder="Paste raw resume text, markdown, or summary here..."
                  value={resumeText}
                  onChange={(e) => handlePasteChange(e.target.value)}
                  rows={4}
                  className="text-xs font-mono resize-y"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Pasting automatically triggers contact and skill detection</span>
                  <span>{wordCount} words</span>
                </div>
              </TabsContent>
            </Tabs>

            {/* Missing Contact Warning Notice */}
            {resumeText && (!email || !phone) && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                <span>⚠️ Please enter the candidate's {!email && !phone ? 'Email Address and Phone Number' : !email ? 'Email Address' : 'Phone Number'} below before saving.</span>
              </div>
            )}

            {/* Candidate Contact Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="c-name" className="text-xs font-semibold">Full Name *</Label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="c-name"
                    placeholder="e.g. Elena Rostova"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-8 h-8 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-email" className="text-xs font-semibold">Email Address *</Label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="c-email"
                    type="email"
                    placeholder="e.g. elena@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-8 h-8 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-phone" className="text-xs font-semibold">Phone Number *</Label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="c-phone"
                    placeholder="e.g. +91 63829 45643"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-8 h-8 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-role" className="text-xs font-semibold">Current / Target Role</Label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="c-role"
                    placeholder="e.g. Senior Frontend Architect"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Live ATS Fit Preview Card */}
            {atsPreview && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Live ATS Match Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">
                      {Math.round((atsPreview.similarity || 0) * 100)}% Match
                    </span>
                    <AIBadge score={atsPreview.score} />
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {atsPreview.assessment}
                </p>

                {atsPreview.matchedSkills.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Matched Skills ({atsPreview.matchedSkills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {atsPreview.matchedSkills.map((s, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono border border-emerald-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {atsPreview.missingSkills.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-rose-500">
                      Target Job Gaps ({atsPreview.missingSkills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {atsPreview.missingSkills.slice(0, 5).map((s, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-mono border border-rose-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/10 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !fullName.trim() || !email.trim()}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving & Screening...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Add to Job Pipeline
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
