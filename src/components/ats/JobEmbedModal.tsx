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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code2, Copy, Check, ExternalLink, Globe, Shield, Layers, Briefcase } from 'lucide-react';
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
  const [copiedAllLink, setCopiedAllLink] = useState(false);
  const [copiedAllEmbed, setCopiedAllEmbed] = useState(false);
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

  const allJobsPortalUrl = `${window.location.origin}/careers/${clientSlug}`;
  const allJobsEmbedUrl = `${window.location.origin}/embed/careers/${clientSlug}`;
  const allJobsEmbedSnippet = `<iframe 
  src="${allJobsEmbedUrl}" 
  width="100%" 
  height="750" 
  style="border:none; border-radius:12px; overflow:hidden;" 
  title="Careers at ${client?.name || 'Zool'}"
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

  const copyToClipboard = (text: string, type: 'single-link' | 'single-embed' | 'all-link' | 'all-embed') => {
    navigator.clipboard.writeText(text);
    if (type === 'single-embed') {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
      toast({ title: 'Embed Code Copied', description: 'Paste this snippet into your website HTML for this job.' });
    } else if (type === 'single-link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({ title: 'Link Copied', description: 'Direct application link copied to clipboard.' });
    } else if (type === 'all-embed') {
      setCopiedAllEmbed(true);
      setTimeout(() => setCopiedAllEmbed(false), 2000);
      toast({ title: 'All Jobs Embed Copied', description: 'Paste this snippet into Zool site to embed the full careers board!' });
    } else if (type === 'all-link') {
      setCopiedAllLink(true);
      setTimeout(() => setCopiedAllLink(false), 2000);
      toast({ title: 'Careers URL Copied', description: 'Public careers portal URL copied to clipboard.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <DialogTitle>Share & Embed Careers on Client Website</DialogTitle>
          </div>
          <DialogDescription>
            Embed individual job applications or your entire <strong>{client?.name || 'Zool'}</strong> careers directory into any external site.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all-jobs" className="pt-1">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="all-jobs" className="gap-2 text-xs">
              <Layers className="w-3.5 h-3.5" />
              All Jobs (Careers Board)
            </TabsTrigger>
            <TabsTrigger value="single-job" className="gap-2 text-xs">
              <Briefcase className="w-3.5 h-3.5" />
              This Job ({job.title})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ALL JOBS EMBED */}
          <TabsContent value="all-jobs" className="space-y-4 pt-3">
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-xs text-foreground">
                    Zool Company Careers Portal
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Displays all active public openings with live search, filters, and AI applications.
                </p>
              </div>
              <a 
                href={allJobsPortalUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1 shrink-0 ml-3"
              >
                <span>Live Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Direct Portal URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">
                Public Careers Board URL
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  readOnly 
                  value={allJobsPortalUrl} 
                  className="font-mono text-xs bg-muted/30"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(allJobsPortalUrl, 'all-link')}
                  className="shrink-0"
                >
                  {copiedAllLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* All Jobs Embed Snippet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">
                  iFrame Embed Code for Zool Site
                </Label>
                <a 
                  href={allJobsEmbedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-normal"
                >
                  Preview Embed Widget <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <pre className="p-3 bg-muted/70 border border-border rounded-lg text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                  {allJobsEmbedSnippet}
                </pre>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="absolute top-2 right-2 shadow-sm gap-1.5 text-xs"
                  onClick={() => copyToClipboard(allJobsEmbedSnippet, 'all-embed')}
                >
                  {copiedAllEmbed ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Embed Code
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Paste this snippet into your website (Wordpress, Webflow, React, HTML) on pages like <code className="font-mono">zool.com/careers</code>.
              </p>
            </div>
          </TabsContent>

          {/* TAB 2: SINGLE JOB EMBED */}
          <TabsContent value="single-job" className="space-y-4 pt-3">
            {/* Public Toggle Card */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/40 flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <Label htmlFor="public-toggle" className="font-semibold text-xs cursor-pointer">
                    Public Status
                  </Label>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isPublic ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                    {isPublic ? 'Published Online' : 'Private Draft'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Must be published to appear on your website and embed widgets.
                </p>
              </div>
              <Switch 
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={handleTogglePublic}
                disabled={updating}
              />
            </div>

            {/* Direct Link */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                <span>Direct Application Link</span>
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
                  onClick={() => copyToClipboard(publicApplicationUrl, 'single-link')}
                  className="shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Single Embed Snippet */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">
                Single Job Application Widget Code
              </Label>
              <div className="relative">
                <pre className="p-3 bg-muted/70 border border-border rounded-lg text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                  {embedSnippet}
                </pre>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="absolute top-2 right-2 shadow-sm gap-1.5 text-xs"
                  onClick={() => copyToClipboard(embedSnippet, 'single-embed')}
                >
                  {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Snippet
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Embeds the application form with resume parsing directly onto this role's dedicated page.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
