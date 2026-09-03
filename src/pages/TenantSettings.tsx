import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, DEFAULT_ZOOL_CLIENT } from '@/hooks/useAuth';
import { Department, Position, QuestionBankItem } from '@/types/hiresort';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Palette, 
  ExternalLink, 
  FolderPlus, 
  Briefcase, 
  HelpCircle, 
  Trash2, 
  Plus, 
  Check, 
  Save, 
  Sparkles,
  Layers,
  Code2,
  Copy
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_DEPARTMENTS = [
  'Engineering',
  'Product & Design',
  'Sales & Marketing',
  'Human Resources',
  'Finance & Legal',
  'Customer Success'
];

const DEFAULT_POSITIONS = [
  'Senior Frontend Engineer',
  'Full Stack Developer',
  'Product Manager',
  'Product Designer (UI/UX)',
  'Account Executive',
  'DevOps & Platform Engineer'
];

const DEFAULT_QUESTIONS: Array<{ text: string; type: 'text' | 'choice' | 'boolean'; options?: string[] }> = [
  {
    text: 'What is your current notice period?',
    type: 'choice',
    options: ['Immediate (0-15 days)', '30 Days', '60 Days', '90 Days']
  },
  {
    text: 'Are you comfortable working in a hybrid / on-site setting in Bangalore?',
    type: 'boolean'
  },
  {
    text: 'Please share a link to your GitHub or portfolio showcasing relevant projects.',
    type: 'text'
  },
  {
    text: 'What is your expected CTC (annual compensation)?',
    type: 'text'
  }
];

