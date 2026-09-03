import { useState, useEffect } from 'react';
import { Job } from '@/types/hiresort';
import { useAuth } from '@/hooks/useAuth';
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
import { Plus, Briefcase, Globe, Sparkles, Clock, ListChecks, Check, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated: (job: Job) => void;
}

export function CreateJobModal({ open, onOpenChange, onJobCreated }: CreateJobModalProps) {
  const { client, clientId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

  const [bankQuestions, setBankQuestions] = useState<Array<{ id: string; text: string; type: string; options?: string[] }>>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [showAddCustomQuestion, setShowAddCustomQuestion] = useState(false);
  const [customQText, setCustomQText] = useState('');
  const [customQType, setCustomQType] = useState<'text' | 'choice' | 'boolean'>('text');
  const [customQOptions, setCustomQOptions] = useState('');
  const [customQuestionsList, setCustomQuestionsList] = useState<Array<{ id: string; text: string; type: string; options?: string[] }>>([]);

  useEffect(() => {
    async function loadBank() {
      try {
        let query = supabase.from('question_bank').select('*');
        if (clientId) {
          query = query.eq('client_id', clientId);
        }
        const { data } = await query;
        if (data && data.length > 0) {
          const mapped = data.map((q: any) => ({
            id: q.id,
            text: q.question_text,
            type: q.question_type,
            options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options)) : undefined
          }));
          setBankQuestions(mapped);
          setSelectedQuestionIds(mapped.map(m => m.id));
        }
      } catch (e) {
        console.error("Error loading question bank:", e);
      }
    }
    if (open) {
      loadBank();
    }
  }, [open, clientId]);

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({ ...prev, title }));
  };

  const handleCreate = async () => {
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
      const slug = formData.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + `-${Math.random().toString(36).substring(2, 6)}`;

      let expiresAt: string | null = null;
      if (activePeriod === 'custom' && customExpiryDate) {
        expiresAt = new Date(`${customExpiryDate}T23:59:59Z`).toISOString();
      } else if (activePeriod !== 'unlimited') {
        const days = parseInt(activePeriod, 10);
        expiresAt = new Date(Date.now() + days * 86400000).toISOString();
      }

      const finalQuestions = [
        ...bankQuestions.filter(q => selectedQuestionIds.includes(q.id)),
        ...customQuestionsList
      ];

      const newJobRecord = {
        title: formData.title,
        department: formData.department,
        location: formData.location,
        type: formData.type,
        salary: formData.salary,
        description: formData.description,
        is_public: formData.isPublic,
        slug: slug,
        client_id: clientId,
        hire_sort_enabled: true,
        ai_processing_status: 'idle',
        status: 'active',
        expires_at: expiresAt,
        custom_questions: finalQuestions,
        responsibilities: [
          'Lead feature development across the stack',
          'Collaborate with product and design to craft intuitive UX',
          'Optimize code quality, automated tests, and deployment pipeline'
        ],
        requirements: [
          '3+ years relevant engineering or domain experience',
          'Strong problem solving and communication skills',
          'Proven record delivering customer-facing products'
        ],
        nice_to_have: ['Experience with AI/LLM applications', 'Contributions to open source']
      };

      const { data, error } = await supabase
        .from('jobs')
        .insert([newJobRecord as any])
        .select()
        .single();

      if (error) {
        console.error('Job creation error:', error);
        toast({
          title: 'Failed to create job',
          description: error.message || 'An error occurred while saving the job.',
          variant: 'destructive',
        });
        return;
      }

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
      };

      onJobCreated(createdJob);
      toast({
        title: 'Job Created',
        description: `${formData.title} has been created and is ready for candidates.`,
      });

      onOpenChange(false);
      setFormData({
        title: '',
        department: 'Engineering',
        location: 'Bangalore, India (Hybrid)',
        type: 'full-time',
        salary: '₹25-40 LPA',
        description: '',
        isPublic: true,
      });
    } catch (err: any) {
      toast({
        title: 'Failed to create job',
        description: err.message || 'An error occurred while creating the job.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <DialogTitle>Create New Job Posting</DialogTitle>
          </div>
          <DialogDescription>
            Publish a new opening for <strong>{client?.name || 'Zool'}</strong> to start collecting and ranking applicants.
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
              onChange={(e) => handleTitleChange(e.target.value)}
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

          {/* Pre-Screening Questions Section */}
          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-primary" />
                  <Label className="font-semibold text-xs">Application Screening Questions</Label>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    {selectedQuestionIds.length + customQuestionsList.length} Selected
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Select questions from your Workspace Question Bank or add custom questions to appear on candidate application forms.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddCustomQuestion(!showAddCustomQuestion)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Custom Question
              </Button>
            </div>

            {/* Custom Question Creator Form */}
            {showAddCustomQuestion && (
              <div className="p-3 bg-card border border-border rounded-lg space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">New Custom Question for This Job</span>
                  <button 
                    type="button" 
                    onClick={() => setShowAddCustomQuestion(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                <Input
                  placeholder="e.g. How many years of experience do you have with React 18?"
                  value={customQText}
                  onChange={(e) => setCustomQText(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex items-center gap-2">
                  <Select value={customQType} onValueChange={(val: any) => setCustomQType(val)}>
                    <SelectTrigger className="w-[140px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Response</SelectItem>
                      <SelectItem value="choice">Multiple Choice</SelectItem>
                      <SelectItem value="boolean">Yes / No</SelectItem>
                    </SelectContent>
                  </Select>
                  {customQType === 'choice' && (
                    <Input
                      placeholder="Comma separated options (e.g. 1-2 Yrs, 3-5 Yrs, 5+ Yrs)"
                      value={customQOptions}
                      onChange={(e) => setCustomQOptions(e.target.value)}
                      className="h-7 text-xs flex-1"
                    />
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (!customQText.trim()) return;
                      const opts = customQType === 'choice' 
                        ? customQOptions.split(',').map(s => s.trim()).filter(Boolean)
                        : (customQType === 'boolean' ? ['Yes', 'No'] : undefined);
                      const newQ = {
                        id: `custom-${Date.now()}`,
                        text: customQText.trim(),
                        type: customQType,
                        options: opts
                      };
                      setCustomQuestionsList(prev => [...prev, newQ]);
                      setCustomQText('');
                      setCustomQOptions('');
                      setShowAddCustomQuestion(false);
                    }}
                    className="h-7 text-xs"
                  >
                    Add to Job
                  </Button>
                </div>
              </div>
            )}

            {/* Questions Checklist */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 divide-y divide-border/60">
              {bankQuestions.map((q) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                return (
                  <label 
                    key={q.id} 
                    className="pt-1.5 flex items-start gap-2.5 cursor-pointer hover:bg-muted/40 p-1.5 rounded-md transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedQuestionIds(prev => [...prev, q.id]);
                        } else {
                          setSelectedQuestionIds(prev => prev.filter(id => id !== q.id));
                        }
                      }}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground leading-tight">
                          {q.text}
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 shrink-0 font-mono">
                          {q.type === 'choice' ? 'Choice' : q.type === 'boolean' ? 'Yes/No' : 'Text'}
                        </Badge>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          Options: {q.options.join(', ')}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}

              {/* Custom Questions attached */}
              {customQuestionsList.map((cq) => (
                <div key={cq.id} className="pt-1.5 flex items-center justify-between gap-2 p-1.5 rounded-md bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">{cq.text}</span>
                    <Badge variant="secondary" className="text-[9px] uppercase px-1 py-0 shrink-0">
                      Custom
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomQuestionsList(prev => prev.filter(q => q.id !== cq.id))}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
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
          <Button onClick={handleCreate} disabled={loading} className="gap-1.5">
            <Sparkles className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create & Publish Job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
