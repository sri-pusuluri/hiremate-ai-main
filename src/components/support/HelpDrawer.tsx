import { useState, useMemo } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LifeBuoy, 
  Search, 
  BookOpen, 
  ExternalLink, 
  Send, 
  ChevronRight, 
  HelpCircle,
  Code2,
  Sparkles,
  Layers,
  ThumbsUp,
  X
} from 'lucide-react';
import { KNOWLEDGE_BASE_ARTICLES } from '@/lib/support-storage';
import { KnowledgeArticle } from '@/types/support';
import { CreateTicketModal } from './CreateTicketModal';
import { cn } from '@/lib/utils';

interface HelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToSupportPage?: () => void;
}

export function HelpDrawer({ open, onOpenChange, onNavigateToSupportPage }: HelpDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);

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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <SheetTitle className="text-base font-bold">Help & Knowledge Center</SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Search guides, integration snippets, or connect with HireSort support engineers.
            </SheetDescription>

            {/* Instant Search */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search FAQs, API keys, embed widgets..."
                className="pl-9 text-xs h-9"
              />
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selectedArticle ? (
              /* Article View */
              <div className="space-y-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedArticle(null)}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  ← Back to all guides
                </Button>

                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {selectedArticle.category}
                  </Badge>
                  <h3 className="text-sm font-bold text-foreground">
                    {selectedArticle.title}
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedArticle.contentMarkdown}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{selectedArticle.helpfulCount} recruiters found this helpful</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Guides List */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Recommended Setup Guides
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {filteredArticles.length} articles
                  </span>
                </div>

                <div className="space-y-2">
                  {filteredArticles.map(article => (
                    <div
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="p-3 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-border transition-all cursor-pointer space-y-1 text-left group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {article.title}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0 mt-0.5" />
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {article.summary}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {article.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-border bg-card space-y-2">
            <div className="flex items-center gap-2">
              <Button 
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  setShowCreateTicketModal(true);
                }}
                className="flex-1 text-xs gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Support Ticket
              </Button>

              {onNavigateToSupportPage && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onNavigateToSupportPage();
                  }}
                  className="text-xs gap-1 cursor-pointer"
                  title="Open Full Support Center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              HireSort SLA: Responses typically delivered in under 2 hours.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Ticket Modal */}
      <CreateTicketModal 
        open={showCreateTicketModal} 
        onOpenChange={setShowCreateTicketModal} 
      />
    </>
  );
}