export default function TenantSettings() {
  const { client, setClient, clientId } = useAuth();
  const { toast } = useToast();

  // Branding Settings State
  const [name, setName] = useState(client?.name || 'Zool');
  const [slug, setSlug] = useState(client?.slug || 'zool');
  const [logoUrl, setLogoUrl] = useState(client?.logoUrl || '');
  const [themeColor, setThemeColor] = useState(client?.themeColor || '#2563eb');
  const [savingBranding, setSavingBranding] = useState(false);

  // Libraries State
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [positions, setPositions] = useState<string[]>(DEFAULT_POSITIONS);
  const [questionBank, setQuestionBank] = useState<Array<{ id: string; text: string; type: 'text' | 'choice' | 'boolean'; options?: string[] }>>(
    DEFAULT_QUESTIONS.map((q, idx) => ({ id: `q-${idx + 1}`, ...q }))
  );

  // New item inputs
  const [newDepartment, setNewDepartment] = useState('');
  const [newPosition, setNewPosition] = useState('');

  // New Question Dialog
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'text' | 'choice' | 'boolean'>('text');
  const [newQuestionOptions, setNewQuestionOptions] = useState('Immediate, 30 Days, 60 Days');

  useEffect(() => {
    if (client) {
      setName(client.name);
      setSlug(client.slug);
      setThemeColor(client.themeColor || '#2563eb');
      setLogoUrl(client.logoUrl || '');
    }
  }, [client]);

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      if (client?.id) {
        await supabase
          .from('clients')
          .update({
            name,
            slug,
            logo_url: logoUrl || null,
            theme_color: themeColor,
          })
          .eq('id', client.id);
      }

      setClient({
        ...(client || DEFAULT_ZOOL_CLIENT),
        name,
        slug,
        logoUrl,
        themeColor,
      });

      toast({
        title: 'Branding Saved',
        description: 'Your workspace and careers portal branding have been updated.',
      });
    } catch (err: any) {
      toast({
        title: 'Error Saving Settings',
        description: err.message || 'Could not update branding settings.',
        variant: 'destructive',
      });
    } finally {
      setSavingBranding(false);
    }
  };

  const handleAddDepartment = () => {
    if (!newDepartment.trim()) return;
    if (departments.includes(newDepartment.trim())) {
      toast({ title: 'Already exists', description: 'Department is already in library.' });
      return;
    }
    setDepartments(prev => [...prev, newDepartment.trim()]);
    setNewDepartment('');
    toast({ title: 'Department Added', description: `${newDepartment} added to library.` });
  };

  const handleDeleteDepartment = (dept: string) => {
    setDepartments(prev => prev.filter(d => d !== dept));
    toast({ title: 'Department Removed' });
  };

  const handleAddPosition = () => {
    if (!newPosition.trim()) return;
    if (positions.includes(newPosition.trim())) {
      toast({ title: 'Already exists', description: 'Position is already in library.' });
      return;
    }
    setPositions(prev => [...prev, newPosition.trim()]);
    setNewPosition('');
    toast({ title: 'Position Added', description: `${newPosition} added to library.` });
  };

  const handleDeletePosition = (pos: string) => {
    setPositions(prev => prev.filter(p => p !== pos));
    toast({ title: 'Position Removed' });
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    const options = newQuestionType === 'choice' 
      ? newQuestionOptions.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const newItem = {
      id: `q-${Date.now()}`,
      text: newQuestionText.trim(),
      type: newQuestionType,
      options,
    };

    setQuestionBank(prev => [...prev, newItem]);
    setNewQuestionText('');
    setNewQuestionOptions('');
    setIsQuestionModalOpen(false);
    toast({ title: 'Question Added', description: 'Pre-screening question added to bank.' });
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestionBank(prev => prev.filter(q => q.id !== id));
    toast({ title: 'Question Removed' });
  };

  const careersUrl = `${window.location.origin}/careers/${slug}`;

  return (
    <div className="p-6 space-y-6 max-w-5xl animate-fade-in">
      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="w-4 h-4" />
            Branding & Careers Portal
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="w-4 h-4" />
            Departments ({departments.length})
          </TabsTrigger>
          <TabsTrigger value="positions" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Positions Library ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Question Bank ({questionBank.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. Branding Tab */}
        <TabsContent value="branding">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Tenant Branding & Careers URL</span>
                <a 
                  href={careersUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-normal text-primary hover:underline flex items-center gap-1 font-mono"
                >
                  View Live Portal
                  <ExternalLink className="w-3 h-3" />
                </a>
              </CardTitle>
              <CardDescription>
                Customize how your company appears to prospective candidates on your public career boards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Display Name</Label>
                  <Input 
                    id="company-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Zool Technologies"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careers-slug">Careers Portal Slug</Label>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-2 border border-r-0 border-input rounded-l-md font-mono">
                      /careers/
                    </span>
                    <Input 
                      id="careers-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="rounded-l-none font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="theme-color">Primary Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      id="theme-color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-10 h-10 p-0 border border-input rounded-md cursor-pointer"
                    />
                    <Input 
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="font-mono text-xs max-w-[140px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo-url">Logo Image URL</Label>
                  <Input 
                    id="logo-url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              {/* Preview Banner */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-sm"
                    style={{ backgroundColor: themeColor }}
                  >
                    {name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{name} Careers Portal</div>
                    <div className="text-xs text-muted-foreground font-mono">{careersUrl}</div>
                  </div>
                </div>
                <Button 
                  onClick={handleSaveBranding} 
                  disabled={savingBranding}
                  className="gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {savingBranding ? 'Saving...' : 'Save Branding'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Embed All Jobs Code Card */}
          <Card className="border-border mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  <span>Embed All Jobs Widget on Client Site ({name})</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Responsive iFrame
                </Badge>
              </CardTitle>
              <CardDescription>
                Copy this HTML code snippet to display all active {name} jobs directly on your corporate website (e.g. zool.com/careers, Webflow, WordPress, React).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">
                    HTML Embed Code for Zool Site
                  </Label>
                  <a 
                    href={`${window.location.origin}/embed/careers/${slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-normal"
                  >
                    <span>Preview Embed Widget</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <pre className="p-3.5 bg-muted/70 border border-border rounded-lg text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
{`<iframe 
  src="${window.location.origin}/embed/careers/${slug}" 
  width="100%" 
  height="750" 
  style="border:none; border-radius:12px; overflow:hidden;" 
  title="Careers at ${name}"
></iframe>`}
                  </pre>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="absolute top-2.5 right-2.5 shadow-sm gap-1.5 text-xs"
                    onClick={() => {
                      const snippet = `<iframe \n  src="${window.location.origin}/embed/careers/${slug}" \n  width="100%" \n  height="750" \n  style="border:none; border-radius:12px; overflow:hidden;" \n  title="Careers at ${name}"\n></iframe>`;
                      navigator.clipboard.writeText(snippet);
                      toast({ title: 'Embed Code Copied', description: 'Paste this snippet into your corporate website HTML.' });
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Embed Code
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚡ <strong>Dynamic sync:</strong> Whenever you post, edit, or close jobs in this ATS dashboard, the embedded board on your client site updates instantly!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Departments Tab */}
        <TabsContent value="departments">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Departments Library</CardTitle>
              <CardDescription>
                Define standard departments used when publishing jobs. Candidates can filter jobs on your careers page by department.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Bar */}
              <div className="flex gap-2 max-w-md">
                <Input 
                  placeholder="New Department name (e.g. Data Science)..."
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                />
                <Button onClick={handleAddDepartment} className="gap-1.5 shrink-0">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {/* List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {departments.map((dept) => (
                  <div 
                    key={dept}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{dept}</span>
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => handleDeleteDepartment(dept)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Positions Library Tab */}
        <TabsContent value="positions">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Positions & Designations Library</CardTitle>
              <CardDescription>
                Standard job titles and role positions to ensure uniform job descriptions across recruiters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Bar */}
              <div className="flex gap-2 max-w-md">
                <Input 
                  placeholder="New Position title (e.g. AI Research Engineer)..."
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPosition()}
                />
                <Button onClick={handleAddPosition} className="gap-1.5 shrink-0">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {/* List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {positions.map((pos) => (
                  <div 
                    key={pos}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{pos}</span>
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => handleDeletePosition(pos)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Question Bank Tab */}
        <TabsContent value="questions">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pre-Screening Question Bank</CardTitle>
                <CardDescription>
                  Reusable questionnaire library that recruiters can pick from when publishing any job.
                </CardDescription>
              </div>
              <Button onClick={() => setIsQuestionModalOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questionBank.map((q, idx) => (
                  <div 
                    key={q.id}
                    className="p-4 rounded-xl border border-border bg-card flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">Q{idx + 1}</span>
                        <span className="text-sm font-semibold text-foreground">{q.text}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {q.type === 'choice' ? 'Multiple Choice' : q.type === 'boolean' ? 'Yes / No' : 'Text Input'}
                        </Badge>
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {q.options.map(opt => (
                            <span key={opt} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Question Dialog */}
      <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Pre-Screening Question</DialogTitle>
            <DialogDescription>
              Create a custom question that can be added to public candidate application forms.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="question-text">Question Prompt *</Label>
              <Input 
                id="question-text"
                placeholder="e.g. How many years of experience do you have with React?"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question-type">Input Type</Label>
              <Select 
                value={newQuestionType}
                onValueChange={(val: any) => setNewQuestionType(val)}
              >
                <SelectTrigger id="question-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Open Text Response</SelectItem>
                  <SelectItem value="choice">Multiple Choice</SelectItem>
                  <SelectItem value="boolean">Yes / No Toggle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newQuestionType === 'choice' && (
              <div className="space-y-2">
                <Label htmlFor="question-options">Choices (comma-separated)</Label>
                <Input 
                  id="question-options"
                  placeholder="e.g. Immediate, 15 Days, 30 Days, 60+ Days"
                  value={newQuestionOptions}
                  onChange={(e) => setNewQuestionOptions(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddQuestion}>
              Add to Bank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
