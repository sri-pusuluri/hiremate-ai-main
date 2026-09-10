import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  LifeBuoy, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Bug, 
  CreditCard, 
  Sparkles, 
  Code2, 
  HelpCircle 
} from 'lucide-react';
import { SupportTicket, TicketCategory, TicketPriority } from '@/types/support';
import { createSupportTicket } from '@/lib/support-storage';
import { logAuditEvent } from '@/lib/audit-logger';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketCreated?: (ticket: SupportTicket) => void;
}

export function CreateTicketModal({
  open,
  onOpenChange,
  onTicketCreated
}: CreateTicketModalProps) {
  const { user, client, role } = useAuth();
  const { toast } = useToast();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast({
        title: 'Missing Details',
        description: 'Please provide both a subject and a description of your issue or request.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const newTicket = await createSupportTicket({
        clientId: client?.id || 'hiresort-platform-hq',
        clientName: client?.name || 'Workspace',
        userId: user?.id || 'usr-support',
        userEmail: user?.email || 'admin@hiresort.ai',
        subject: subject.trim(),
        category,
        priority,
        description: description.trim()
      });

      // Audit log ticket creation
      logAuditEvent({
        clientId: client?.id || 'hiresort-platform-hq',
        clientName: client?.name || 'Workspace',
        userId: user?.id,
        userEmail: user?.email || 'admin@hiresort.ai',
        userRole: role || 'client_admin',
        action: 'CREATE_SUPPORT_TICKET',
        resourceType: 'settings',
        resourceId: newTicket.id,
        details: {
          ticket_id: newTicket.id,
          subject: newTicket.subject,
          category: newTicket.category,
          priority: newTicket.priority
        }
      }).catch(() => {});

      toast({
        title: 'Support Ticket Submitted! 🛟',
        description: `Ticket #${newTicket.id.split('-').pop()} has been sent to HireSort Support.`
      });

      onTicketCreated?.(newTicket);
      onOpenChange(false);
      setSubject('');
      setDescription('');
      setCategory('general');
      setPriority('medium');
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      toast({
        title: 'Submission Failed',
        description: err.message || 'Could not submit support ticket.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Submit Support Ticket</DialogTitle>
              <DialogDescription className="text-xs">
                Our engineering and product teams respond within standard SLA windows.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Subject</Label>
            <Input 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Need assistance connecting Google Meet API or custom domain"
              className="text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <Select value={category} onValueChange={(val: TicketCategory) => setCategory(val)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">🐛 Software Bug / Issue</SelectItem>
                  <SelectItem value="billing">💳 Billing & Subscription</SelectItem>
                  <SelectItem value="feature_request">💡 Feature Request</SelectItem>
                  <SelectItem value="integration">🔌 Integration & Embed Widget</SelectItem>
                  <SelectItem value="general">❓ General Inquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Urgency / Priority</Label>
              <Select value={priority} onValueChange={(val: TicketPriority) => setPriority(val)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low - Minor question</SelectItem>
                  <SelectItem value="medium">🟡 Medium - Normal workflow</SelectItem>
                  <SelectItem value="high">🟠 High - Time sensitive</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent - Critical system block</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Detailed Description</Label>
            <Textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Please provide steps to reproduce, relevant URLs, or requirements..."
              className="text-xs min-h-[95px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSubmit} 
            disabled={submitting} 
            className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Submitting...' : 'Send Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
