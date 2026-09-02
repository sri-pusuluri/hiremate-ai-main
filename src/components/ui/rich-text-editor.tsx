import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading2, 
  Heading3, 
  Link2, 
  Quote, 
  Sparkles, 
  Eye, 
  Edit3, 
  Code,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  jobTitle?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write or paste job description, requirements, and benefits...",
  jobTitle = "",
  minHeight = "180px",
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to wrap or prepend selected text with markdown formatting
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText.includes('\n')) {
      const formatted = selectedText
        .split('\n')
        .map(line => line ? `${prefix}${line}` : line)
        .join('\n');
      const newValue = value.substring(0, start) + formatted + value.substring(end);
      onChange(newValue);
    } else {
      const beforeCursor = value.substring(0, start);
      const afterCursor = value.substring(end);
      const isStartOfLine = start === 0 || beforeCursor.endsWith('\n');
      const insertText = isStartOfLine ? `${prefix}${selectedText || 'Item'}` : `\n${prefix}${selectedText || 'Item'}`;
      const newValue = beforeCursor + insertText + afterCursor;
      onChange(newValue);
    }

    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  // AI JD Generator
  const handleAIGenerate = () => {
    const title = jobTitle.trim() || 'Software Engineer';
    setIsGeneratingAI(true);

    setTimeout(() => {
      const generatedJD = `## About the Role
We are seeking an exceptional **${title}** to join our team. In this role, you will lead the architecture, delivery, and scaling of critical product features that empower thousands of users daily.

### Key Responsibilities
- Architect, build, and maintain efficient, reusable, and reliable code.
- Collaborate closely with product managers, UX designers, and stakeholders to ship high-impact features.
- Identify bottlenecks, solve complex engineering challenges, and optimize system performance.
- Mentor junior engineers and champion best practices in code quality and testing.

### Requirements & Qualifications
- **3+ years** of hands-on experience in modern software engineering and customer-facing products.
- Deep expertise in high-scale systems, responsive web technologies, and cloud deployments.
- Strong track record of shipping performant, tested, and maintainable software.
- High ownership mindset with excellent collaborative communication.

### What We Offer
- Competitive salary and equity packages.
- Comprehensive health and wellness coverage.
- Flexible remote and hybrid work environment.
- Generous annual learning and development stipend.`;

      onChange(generatedJD);
      setIsGeneratingAI(false);
    }, 800);
  };

  // Simple, safe markdown to HTML formatter for the live preview tab
  const renderMarkdownPreview = (content: string) => {
    if (!content.trim()) {
      return <p className="text-muted-foreground italic text-xs">No content to preview yet.</p>;
    }

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-lg font-bold text-foreground mt-4 mb-2 pb-1 border-b border-border">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-base font-semibold text-foreground mt-3 mb-1.5 text-primary">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
        const text = line.replace(/^[-*•]\s+/, '');
        elements.push(
          <li key={index} className="ml-4 list-disc text-sm text-foreground/90 my-1 leading-relaxed">
            {renderInlineMarkdown(text)}
          </li>
        );
      } else if (/^\d+\.\s+/.test(line)) {
        const text = line.replace(/^\d+\.\s+/, '');
        elements.push(
          <li key={index} className="ml-4 list-decimal text-sm text-foreground/90 my-1 leading-relaxed">
            {renderInlineMarkdown(text)}
          </li>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={index} className="border-l-4 border-primary/50 pl-3 my-2 text-xs italic text-muted-foreground bg-muted/30 py-1 rounded-r">
            {renderInlineMarkdown(line.replace('> ', ''))}
          </blockquote>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={index} className="h-2" />);
      } else {
        elements.push(
          <p key={index} className="text-sm text-foreground/90 leading-relaxed my-1">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    });

    return <div className="space-y-0.5">{elements}</div>;
  };

  const renderInlineMarkdown = (text: string) => {
    // Bold: **text**
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-all">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 p-1.5 gap-1 select-none">
        {/* Formatting Actions */}
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => insertFormatting('**', '**', 'bold text')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => insertFormatting('*', '*', 'italic text')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </Button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => insertFormatting('## ', '', 'Section Title')}
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => insertFormatting('### ', '', 'Subsection')}
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </Button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => insertLinePrefix('- ')}
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => insertLinePrefix('1. ')}
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => insertLinePrefix('> ')}
            title="Blockquote / Note"
          >
            <Quote className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Right Actions: AI Generator & Tab Switcher */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs text-primary border-primary/30 hover:bg-primary/10 gap-1"
            onClick={handleAIGenerate}
            disabled={isGeneratingAI}
            title="Generate standard JD outline based on job title"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {isGeneratingAI ? "Generating..." : "AI Outline"}
          </Button>

          {/* Mode Switcher */}
          <div className="bg-background border border-border rounded-md flex p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                activeTab === 'write' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Edit3 className="w-3 h-3" />
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                activeTab === 'preview' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none resize-y font-sans leading-relaxed"
          style={{ minHeight }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
              e.preventDefault();
              insertFormatting('**', '**', 'bold text');
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
              e.preventDefault();
              insertFormatting('*', '*', 'italic text');
            }
          }}
        />
      ) : (
        <div 
          className="p-4 overflow-y-auto bg-muted/10"
          style={{ minHeight }}
        >
          {renderMarkdownPreview(value)}
        </div>
      )}

      {/* Bottom status bar */}
      <div className="px-3 py-1 bg-muted/20 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Markdown formatting supported (Bold, Headings, Lists)</span>
        <span className="font-mono">
          {value.trim() ? value.trim().split(/\s+/).length : 0} words • {value.length} chars
        </span>
      </div>
    </div>
  );
}
