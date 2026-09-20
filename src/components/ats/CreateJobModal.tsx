import { useState, useEffect } from 'react';
import { Job } from '@/types/hiresort';
import { useAuth, DEFAULT_ZOOL_CLIENT } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Briefcase, 
  Globe, 
  Sparkles, 
  Clock, 
  ListChecks, 
  Check, 
  Trash2, 
  BookOpen, 
  Library, 
  Pencil,
  User,
  UserCheck,
  MapPin
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ScreeningQuestion, SYSTEM_QUESTION_LIBRARY } from '@/lib/question-library';
import { QuestionLibraryModal } from './QuestionLibraryModal';
import { assembleJobDescription, parseJobMarkdown, normalizeJobType } from '@/lib/job-parser';
import { logAuditEvent } from '@/lib/audit-logger';
import { ALL_LOCATION_PRESETS } from '@/lib/location-presets';

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated?: (job: Job) => void;
  onJobUpdated?: (job: Job) => void;
  jobToEdit?: Job | null;
}

export function CreateJobModal({ 
  open, 
  onOpenChange, 
  onJobCreated, 
  onJobUpdated, 
  jobToEdit 
}: CreateJobModalProps) {
  const { client, clientId, user, isAdmin, isSuperAdmin, isClientAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const isEditMode = !!jobToEdit;

  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: 'Bangalore, India (Hybrid)',
    type: 'full-time' as 'full-time' | 'part-time' | 'contract',
    experienceLevel: '3-5 Years',
    salary: '₹25-40 LPA',
    description: '',
    isPublic: true,
  });

  const [activePeriod, setActivePeriod] = useState<'15' | '30' | '60' | '90' | 'custom' | 'unlimited'>('30');
  const [customExpiryDate, setCustomExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Attached screening questions for this job
  const [selectedQuestions, setSelectedQuestions] = useState<ScreeningQuestion[]>([]);
  
  // Workspace custom question bank
  const [customBankQuestions, setCustomBankQuestions] = useState<ScreeningQuestion[]>([]);
  
  // Question Library Modal dialog state
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  // Job Creator & Owner state
  const [availableCreators, setAvailableCreators] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('');

  // Load active workspace team members for job ownership assignment
  useEffect(() => {
    async function loadCreators() {
      try {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email');
        if (profiles && profiles.length > 0) {
          setAvailableCreators(profiles.map((p: any) => ({
            id: p.id,
            name: p.full_name || p.email?.split('@')[0] || 'Team Member',
            email: p.email || '',
          })));
        }
      } catch (e) {
        console.warn('Could not fetch profiles for job creator assignment:', e);
      }
    }
    if (open) {
      loadCreators();
    }
  }, [open]);

  // Quick custom question form state
  const [showAddCustomQuestion, setShowAddCustomQuestion] = useState(false);
  const [customQText, setCustomQText] = useState('');
  const [customQType, setCustomQType] = useState<'text' | 'textarea' | 'date' | 'url' | 'choice' | 'boolean'>('text');
  const [customQOptions, setCustomQOptions] = useState('');
  const [saveToBank, setSaveToBank] = useState(true);

  // Load custom questions from question_bank in Supabase
  useEffect(() => {
    async function loadBank() {
      try {
        let query = supabase.from('question_bank').select('*');
        if (clientId) {
          query = query.eq('client_id', clientId);
        }
        const { data } = await query;
        if (data && data.length > 0) {
          const mapped: ScreeningQuestion[] = data.map((q: any) => ({
            id: q.id,
            text: q.question_text,
            type: q.question_type,
            options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options)) : undefined,
            category: 'logistics',
            categoryLabel: 'Custom Workspace Question'
          }));
          setCustomBankQuestions(mapped);
        }
      } catch (e) {
        console.error("Error loading question bank:", e);
      }
    }
    if (open) {
      loadBank();
    }
  }, [open, clientId]);

  // Pre-fill form when opened or when jobToEdit changes
  useEffect(() => {
    if (!open) return;

    if (jobToEdit) {
      setSelectedCreatorId(jobToEdit.createdBy || user?.id || '');
      const fullDescription = assembleJobDescription(jobToEdit);
      setFormData({
        title: jobToEdit.title || '',
        department: jobToEdit.department || 'Engineering',
        location: jobToEdit.location || 'Remote',
        type: normalizeJobType(jobToEdit.type),
        experienceLevel: jobToEdit.experienceLevel || (jobToEdit as any).experience_level || '3-5 Years',
        salary: jobToEdit.salary || '',
        description: fullDescription,
        isPublic: jobToEdit.isPublic ?? true,
      });

      if (jobToEdit.expiresAt) {
        setActivePeriod('custom');
        setCustomExpiryDate(new Date(jobToEdit.expiresAt).toISOString().split('T')[0]);
      } else {
        setActivePeriod('unlimited');
      }

      // Map existing custom questions
      if (jobToEdit.customQuestions && Array.isArray(jobToEdit.customQuestions)) {
        const mappedQuestions: ScreeningQuestion[] = jobToEdit.customQuestions.map((q: any) => {
          const qText = q.question || q.text || '';
          let resolvedType = q.type || 'text';
          if (resolvedType === 'text' && (qText.toLowerCase().includes('joining date') || qText.toLowerCase().includes('start date'))) {
            resolvedType = 'date';
          }
          return {
            id: q.id || `q-${Math.random()}`,
            text: qText,
            type: resolvedType as any,
            options: q.options,
            required: q.required
          };
        });
        setSelectedQuestions(mappedQuestions);
      } else {
        setSelectedQuestions([]);
      }
    } else {
      // Create mode defaults: pre-select 4 standard questions from the system library
      setFormData({
        title: '',
        department: 'Engineering',
        location: 'Bangalore, India (Hybrid)',
        type: 'full-time',
        experienceLevel: '3-5 Years',
        salary: '₹25-40 LPA',
        description: '',
        isPublic: true,
      });
      setActivePeriod('30');
      // Default initial screening questions from library
      setSelectedQuestions([
        SYSTEM_QUESTION_LIBRARY[0], // Notice period (Choice)
        SYSTEM_QUESTION_LIBRARY[1], // Earliest joining date (Date)
        SYSTEM_QUESTION_LIBRARY[2], // Hybrid / onsite (Boolean)
        SYSTEM_QUESTION_LIBRARY[4], // Expected CTC (Text)
      ]);
    }
  }, [open, jobToEdit]);

  const handleSaveJob = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both a Job Title and Description.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let expiresAt: string | null = null;
      if (activePeriod === 'custom' && customExpiryDate) {
        expiresAt = new Date(`${customExpiryDate}T23:59:59Z`).toISOString();
      } else if (activePeriod !== 'unlimited') {
        const days = parseInt(activePeriod, 10);
        expiresAt = new Date(Date.now() + days * 86400000).toISOString();
      }

      const formattedQuestions = selectedQuestions.map(q => ({
        id: q.id,
        question: q.text,
        text: q.text,
        type: q.type,
        options: q.options,
        required: q.required ?? false
      }));

      const parsed = parseJobMarkdown(formData.description);

      if (isEditMode && jobToEdit) {
        // UPDATE EXISTING JOB
        const resolvedResponsibilities = parsed.responsibilities.length > 0 
          ? parsed.responsibilities 
          : (jobToEdit.responsibilities || []);
        const resolvedRequirements = parsed.requirements.length > 0 
          ? parsed.requirements 
          : (jobToEdit.requirements || []);
        const resolvedNiceToHave = parsed.niceToHave.length > 0 
          ? parsed.niceToHave 
          : (jobToEdit.niceToHave || []);

        const updatePayload = {
          title: formData.title,
          department: formData.department,
          location: formData.location,
          type: formData.type,
          experience_level: formData.experienceLevel || '3-5 Years',
          salary: formData.salary,
          description: formData.description,
          responsibilities: resolvedResponsibilities,
          requirements: resolvedRequirements,
          nice_to_have: resolvedNiceToHave,
          is_public: formData.isPublic,
          expires_at: expiresAt,
          custom_questions: formattedQuestions,
          created_by: selectedCreatorId || jobToEdit.createdBy || user?.id || null,
        };

        const { data, error } = await supabase
          .from('jobs')
          .update(updatePayload as any)
          .eq('id', jobToEdit.id)
          .select()
          .single();

        if (error) throw error;

        const updatedCreatorId = (data as any).created_by || selectedCreatorId || jobToEdit.createdBy || user?.id || null;
        const assignedCreator = availableCreators.find(c => c.id === updatedCreatorId);

        const updatedJob: Job = {
          ...jobToEdit,
          title: (data as any).title,
          department: (data as any).department,
          location: (data as any).location,
          type: (data as any).type,
          experienceLevel: (data as any).experience_level || formData.experienceLevel,
          salary: (data as any).salary,
          description: (data as any).description,
          responsibilities: (data as any).responsibilities || resolvedResponsibilities,
          requirements: (data as any).requirements || resolvedRequirements,
          niceToHave: (data as any).nice_to_have || resolvedNiceToHave,
          isPublic: (data as any).is_public,
          expiresAt: (data as any).expires_at || undefined,
          customQuestions: formattedQuestions as any,
          createdBy: updatedCreatorId,
          creatorName: assignedCreator?.name || jobToEdit.creatorName || (user?.id === updatedCreatorId ? (user.user_metadata?.full_name || user.email) : null),
          creatorEmail: assignedCreator?.email || jobToEdit.creatorEmail || (user?.id === updatedCreatorId ? user.email : null),
        };

        if (onJobUpdated) {
          onJobUpdated(updatedJob);
        }

        // Audit log job update
        logAuditEvent({
          clientId: (jobToEdit as any).client_id || client?.id || DEFAULT_ZOOL_CLIENT.id,
          clientName: client?.name || 'Workspace',
          userId: user?.id,
          userEmail: user?.email || 'admin@hiresort.ai',
          userRole: isSuperAdmin ? 'super_admin' : (isClientAdmin ? 'client_admin' : 'recruiter'),
          action: 'UPDATE_JOB',
          resourceType: 'job',
          resourceId: jobToEdit.id,
          details: {
            title: formData.title,
            department: formData.department,
            is_public: formData.isPublic,
            salary: formData.salary
          }
        }).catch(() => {});

        toast({
          title: 'Job Updated Successfully',
          description: `Changes to "${formData.title}" have been saved.`,
        });

        onOpenChange(false);
      } else {
        // CREATE NEW JOB
        const slug = formData.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') + `-${Math.random().toString(36).substring(2, 6)}`;

        const newJobRecord = {
          title: formData.title,
          department: formData.department,
          location: formData.location,
          type: formData.type,
          experience_level: formData.experienceLevel || '3-5 Years',
          salary: formData.salary,
          description: formData.description,
          is_public: formData.isPublic,
          slug: slug,
          client_id: (clientId && clientId !== 'hiresort-platform-hq') ? clientId : DEFAULT_ZOOL_CLIENT.id,
          created_by: selectedCreatorId || user?.id || null,
          hire_sort_enabled: true,
          ai_processing_status: 'idle',
          status: 'active',
          expires_at: expiresAt,
          custom_questions: formattedQuestions,
          responsibilities: parsed.responsibilities.length > 0 ? parsed.responsibilities : [
            'Lead feature development and technical design across the product stack',
            'Collaborate with product and design to craft intuitive, accessible UX',
            'Optimize code quality, automated tests, and CI/CD pipelines'
          ],
          requirements: parsed.requirements.length > 0 ? parsed.requirements : [
            '3+ years relevant engineering or domain experience',
            'Strong problem solving and cross-functional communication skills',
            'Proven track record delivering reliable, customer-facing applications'
          ],
          nice_to_have: parsed.niceToHave.length > 0 ? parsed.niceToHave : ['Experience with AI/LLM integrations', 'Contributions to open source']
        };

        const { data, error } = await supabase
          .from('jobs')
          .insert([newJobRecord as any])
          .select()
          .single();

        if (error) throw error;

        const newCreatorId = (data as any).created_by || selectedCreatorId || user?.id || null;
        const newCreator = availableCreators.find(c => c.id === newCreatorId);

        const createdJob: Job = {
          id: (data as any).id,
          title: (data as any).title,
          department: (data as any).department,
          location: (data as any).location,
          type: (data as any).type,
          experienceLevel: (data as any).experience_level || formData.experienceLevel,
          salary: (data as any).salary,
          description: (data as any).description,
          responsibilities: (data as any).responsibilities || [],
          requirements: (data as any).requirements || [],
          niceToHave: (data as any).nice_to_have || [],
          hireSortEnabled: true,
          status: (data as any).status || 'active',
          expiresAt: (data as any).expires_at || undefined,
          postedDate: new Date().toISOString().split('T')[0],
          candidateCount: 0,
          isPublic: (data as any).is_public,
          slug: (data as any).slug,
          customQuestions: formattedQuestions as any,
          createdBy: newCreatorId,
          creatorName: newCreator?.name || (user?.id === newCreatorId ? (user.user_metadata?.full_name || user.email) : 'You'),
          creatorEmail: newCreator?.email || (user?.id === newCreatorId ? user.email : null),
        };

        if (onJobCreated) {
          onJobCreated(createdJob);
        }

        // Audit log new job creation
        logAuditEvent({
          clientId: (clientId && clientId !== 'hiresort-platform-hq') ? clientId : DEFAULT_ZOOL_CLIENT.id,
          clientName: client?.name || 'Workspace',
          userId: user?.id,
          userEmail: user?.email || 'admin@hiresort.ai',
          userRole: isSuperAdmin ? 'super_admin' : (isClientAdmin ? 'client_admin' : 'recruiter'),
          action: 'CREATE_JOB',
          resourceType: 'job',
          resourceId: (data as any).id,
          details: {
            title: formData.title,
            department: formData.department,
            is_public: formData.isPublic,
            salary: formData.salary
          }
        }).catch(() => {});

        toast({
          title: 'Job Created',
          description: `${formData.title} has been created and is ready for candidates.`,
        });

        onOpenChange(false);
      }
    } catch (err: any) {
      console.error('Save job error:', err);
      toast({
        title: isEditMode ? 'Failed to update job' : 'Failed to create job',
        description: err.message || 'An error occurred while saving the job.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomQuestion = async () => {
    if (!customQText.trim()) return;

    const opts = customQType === 'choice' 
      ? customQOptions.split(',').map(s => s.trim()).filter(Boolean)
      : (customQType === 'boolean' ? ['Yes', 'No'] : undefined);

    const newQuestion: ScreeningQuestion = {
      id: `custom-${Date.now()}`,
      text: customQText.trim(),
      type: customQType,
      options: opts,
      category: 'logistics',
      categoryLabel: 'Custom Question'
    };

    setSelectedQuestions(prev => [...prev, newQuestion]);

    // Optionally save to Supabase question_bank for future reuse across this workspace
    if (saveToBank) {
      try {
        await supabase.from('question_bank').insert([{
          client_id: clientId || DEFAULT_ZOOL_CLIENT.id,
          question_text: customQText.trim(),
          question_type: customQType,
          options: opts || []
        }]);
        setCustomBankQuestions(prev => [...prev, newQuestion]);
        toast({
          title: 'Saved to Question Library',
          description: 'This question was also added to your Workspace Question Library for future jobs.',
        });
      } catch (e) {
        console.warn('Could not save to question_bank:', e);
      }
    }

    setCustomQText('');
    setCustomQOptions('');
    setShowAddCustomQuestion(false);
  };

  const removeQuestion = (idOrText: string) => {
    setSelectedQuestions(prev => prev.filter(q => (q.id || q.text) !== idOrText));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[92vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-4 pb-2 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {isEditMode ? <Pencil className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  {isEditMode ? `Edit Job: ${jobToEdit?.title}` : 'Create New Job Opening'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isEditMode
                    ? `Update posting details, compensation, screening questions, and visibility for ${client?.name || 'this workspace'}.`
                    : `Publish a new opening for ${client?.name || 'this workspace'} to start collecting and ranking applicants.`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {/* Row 1: Job Title (6 cols), Department (3 cols), Employment Type (3 cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-6 space-y-1">
                <Label htmlFor="job-title" className="text-xs font-medium">Job Title *</Label>
                <Input 
                  id="job-title"
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <Label htmlFor="job-dept" className="text-xs font-medium">Department</Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
                >
                  <SelectTrigger id="job-dept" className="h-8.5 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering" className="text-xs">Engineering</SelectItem>
                    <SelectItem value="Product & Design" className="text-xs">Product & Design</SelectItem>
                    <SelectItem value="Sales & Marketing" className="text-xs">Sales & Marketing</SelectItem>
                    <SelectItem value="Human Resources" className="text-xs">Human Resources</SelectItem>
                    <SelectItem value="Operations" className="text-xs">Operations</SelectItem>
                    <SelectItem value="Finance & Legal" className="text-xs">Finance & Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <Label htmlFor="job-type" className="text-xs font-medium">Employment Type</Label>
                <Select 
                  value={formData.type || 'full-time'} 
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, type: normalizeJobType(val) }))}
                >
                  <SelectTrigger id="job-type" className="h-8.5 text-xs bg-background">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time" className="text-xs">Full-Time</SelectItem>
                    <SelectItem value="part-time" className="text-xs">Part-Time</SelectItem>
                    <SelectItem value="contract" className="text-xs">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Location (6 cols wide with comprehensive auto-fill), Experience (3 cols), Compensation (3 cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Location with Global Autofill */}
              <div className="sm:col-span-6 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="job-location" className="text-xs font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    Location *
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Countries, states, cities autofill</span>
                </div>
                <div className="relative">
                  <Input 
                    id="job-location"
                    list="global-locations-datalist"
                    placeholder="e.g. Bangalore, Karnataka, India (Hybrid)"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="h-8.5 text-xs"
                  />
                  <datalist id="global-locations-datalist">
                    {ALL_LOCATION_PRESETS.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
                {/* Quick 1-click popular location pills */}
                <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none text-[10px]">
                  <span className="text-muted-foreground shrink-0 text-[10px]">Quick:</span>
                  {[
                    { label: 'Remote', value: 'Remote (Worldwide)' },
                    { label: 'Bangalore (Hybrid)', value: 'Bangalore, Karnataka, India (Hybrid)' },
                    { label: 'Hyderabad (Hybrid)', value: 'Hyderabad, Telangana, India (Hybrid)' },
                    { label: 'Pune (Hybrid)', value: 'Pune, Maharashtra, India (Hybrid)' },
                    { label: 'San Francisco', value: 'San Francisco, CA, United States (Hybrid)' },
                    { label: 'Dubai', value: 'Dubai, United Arab Emirates (Hybrid)' },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, location: p.value }))}
                      className="px-1.5 py-0.5 rounded bg-muted/70 hover:bg-primary/10 hover:text-primary transition-colors shrink-0 text-[10px] text-muted-foreground border border-border/50"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="sm:col-span-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="job-experience" className="text-xs font-medium">Experience *</Label>
                  <span className="text-[10px] text-muted-foreground font-mono">3-5 Yrs</span>
                </div>
                <Input 
                  id="job-experience"
                  list="experience-presets"
                  placeholder="e.g. 3-5 Years"
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                  className="h-8.5 text-xs"
                />
                <datalist id="experience-presets">
                  <option value="Fresher / Entry Level" />
                  <option value="1-3 Years" />
                  <option value="3-5 Years" />
                  <option value="5-8 Years" />
                  <option value="8+ Years (Lead / Staff)" />
                </datalist>
              </div>

              {/* Target Compensation */}
              <div className="sm:col-span-3 space-y-1">
                <Label htmlFor="job-salary" className="text-xs font-medium">Target Compensation</Label>
                <Input 
                  id="job-salary"
                  placeholder="e.g. ₹25-40 LPA"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                  className="h-8.5 text-xs"
                />
              </div>
            </div>

            {/* Row 3: Description - Rich Text Editor (Compact) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="job-desc" className="text-xs font-medium">
                  Job Description & Responsibilities *
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Rich text, bullet lists & markdown supported
                </span>
              </div>
              <RichTextEditor
                value={formData.description}
                onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                placeholder="Detail the mission, role expectations, daily responsibilities, and required qualifications..."
                jobTitle={formData.title}
                minHeight="110px"
              />
            </div>

            {/* Row 4: Unified Compact Settings Panel (Auto-Expiry + Owner + Public Toggle) */}
            <div className="p-2.5 rounded-lg border border-border bg-muted/30 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
              {/* Auto-Expiry */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <Label className="text-[11px] font-semibold">Active Period / Expiry</Label>
                </div>
                <Select 
                  value={activePeriod} 
                  onValueChange={(val: any) => setActivePeriod(val)}
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15" className="text-xs">15 Days Active</SelectItem>
                    <SelectItem value="30" className="text-xs">30 Days Active</SelectItem>
                    <SelectItem value="60" className="text-xs">60 Days Active</SelectItem>
                    <SelectItem value="90" className="text-xs">90 Days Active</SelectItem>
                    <SelectItem value="custom" className="text-xs">Custom End Date</SelectItem>
                    <SelectItem value="unlimited" className="text-xs">No Expiry (Open Ended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Job Owner */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  <Label className="text-[11px] font-semibold">Job Creator / Owner</Label>
                </div>
                <Select 
                  value={selectedCreatorId || user?.id || ''} 
                  onValueChange={(val) => setSelectedCreatorId(val)}
                  disabled={isEditMode && !isAdmin && !isSuperAdmin && !isClientAdmin}
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCreators.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.name} {m.id === user?.id ? '(You)' : `(${m.email})`}
                      </SelectItem>
                    ))}
                    {availableCreators.length === 0 && user && (
                      <SelectItem value={user.id} className="text-xs">
                        {user.user_metadata?.full_name || user.email} (You)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Public Toggle */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:border-l sm:border-border/60 sm:pl-3 pt-1 sm:pt-0">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                  <div>
                    <Label htmlFor="job-public" className="text-xs font-semibold cursor-pointer block leading-tight">
                      Publish to Careers
                    </Label>
                    <span className="text-[10px] text-muted-foreground block leading-tight">
                      Publicly accessible
                    </span>
                  </div>
                </div>
                <Switch 
                  id="job-public"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                  className="scale-90"
                />
              </div>

              {/* Custom Date sub-row if custom expiry selected */}
              {activePeriod === 'custom' && (
                <div className="sm:col-span-3 flex items-center gap-2 pt-1 border-t border-border/50">
                  <Label className="text-xs text-muted-foreground shrink-0">Auto-Inactive Date:</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    className="h-7 text-xs bg-background max-w-[200px]"
                  />
                </div>
              )}
            </div>

            {/* Row 5: Screening Questions (Compact) */}
            <div className="p-2.5 rounded-lg border border-border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-3.5 h-3.5 text-primary" />
                  <Label className="font-semibold text-xs">Screening Questions</Label>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                    {selectedQuestions.length} Attached
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLibraryModal(true)}
                    className="h-6.5 text-[11px] gap-1 px-2 bg-background shadow-xs text-primary border-primary/30 hover:bg-primary/5"
                  >
                    <BookOpen className="w-3 h-3" />
                    Library
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddCustomQuestion(!showAddCustomQuestion)}
                    className="h-6.5 text-[11px] gap-1 px-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-3 h-3" />
                    Custom
                  </Button>
                </div>
              </div>

              {/* Custom Question Quick Creator */}
              {showAddCustomQuestion && (
                <div className="p-2.5 bg-card border border-border rounded-lg space-y-2 animate-fade-in shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-primary" />
                      Add Custom Question
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowAddCustomQuestion(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                  <Input
                    placeholder="e.g. How many years of experience do you have with PostgreSQL & Node.js?"
                    value={customQText}
                    onChange={(e) => setCustomQText(e.target.value)}
                    className="h-7 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <Select value={customQType} onValueChange={(val: any) => setCustomQType(val)}>
                      <SelectTrigger className="w-[140px] h-7 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Short Text</SelectItem>
                        <SelectItem value="textarea">Long Answer (Paragraph)</SelectItem>
                        <SelectItem value="date">Date Field</SelectItem>
                        <SelectItem value="url">Website / Portfolio URL</SelectItem>
                        <SelectItem value="choice">Multiple Choice</SelectItem>
                        <SelectItem value="boolean">Yes / No</SelectItem>
                      </SelectContent>
                    </Select>
                    {customQType === 'choice' && (
                      <Input
                        placeholder="Options separated by comma (e.g. 1-2 Yrs, 3-5 Yrs, 5+ Yrs)"
                        value={customQOptions}
                        onChange={(e) => setCustomQOptions(e.target.value)}
                        className="h-7 text-xs flex-1 bg-background"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                      <Checkbox
                        checked={saveToBank}
                        onCheckedChange={(c) => setSaveToBank(!!c)}
                      />
                      <span>Save to Question Library</span>
                    </label>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomQuestion}
                      className="h-6.5 text-[11px] px-2.5"
                    >
                      Add Question
                    </Button>
                  </div>
                </div>
              )}

              {/* Selected Questions List */}
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1 divide-y divide-border/40">
                {selectedQuestions.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground py-1 text-center italic">
                    No screening questions attached yet. Click "Library" to choose standard questions.
                  </p>
                ) : (
                  selectedQuestions.map((q, idx) => (
                    <div 
                      key={q.id || `${q.text}-${idx}`} 
                      className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-muted/40 transition-colors bg-card/50"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-xs font-medium text-foreground truncate">
                          {idx + 1}. {q.text}
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 shrink-0 font-mono">
                          {q.type === 'choice' 
                            ? 'Choice' 
                            : q.type === 'boolean' 
                            ? 'Yes/No' 
                            : q.type === 'date' 
                            ? 'Date' 
                            : q.type === 'url' 
                            ? 'URL' 
                            : q.type === 'textarea' 
                            ? 'Long' 
                            : 'Text'}
                        </Badge>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id || q.text)}
                        className="text-muted-foreground hover:text-destructive p-0.5 transition-colors shrink-0"
                        title="Remove question"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-5 py-2.5 border-t border-border/60 bg-muted/20 shrink-0 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveJob} disabled={loading} className="h-8 text-xs font-semibold px-4 gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {loading 
                ? (isEditMode ? 'Saving...' : 'Creating...') 
                : (isEditMode ? 'Save Changes' : 'Create & Publish Job')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Library Selection Modal */}
      <QuestionLibraryModal
        open={showLibraryModal}
        onOpenChange={setShowLibraryModal}
        selectedQuestions={selectedQuestions}
        onConfirmSelection={(questions) => setSelectedQuestions(questions)}
        customBankQuestions={customBankQuestions}
      />
    </>
  );
}
