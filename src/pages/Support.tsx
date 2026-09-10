import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  LifeBuoy, 
  Search, 
  BookOpen, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  ExternalLink,
  ChevronRight,
  ThumbsUp,
  Building2,
  Bug,
  CreditCard,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { SupportTicket, KnowledgeArticle, TicketCategory, TicketStatus } from '@/types/support';
import { fetchSupportTickets, KNOWLEDGE_BASE_ARTICLES } from '@/lib/support-storage';
import { CreateTicketModal } from '@/components/support/CreateTicketModal';
import { TicketDetailModal } from '@/components/support/TicketDetailModal';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Support() {
  const { client, clientId, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'articles' | 'tickets'>('articles');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTicketForDetail, setActiveTicketForDetail] = useState<SupportTicket | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const data = await fetchSupportTickets(isSuperAdmin ? undefined : clientId);
      setTickets(data);
    } catch (e) {
      console.warn('Error loading support tickets:', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [clientId, isSuperAdmin]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return KNOWLEDGE_BASE_ARTICLES;
    const q = searchQuery.toLowerCase();
    return KNOWLEDGE_BASE_ARTICLES.filter(
      a => a.title.toLowerCase().includes(q) ||
           a.summary.toLowerCase().includes(q) ||
           a.category.toLowerCase().includes(q) ||
           a.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = 
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [tickets, searchQuery, categoryFilter]);

  const ticketStats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    return { total, open, resolved };
  }, [tickets]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Help, Docs & Support Center
            </h1>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs font-semibold">
              24/7 SLA Desk
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Search developer setup guides, widget embeddings, or submit support requests directly to our team.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Submit Support Ticket
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="articles" className="text-xs gap-1.5 font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge Base & Guides ({KNOWLEDGE_BASE_ARTICLES.length})
          </TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs gap-1.5 font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            {isSuperAdmin ? 'Platform Ticket Queue' : 'My Support Tickets'} ({tickets.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. KNOWLEDGE BASE TAB */}
        <TabsContent value="articles" className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documentation: WordPress widget, BYOK AI keys, candidate filters..."
              className="pl-9 text-xs h-10 shadow-xs"
            />
          </div>

          {selectedArticle ? (
            /* Selected Article Reader */
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 max-w-3xl">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedArticle(null)}
                className="text-xs text-muted-foreground hover:text-foreground -ml-2"
              >
                ← Back to all articles
              </Button>

              <div className="space-y-1.5">
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {selectedArticle.category}
                </Badge>
                <h2 className="text-xl font-bold text-foreground">
                  {selectedArticle.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedArticle.summary}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-muted/40 border border-border text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                {selectedArticle.contentMarkdown}
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-border">
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-emerald-500" />
                  <span>Was this article helpful? <strong>{selectedArticle.helpfulCount} recruiters</strong> found this useful.</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs"
                >
                  Still need help? Open Ticket
                </Button>
              </div>
            </div>
          ) : (
            /* Articles Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map(art => (
                <div 
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className="p-5 rounded-2xl border border-border bg-card hover:bg-muted/40 hover:border-border transition-all cursor-pointer space-y-2.5 group shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant="outline" className="text-[10px] font-semibold bg-muted/50">
                      {art.category}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>

                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {art.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>

                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{art.helpfulCount} found helpful</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 2. SUPPORT TICKETS TAB */}
        <TabsContent value="tickets" className="space-y-4">
          {/* Ticket Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-lg">
            <div className="p-3 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Total Tickets</span>
              <div className="text-xl font-bold text-foreground mt-0.5">{ticketStats.total}</div>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">In Progress</span>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{ticketStats.open}</div>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground">Resolved</span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{ticketStats.resolved}</div>
            </div>
          </div>

          {/* Tickets List */}
          {loadingTickets ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading support tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-muted/20 space-y-2">
              <LifeBuoy className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h3 className="text-sm font-bold text-foreground">No support tickets found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Have a question or running into an issue? Submit a ticket and our engineering team will assist.
              </p>
              <Button 
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="text-xs gap-1.5 mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Submit First Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map(t => (
                <div 
                  key={t.id}
                  onClick={() => setActiveTicketForDetail(t)}
                  className="p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        #{t.id.split('-').pop()}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {t.category.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          t.status === 'resolved' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                        )}
                      >
                        {t.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {t.subject}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    <div className="text-right">
                      <span className="block font-semibold text-foreground">{t.clientName}</span>
                      <span className="text-[10px]">{t.messages.length} message(s)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateTicketModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTicketCreated={t => setTickets(prev => [t, ...prev])}
      />

      <TicketDetailModal 
        open={Boolean(activeTicketForDetail)}
        onOpenChange={open => !open && setActiveTicketForDetail(null)}
        ticket={activeTicketForDetail}
        onTicketUpdated={updated => {
          setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
          setActiveTicketForDetail(updated);
        }}
      />
    </div>
  );
}
