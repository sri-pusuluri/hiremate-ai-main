import { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, BookOpen, Check, ListChecks, Filter } from 'lucide-react';
import { ScreeningQuestion, QUESTION_CATEGORIES, SYSTEM_QUESTION_LIBRARY } from '@/lib/question-library';

interface QuestionLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedQuestions: ScreeningQuestion[];
  onConfirmSelection: (questions: ScreeningQuestion[]) => void;
  customBankQuestions?: ScreeningQuestion[];
}

export function QuestionLibraryModal({
  open,
  onOpenChange,
  selectedQuestions,
  onConfirmSelection,
  customBankQuestions = [],
}: QuestionLibraryModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Combine system library with any custom workspace bank questions
  const allLibraryQuestions = useMemo(() => {
    const combined = [...SYSTEM_QUESTION_LIBRARY];
    for (const cq of customBankQuestions) {
      if (!combined.some(item => item.id === cq.id || item.text.toLowerCase() === cq.text.toLowerCase())) {
        combined.push({
          ...cq,
          category: cq.category || 'logistics',
          categoryLabel: cq.categoryLabel || 'Custom Workspace Library'
        });
      }
    }
    return combined;
  }, [customBankQuestions]);

  // Local state for questions currently checked inside this dialog
  const [tempSelectedMap, setTempSelectedMap] = useState<Record<string, ScreeningQuestion>>(() => {
    const map: Record<string, ScreeningQuestion> = {};
    selectedQuestions.forEach(q => {
      map[q.id || q.text] = q;
    });
    return map;
  });

  // Sync temp state when opened
  const handleOpenStateChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const map: Record<string, ScreeningQuestion> = {};
      selectedQuestions.forEach(q => {
        map[q.id || q.text] = q;
      });
      setTempSelectedMap(map);
      setSearchQuery('');
    }
    onOpenChange(nextOpen);
  };

  const filteredQuestions = useMemo(() => {
    return allLibraryQuestions.filter(q => {
      const matchesCategory = activeCategory === 'all' || q.category === activeCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options?.some(o => o.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [allLibraryQuestions, activeCategory, searchQuery]);

  const toggleQuestion = (question: ScreeningQuestion) => {
    const key = question.id || question.text;
    setTempSelectedMap(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = question;
      }
      return next;
    });
  };

  const selectedCount = Object.keys(tempSelectedMap).length;

  const handleApply = () => {
    const selectedList = Object.values(tempSelectedMap);
    onConfirmSelection(selectedList);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenStateChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Question Library</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Select standard or custom screening questions to add to your job application form.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold">
              {selectedCount} Selected
            </Badge>
          </div>

          {/* Search bar */}
          <div className="relative mt-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search question text or options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-none">
            {QUESTION_CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                type="button"
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="h-7 text-xs px-2.5 shrink-0 rounded-full"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </DialogHeader>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 divide-y divide-border/40">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No questions found matching your filter</p>
              <p className="text-xs mt-0.5">Try searching for different terms or switch categories.</p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const key = q.id || q.text;
              const isChecked = !!tempSelectedMap[key];

              return (
                <div
                  key={key}
                  onClick={() => toggleQuestion(q)}
                  className={`pt-2.5 first:pt-0 p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-primary/5 border-primary/40 shadow-xs'
                      : 'bg-card border-border hover:bg-muted/40'
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleQuestion(q)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground leading-snug">
                        {q.text}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                          {q.type === 'choice' 
                            ? 'Choice' 
                            : q.type === 'boolean' 
                            ? 'Yes / No' 
                            : q.type === 'date' 
                            ? 'Date' 
                            : q.type === 'url' 
                            ? 'URL' 
                            : q.type === 'textarea' 
                            ? 'Long Text' 
                            : 'Text'}
                        </Badge>
                        {q.categoryLabel && (
                          <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex px-1.5 py-0">
                            {q.categoryLabel}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Options Preview */}
                    {q.options && q.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {q.options.map((opt, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border/50"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setTempSelectedMap({})}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="text-xs gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Apply {selectedCount} Question{selectedCount === 1 ? '' : 's'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
