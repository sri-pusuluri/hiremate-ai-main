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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Code2, Copy, Check, ExternalLink, Globe, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobEmbedModalProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobUpdated?: (updatedJob: Job) => void;
}

export function JobEmbedModal({ job, open, onOpenChange, onJobUpdated }: JobEmbedModalProps) {
  const { client } = useAuth();
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [isPublic, setIsPublic] = useState(job?.isPublic || false);
  const [updating, setUpdating] = useState(false);

  if (!job) return null;

  const clientSlug = client?.slug || 'zool';
  const jobSlug = job.slug || job.id;
  const publicApplicationUrl = `${window.location.origin}/careers/${clientSlug}/${jobSlug}`;
  const embedIframeUrl = `${window.location.origin}/embed/job/${job.id}`;

  const embedSnippet = `<iframe 
  src="${embedIframeUrl}" 
  width="100%" 
  height="680" 
  style="border:none; border-radius:12px; overflow:hidden;" 
  title="${job.title} - Application Form"
></iframe>`;

  const handleTogglePublic = async (checked: boolean) => {
    setIsPublic(checked);
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_public: checked } as any)
        .eq('id', job.id);

      if (error) throw error;

      if (onJobUpdated) {
        onJobUpdated({ ...job, isPublic: checked });
      }

      toast({
        title: checked ? 'Job Published' : 'Job Set to Private',
        description: checked 
          ? 'This job is now live on your public careers portal and embed widgets.'
          : 'This job is now hidden from the public careers portal.',
      });
    } catch (err: any) {
      setIsPublic(!checked);
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not update public status.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = (text: string, isEmbed = false) => {
    navigator.clipboard.writeText(text);
    if (isEmbed) {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
      toast({ title: 'Embed Code Copied', description: 'Paste this snippet into your website HTML.' });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({ title: 'Link Copied', description: 'Public application link copied to clipboard.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <DialogTitle>Share & Embed Job Posting</DialogTitle>
          </div>
          <DialogDescription>
            Publish <strong>{job.title}</strong> to third-party client websites or share the direct application link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Public Toggle Card */}
          <div className="p-4 rounded-xl border border-border bg-muted/40 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <Label htmlFor="public-toggle" className="font-semibold text-sm cursor-pointer">
                  Public Career Board Listing
                </Label>
                <Badge variant={isPublic ? 'default' : 'secondary'} className="text-[10px]">
                  {isPublic ? 'Published Online' : 'Private Draft'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, candidates can view and apply through your public careers page and embedded widgets.
              </p>
            </div>
            <Switch 
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={updating}
            />
          </div>

          {/* Direct Public Link */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Direct Candidate Application Link</span>
              <a 
                href={publicApplicationUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-normal lowercase"
              >
                Preview Link <ExternalLink className="w-3 h-3" />
              </a>
            </Label>
            <div className="flex items-center gap-2">
              <Input 
                readOnly 
                value={publicApplicationUrl} 
                className="font-mono text-xs bg-muted/30"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(publicApplicationUrl, false)}
                className="shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Embed Snippet */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">
              Embed Widget Code (Third-Party Websites)
            </Label>
            <div className="relative">
              <pre className="p-3 bg-muted/70 border border-border rounded-lg text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                {embedSnippet}
              </pre>
              <Button 
                variant="secondary" 
                size="sm"
                className="absolute top-2 right-2 shadow-sm"
                onClick={() => copyToClipboard(embedSnippet, true)}
              >
                {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                Copy Snippet
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              ⚡ <strong>Instant Auto-Sync:</strong> Any candidate who submits through this embedded form is automatically parsed by AI and pushed to your candidate pipeline!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
