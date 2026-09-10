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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  LifeBuoy, 
  Send, 
  CheckCircle2, 
  Clock, 
  User, 
  ShieldCheck, 
  MessageSquare,
  Building2,
  Lock
} from 'lucide-react';
import { SupportTicket, TicketMessage, TicketStatus } from '@/types/support';
import { addTicketMessage, updateTicketStatus } from '@/lib/support-storage';
import { logAuditEvent } from '@/lib/audit-logger';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TicketDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: SupportTicket | null;
  onTicketUpdated?: (updatedTicket: SupportTicket) => void;
}

export function TicketDetailModal({
  open,
  onOpenChange,
  ticket,
  onTicketUpdated
}: TicketDetailModalProps) {
  const { user, isSuperAdmin, role, client } = useAuth();
  const { toast } = useToast();

  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  if (!ticket) return null;

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const newMsg = await addTicketMessage(ticket.id, {
        senderId: user?.id || 'usr-support',
        senderEmail: user?.email || 'admin@hiresort.ai',
        senderRole: isSuperAdmin ? 'super_admin' : 'client_admin',
        message: replyText.trim()
      });

      const updatedTicket: SupportTicket = {
        ...ticket,
        messages: [...ticket.messages, newMsg],
        status: (isSuperAdmin ? 'waiting_on_client' : 'in_progress') as TicketStatus,
        updatedAt: new Date().toISOString()
      };

      toast({
        title: 'Reply Sent',
        description: 'Your response was added to the ticket thread.'
      });

      setReplyText('');
      onTicketUpdated?.(updatedTicket);
    } catch (e: any) {
      toast({
        title: 'Reply Failed',
        description: e.message || 'Could not post message.',
        variant: 'destructive'
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleStatus = async (newStatus: TicketStatus) => {
    try {
      await updateTicketStatus(ticket.id, newStatus);
      const updatedTicket: SupportTicket = {
        ...ticket,
        status: newStatus,
        resolvedAt: (newStatus === 'resolved' || newStatus === 'closed') ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString()
      };

      // Audit log resolution
      logAuditEvent({
        clientId: ticket.clientId || client?.id || 'hiresort-platform-hq',
        clientName: ticket.clientName || 'Workspace',
        userId: user?.id,
        userEmail: user?.email || 'admin@hiresort.ai',
        userRole: role || 'admin',
        action: newStatus === 'resolved' ? 'RESOLVE_SUPPORT_TICKET' : 'UPDATE_TICKET_STATUS',
        resourceType: 'settings',
        resourceId: ticket.id,
        details: { ticket_id: ticket.id, status: newStatus }
      }).catch(() => {});

      toast({
        title: `Ticket Status: ${newStatus.toUpperCase()}`,
        description: `Ticket status has been updated to ${newStatus}.`
      });

      onTicketUpdated?.(updatedTicket);
    } catch (e: any) {
      toast({
        title: 'Status Update Failed',
        description: e.message || 'Could not update status.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-border bg-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-muted-foreground uppercase">
                  #{ticket.id.split('-').pop()}
                </span>
                <Badge variant="outline" className="text-[10px] capitalize font-semibold">
                  {ticket.category.replace('_', ' ')}
                </Badge>
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    ticket.status === 'resolved' 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                      : ticket.status === 'in_progress'
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  )}
                >
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-1.5">
                {ticket.subject}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>Submitted by <strong>{ticket.userEmail}</strong></span>
                <span>•</span>
                <span>Workspace: <strong>{ticket.clientName}</strong></span>
              </DialogDescription>
            </div>

            {/* Status Resolver Button */}
            <div className="shrink-0">
              {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleToggleStatus('resolved')}
                  className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Resolved
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleToggleStatus('in_progress')}
                  className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Re-open Ticket
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Message Thread History */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/20 min-h-[220px] max-h-[380px]">
          {ticket.messages.map((msg) => {
            const isAgent = msg.senderRole === 'super_admin' || msg.senderRole === 'support_agent';
            return (
              <div 
                key={msg.id}
                className={cn(
                  "p-3.5 rounded-xl border text-xs space-y-1.5 max-w-[88%]",
                  isAgent 
                    ? "ml-auto bg-purple-500/[0.07] border-purple-500/25 shadow-2xs" 
                    : "mr-auto bg-card border-border shadow-2xs"
                )}
              >
                <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {isAgent ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span className="text-purple-700 dark:text-purple-300">HireSort Engineering Support</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span className="text-foreground">{msg.senderEmail}</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            );
          })}
        </div>

        {/* Reply Composer */}
        <div className="p-4 border-t border-border bg-card space-y-2">
          <Textarea 
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder={
              ticket.status === 'resolved' 
                ? "This ticket is resolved. Sending a message will automatically re-open it..." 
                : "Type your reply or troubleshooting response here..."
            }
            className="text-xs min-h-[60px]"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {isSuperAdmin ? 'Replying as Platform Super Admin' : `Replying as ${ticket.clientName}`}
            </span>
            <Button 
              size="sm" 
              onClick={handleSendReply} 
              disabled={submittingReply || !replyText.trim()}
              className="h-8 text-xs gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {submittingReply ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
