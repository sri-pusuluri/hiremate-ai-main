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
  Pencil 
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
  const { client, clientId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const isEditMode = !!jobToEdit;

  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: 'Bangalore, India (Hybrid)',
    type: 'full-time' as 'full-time' | 'part-time' | 'contract',
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
      setFormData({
        title: jobToEdit.title || '',
        department: jobToEdit.department || 'Engineering',
        location: jobToEdit.location || 'Remote',
        type: (jobToEdit.type as any) || 'full-time',
        salary: jobToEdit.salary || '',
        description: jobToEdit.description || '',
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

      if (isEditMode && jobToEdit) {
        // UPDATE EXISTING JOB
        const updatePayload = {
          title: formData.title,
          department: formData.department,
          location: formData.location,
          type: formData.type,
          salary: formData.salary,
          description: formData.description,
          is_public: formData.isPublic,
          expires_at: expiresAt,
          custom_questions: formattedQuestions,
        };

        const { data, error } = await supabase
          .from('jobs')
          .update(updatePayload as any)
          .eq('id', jobToEdit.id)
          .select()
          .single();

        if (error) throw error;

        const updatedJob: Job = {
          ...jobToEdit,
          title: (data as any).title,
          department: (data as any).department,
          location: (data as any).location,
          type: (data as any).type,
          salary: (data as any).salary,
          description: (data as any).description,
          isPublic: (data as any).is_public,
          expiresAt: (data as any).expires_at || undefined,
          customQuestions: formattedQuestions as any,
        };

        if (onJobUpdated) {
          onJobUpdated(updatedJob);
        }

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
          salary: formData.salary,
          description: formData.description,
          is_public: formData.isPublic,
          slug: slug,
          client_id: clientId || DEFAULT_ZOOL_CLIENT.id,
          hire_sort_enabled: true,
          ai_processing_status: 'idle',
          status: 'active',
          expires_at: expiresAt,
          custom_questions: formattedQuestions,
          responsibilities: [
            'Lead feature development and technical design across the product stack',
            'Collaborate with product and design to craft intuitive, accessible UX',
            'Optimize code quality, automated tests, and CI/CD pipelines'
          ],
          requirements: [
            '3+ years relevant engineering or domain experience',
            'Strong problem solving and cross-functional communication skills',
            'Proven track record delivering reliable, customer-facing applications'
          ],
          nice_to_have: ['Experience with AI/LLM integrations', 'Contributions to open source']
        };

        const { data, error } = await supabase
          .from('jobs')
          .insert([newJobRecord as any])
          .select()
          .single();

        if (error) throw error;

        const createdJob: Job = {
          id: (data as any).id,
          title: (data as any).title,
          department: (data as any).department,
          location: (data as any).location,
          type: (data as any).type,
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
        };

        if (onJobCreated) {
          onJobCreated(createdJob);
        }

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
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              )}
              <DialogTitle>
                {isEditMode ? `Edit Job: ${jobToEdit?.title}` : 'Create New Job Opening'}
              </DialogTitle>
            </div>
            <DialogDescription>
              {isEditMode
                ? `Update posting details, compensation, screening questions, and visibility for ${client?.name || 'this workspace'}.`
                : `Publish a new opening for ${client?.name || 'this workspace'} to start collecting and ranking applicants.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Job Title */}
            <div className="space-y-1.5">
              <Label htmlFor="job-title">Job Title *</Label>
              <Input 
                id="job-title"
                placeholder="e.g. Senior Full Stack Engineer"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Department */}
              <div className="space-y-1.5">
                <Label htmlFor="job-dept">Department</Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
                >
                  <SelectTrigger id="job-dept">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Product & Design">Product & Design</SelectItem>
                    <SelectItem value="Sales & Marketing">Sales & Marketing</SelectItem>
                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Finance & Legal">Finance & Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employment Type */}
              <div className="space-y-1.5">
                <Label htmlFor="job-type">Employment Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, type: val }))}
                >
                  <SelectTrigger id="job-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-Time</SelectItem>
                    <SelectItem value="part-time">Part-Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Location */}
              <div className="space-y-1.5">
                <Label htmlFor="job-location">Location</Label>
                <Input 
                  id="job-location"
                  placeholder="e.g. Bangalore, India (Remote Available)"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              {/* Salary */}
              <div className="space-y-1.5">
                <Label htmlFor="job-salary">Target Compensation</Label>
                <Input 
                  id="job-salary"
                  placeholder="e.g. ₹25-35 LPA or $120k-$150k"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                />
              </div>
            </div>

            {/* Description - Rich Text Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="job-desc" className="text-xs font-semibold">
                  Job Description & Responsibilities *
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Rich text, bullet lists & markdown supported
                </span>
              </div>
              <RichTextEditor
                value={formData.description}
                onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                placeholder="Detail the mission, role expectations, daily responsibilities, and required qualifications..."
                jobTitle={formData.title}
                minHeight="170px"
              />
            </div>

            {/* Active Time Period / Expiry Setting */}
            <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <Label className="font-semibold text-xs">Active Time Period / Auto-Expiry</Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Job will automatically become Inactive after this period.
                  </p>
                </div>
                <Select 
                  value={activePeriod} 
                  onValueChange={(val: any) => setActivePeriod(val)}
                >
                  <SelectTrigger className="w-[170px] h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Days Active</SelectItem>
                    <SelectItem value="30">30 Days Active</SelectItem>
                    <SelectItem value="60">60 Days Active</SelectItem>
                    <SelectItem value="90">90 Days Active</SelectItem>
                    <SelectItem value="custom">Custom End Date</SelectItem>
                    <SelectItem value="unlimited">No Expiry (Open Ended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activePeriod === 'custom' && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Label className="text-xs text-muted-foreground shrink-0">Auto-Inactive Date:</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              )}
            </div>

            {/* APPLICATION SCREENING QUESTIONS SECTION */}
            <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-primary" />
                    <Label className="font-semibold text-xs">Application Screening Questions</Label>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      {selectedQuestions.length} Attached
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Questions candidates must answer when submitting their application.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLibraryModal(true)}
                    className="h-7 text-xs gap-1.5 bg-background shadow-xs text-primary border-primary/30 hover:bg-primary/5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Select from Library
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddCustomQuestion(!showAddCustomQuestion)}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Custom
                  </Button>
                </div>
              </div>

              {/* Custom Question Quick Creator */}
              {showAddCustomQuestion && (
                <div className="p-3 bg-card border border-border rounded-lg space-y-2.5 animate-fade-in shadow-xs">
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
                    className="h-8 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <Select value={customQType} onValueChange={(val: any) => setCustomQType(val)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
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
                        className="h-8 text-xs flex-1 bg-background"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <Checkbox
                        checked={saveToBank}
                        onCheckedChange={(c) => setSaveToBank(!!c)}
                      />
                      <span>Save to Question Library for future jobs</span>
                    </label>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomQuestion}
                      className="h-7 text-xs"
                    >
                      Add Question
                    </Button>
                  </div>
                </div>
              )}

              {/* Selected Questions List */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 divide-y divide-border/60">
                {selectedQuestions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-md bg-background/50">
                    <ListChecks className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/60" />
                    <p className="font-medium">No screening questions selected yet</p>
                    <p className="text-[11px] mt-0.5">Click "Select from Library" to choose standard recruitment questions.</p>
                  </div>
                ) : (
                  selectedQuestions.map((q, idx) => (
                    <div 
                      key={q.id || `${q.text}-${idx}`} 
                      className="pt-2 first:pt-0 flex items-start justify-between gap-3 p-2 rounded-md hover:bg-muted/40 transition-colors bg-card/60"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-foreground leading-tight">
                            {idx + 1}. {q.text}
                          </span>
                          <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 shrink-0 font-mono">
                            {q.type === 'choice' 
                              ? 'Choice' 
                              : q.type === 'boolean' 
                              ? 'Yes/No' 
                              : q.type === 'date' 
                              ? 'Date' 
                              : q.type === 'url' 
                              ? 'URL' 
                              : q.type === 'textarea' 
                              ? 'Long Text' 
                              : 'Text'}
                          </Badge>
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {q.options.map((opt, oIdx) => (
                              <span key={oIdx} className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id || q.text)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors shrink-0"
                        title="Remove question from job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Public Toggle Card */}
            <div className="p-3.5 rounded-lg border border-border bg-muted/40 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <Label htmlFor="job-public" className="font-semibold text-xs cursor-pointer">
                    Publish to Public Careers Page Immediately
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Candidates will be able to apply through your public careers board.
                </p>
              </div>
              <Switch 
                id="job-public"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveJob} disabled={loading} className="gap-1.5">
              <Sparkles className="w-4 h-4" />
              {loading 
                ? (isEditMode ? 'Saving Changes...' : 'Creating...') 
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
