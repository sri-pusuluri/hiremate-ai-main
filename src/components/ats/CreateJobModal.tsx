import { useState } from 'react';
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
import { Plus, Briefcase, Globe, Sparkles } from 'lucide-react';
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

      const createdJob: Job = data
        ? {
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
            status: 'active',
            postedDate: new Date().toISOString().split('T')[0],
            candidateCount: 0,
            isPublic: (data as any).is_public,
            slug: (data as any).slug,
          }
        : {
            id: crypto.randomUUID(),
            ...formData,
            postedDate: new Date().toISOString().split('T')[0],
            candidateCount: 0,
            hireSortEnabled: true,
            status: 'active',
            slug: slug,
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
