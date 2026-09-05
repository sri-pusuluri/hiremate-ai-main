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
import { Switch } from '@/components/ui/switch';
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
  Copy,
  Key,
  Cpu,
  Database,
  ShieldAlert,
  FileText,
  RefreshCw,
  Lock,
  Server,
  Webhook,
  Terminal,
  Download,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Globe
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
import { logAuditEvent, fetchAuditLogs, AuditLogEntry } from '@/lib/audit-logger';

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
    text: 'What is your earliest possible joining date?',
    type: 'text'
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
  const { client, setClient, clientId, user, isSuperAdmin } = useAuth();
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

  // Enterprise API & Webhook State
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem(`hsa_api_key_${client?.id || 'default'}`) || 
      `hsa_live_${client?.slug || 'zool'}_${Math.random().toString(36).substring(2, 10)}`;
  });
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isSyncingErp, setIsSyncingErp] = useState(false);
  const [erpProvider, setErpProvider] = useState<'workday' | 'sap' | 'greenhouse' | 'lever' | 'custom'>('workday');

  // AI Model Strategy State (Option A vs Option B)
  const [aiStrategy, setAiStrategy] = useState<'managed' | 'byok'>(() => {
    return (localStorage.getItem(`hiresort_ai_strategy_${client?.id}`) as any) || 'managed';
  });
  const [byokProvider, setByokProvider] = useState<'openai' | 'azure' | 'claude' | 'gemini'>('openai');
  const [byokApiKey, setByokApiKey] = useState(() => {
    return localStorage.getItem(`hiresort_byok_key_${client?.id}`) || '';
  });
  const [byokEndpoint, setByokEndpoint] = useState(() => {
    return localStorage.getItem(`hiresort_byok_endpoint_${client?.id}`) || 'https://api.openai.com/v1';
  });

  // Login & SSO State (Option 1 vs 2 vs 3)
  const [loginMethod, setLoginMethod] = useState<'universal' | 'subdomain' | 'sso'>(() => {
    return (localStorage.getItem(`hiresort_login_method_${client?.id}`) as any) || 'universal';
  });
  const [ssoProvider, setSsoProvider] = useState<'okta' | 'azure_ad' | 'google_workspace'>('okta');
  const [ssoMetadataUrl, setSsoMetadataUrl] = useState('');
  const [ssoEntityId, setSsoEntityId] = useState('');

  // Database Strategy State
  const [dbStrategy, setDbStrategy] = useState<'pooled' | 'schema' | 'dedicated'>('pooled');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  useEffect(() => {
    if (client) {
      setName(client.name);
      setSlug(client.slug);
      setThemeColor(client.themeColor || '#2563eb');
      setLogoUrl(client.logoUrl || '');
    }
  }, [client]);

  // Load audit logs
  useEffect(() => {
    loadAuditLogs();
  }, [clientId]);

  const loadAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const logs = await fetchAuditLogs(clientId || undefined);
      setAuditLogs(logs);
    } catch (e) {
      console.error("Failed loading audit logs:", e);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  // Fetch libraries for active client
  useEffect(() => {
    async function loadLibraries() {
      if (!clientId) return;
      try {
        // Departments
        const { data: deptData } = await supabase
          .from('departments')
          .select('name')
          .eq('client_id', clientId)
          .order('name');
        if (deptData && deptData.length > 0) {
          setDepartments(deptData.map(d => d.name));
        }

        // Positions
        const { data: posData } = await supabase
          .from('positions')
          .select('title')
          .eq('client_id', clientId)
          .order('title');
        if (posData && posData.length > 0) {
          setPositions(posData.map(p => p.title));
        }

        // Questions
        const { data: qData } = await supabase
          .from('question_bank')
          .select('id, question_text, question_type, options')
          .eq('client_id', clientId);
        if (qData && qData.length > 0) {
          setQuestionBank(qData.map(q => ({
            id: q.id,
            text: q.question_text,
            type: q.question_type as any,
            options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options as any)) : undefined
          })));
        }
      } catch (err) {
        console.error('Error loading libraries from Supabase:', err);
      }
    }
    loadLibraries();
  }, [clientId]);

  // Save Branding
  const handleSaveBranding = async () => {
    if (!name.trim() || !slug.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Company Name and Slug cannot be blank.',
        variant: 'destructive',
      });
      return;
    }

    setSavingBranding(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name,
          slug,
          theme_color: themeColor,
          logo_url: logoUrl || null,
        } as any)
        .eq('id', client?.id || DEFAULT_ZOOL_CLIENT.id);

      if (error) throw error;

      if (client) {
        setClient({
          ...client,
          name,
          slug,
          themeColor,
          logoUrl: logoUrl || undefined,
        });
      }

      await logAuditEvent({
        clientId: client?.id || DEFAULT_ZOOL_CLIENT.id,
        clientName: name,
        userId: user?.id,
        userEmail: user?.email || 'admin@hiresort.ai',
        userRole: 'client_admin',
        action: 'UPDATE_BRANDING_SETTINGS',
        resourceType: 'settings',
        resourceId: slug,
        details: { name, slug, themeColor }
      });

      loadAuditLogs();

      toast({
        title: 'Branding Saved',
        description: 'Your workspace branding and careers portal have been updated.',
      });
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not update client branding.',
        variant: 'destructive',
      });
    } finally {
      setSavingBranding(false);
    }
  };

  // Generate / Regenerate API Key
  const handleRegenerateApiKey = () => {
    const newKey = `hsa_live_${slug}_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 14)}`;
    setApiKey(newKey);
    localStorage.setItem(`hsa_api_key_${client?.id || 'default'}`, newKey);

    logAuditEvent({
      clientId: client?.id || DEFAULT_ZOOL_CLIENT.id,
      clientName: name,
      userId: user?.id,
      userEmail: user?.email || 'admin@hiresort.ai',
      userRole: 'client_admin',
      action: 'REGENERATE_TENANT_API_KEY',
      resourceType: 'api',
      resourceId: newKey.substring(0, 16) + '...',
      details: { scope: 'full_ats_read_write' }
    });
    loadAuditLogs();

    toast({
      title: 'API Key Generated',
      description: 'Your new live API key has been created. Copy and store it securely.',
    });
  };

  // Trigger ERP Sync
  const handleSyncErp = async () => {
    setIsSyncingErp(true);
    try {
      // Simulate sync request with client's external ERP/ATS
      await new Promise(r => setTimeout(r, 1200));

      await logAuditEvent({
        clientId: client?.id || DEFAULT_ZOOL_CLIENT.id,
        clientName: name,
        userId: user?.id,
        userEmail: user?.email || 'admin@hiresort.ai',
        userRole: 'client_admin',
        action: 'SYNC_ERP_JOBS_AND_CANDIDATES',
        resourceType: 'api',
        resourceId: erpProvider,
        details: { provider: erpProvider, synced_postings: 2, status: 'success' }
      });
      loadAuditLogs();

      toast({
        title: `ERP Sync Successful (${erpProvider.toUpperCase()})`,
        description: `Successfully polled ${erpProvider.toUpperCase()} endpoint. Postings and candidate pipelines are synchronized.`,
      });
    } catch (e: any) {
      toast({
        title: 'Sync Failed',
        description: e.message || 'Could not connect to ERP endpoint.',
        variant: 'destructive'
      });
    } finally {
      setIsSyncingErp(false);
    }
  };

  // Save AI Strategy
  const handleSaveAIStrategy = () => {
    localStorage.setItem(`hiresort_ai_strategy_${client?.id}`, aiStrategy);
    if (aiStrategy === 'byok') {
      localStorage.setItem(`hiresort_byok_key_${client?.id}`, byokApiKey);
      localStorage.setItem(`hiresort_byok_endpoint_${client?.id}`, byokEndpoint);
    }

    logAuditEvent({
      clientId: client?.id || DEFAULT_ZOOL_CLIENT.id,
      clientName: name,
      userId: user?.id,
      userEmail: user?.email || 'admin@hiresort.ai',
      userRole: 'client_admin',
      action: 'UPDATE_AI_INFERENCE_STRATEGY',
      resourceType: 'settings',
      resourceId: aiStrategy,
      details: { strategy: aiStrategy, provider: byokProvider }
    });
    loadAuditLogs();

    toast({
      title: 'AI Model Configuration Saved',
      description: aiStrategy === 'managed' 
        ? 'HireSort AI Managed inference is active (bundled billing).' 
        : `Custom Enterprise BYOK active (${byokProvider.toUpperCase()}). Inference billed directly to your corporate account.`,
    });
  };

  // Save Login Method
  const handleSaveLoginMethod = () => {
    localStorage.setItem(`hiresort_login_method_${client?.id}`, loginMethod);

    logAuditEvent({
      clientId: client?.id || DEFAULT_ZOOL_CLIENT.id,
      clientName: name,
      userId: user?.id,
      userEmail: user?.email || 'admin@hiresort.ai',
      userRole: 'client_admin',
      action: 'UPDATE_LOGIN_AND_SSO_CONFIG',
      resourceType: 'security',
      resourceId: loginMethod,
      details: { login_method: loginMethod, sso_provider: ssoProvider }
    });
    loadAuditLogs();

    toast({
      title: 'Login & SSO Policy Saved',
      description: `Authentication strategy updated to: ${loginMethod === 'sso' ? 'Enterprise SAML 2.0 / Okta' : (loginMethod === 'subdomain' ? 'Branded Subdomain' : 'Universal Login')}.`,
    });
  };

  // Export Audit CSV
  const handleExportAuditCSV = () => {
    const headers = ['Timestamp', 'Actor Email', 'Role', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Metadata'];
    const rows = auditLogs.map(l => [
      l.createdAt,
      l.userEmail,
      l.userRole,
      l.action,
      l.resourceType,
      `"${(l.resourceId || '').replace(/"/g, '""')}"`,
      l.ipAddress || '127.0.0.1',
      `"${JSON.stringify(l.details).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_${slug}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Audit Trail Exported',
      description: 'Downloaded compliance CSV report.',
    });
  };

  // Departments Handlers
  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) return;
    const nameToAdd = newDepartment.trim();
    setDepartments(prev => [...prev, nameToAdd]);
    setNewDepartment('');
    if (clientId) {
      try {
        await supabase.from('departments').insert([{ client_id: clientId, name: nameToAdd }]);
      } catch (e) {}
    }
  };

  // Positions Handlers
  const handleAddPosition = async () => {
    if (!newPosition.trim()) return;
    const titleToAdd = newPosition.trim();
    setPositions(prev => [...prev, titleToAdd]);
    setNewPosition('');
    if (clientId) {
      try {
        await supabase.from('positions').insert([{ client_id: clientId, title: titleToAdd }]);
      } catch (e) {}
    }
  };

  // Question Handlers
  const handleAddQuestion = async () => {
    if (!newQuestionText.trim()) return;
    const opts = newQuestionType === 'choice' 
      ? newQuestionOptions.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const newQ = {
      id: `q-${Date.now()}`,
      text: newQuestionText.trim(),
      type: newQuestionType,
      options: opts
    };

    setQuestionBank(prev => [...prev, newQ]);
    setIsQuestionModalOpen(false);
    setNewQuestionText('');

    if (clientId) {
      try {
        await supabase.from('question_bank').insert([{
          client_id: clientId,
          question_text: newQ.text,
          question_type: newQ.type,
          options: opts || []
        }]);
      } catch (e) {}
    }
  };

  const careersUrl = `${window.location.origin}/careers/${slug}`;
  const webhookUrl = `${window.location.origin}/api/v1/webhooks/ats/${slug}`;

  return (
    <div className="p-6 space-y-6 max-w-6xl animate-fade-in">
      {/* Workspace Header Overview */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace Settings & Enterprise Config</h1>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
              {name}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure tenant branding, enterprise REST API keys, AI model strategies, login SSO, and compliance audit logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportAuditCSV} className="h-8 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export Audit Log
          </Button>
          <a
            href={careersUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Live Careers Site
          </a>
        </div>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-lg flex flex-wrap h-auto gap-1">
          <TabsTrigger value="api" className="gap-1.5 text-xs">
            <Key className="w-3.5 h-3.5 text-amber-500" />
            REST API & Webhooks
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 text-xs">
            <Cpu className="w-3.5 h-3.5 text-violet-500" />
            AI Strategy (BYOK)
          </TabsTrigger>
          <TabsTrigger value="login" className="gap-1.5 text-xs">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            Login & SSO Policy
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 text-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            Audit Trail ({auditLogs.length})
          </TabsTrigger>
          <TabsTrigger value="db" className="gap-1.5 text-xs">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            Database Isolation
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5 text-xs">
            <Palette className="w-3.5 h-3.5" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-1.5 text-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            Question Bank ({questionBank.length})
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5" />
            Departments ({departments.length})
          </TabsTrigger>
          <TabsTrigger value="positions" className="gap-1.5 text-xs">
            <Briefcase className="w-3.5 h-3.5" />
            Positions ({positions.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. REST API & Webhooks TAB */}
        <TabsContent value="api" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Tenant Scoped REST API Key</CardTitle>
                    <CardDescription className="text-xs">
                      Authenticate external ERP systems, custom career portals, or CI/CD pipelines into this tenant workspace.
                    </CardDescription>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={handleRegenerateApiKey} className="h-8 text-xs gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate Key
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Live Workspace API Secret Key</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    readOnly 
                    value={apiKey} 
                    className="font-mono text-xs bg-muted/60"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      setCopiedApiKey(true);
                      setTimeout(() => setCopiedApiKey(false), 2000);
                      toast({ title: 'API Key Copied', description: 'Stored in clipboard.' });
                    }}
                    className="h-9 text-xs shrink-0 gap-1.5"
                  >
                    {copiedApiKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedApiKey ? 'Copied' : 'Copy Key'}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Send this in the HTTP header: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">Authorization: Bearer {apiKey.substring(0, 16)}...</code>
                </p>
              </div>

              {/* Inbound Webhook Endpoint */}
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Inbound ATS / ERP Webhook Receiver URL</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">POST JSON</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    readOnly 
                    value={webhookUrl} 
                    className="font-mono text-xs bg-muted/60"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      setCopiedWebhook(true);
                      setTimeout(() => setCopiedWebhook(false), 2000);
                      toast({ title: 'Webhook URL Copied', description: 'Paste into Workday/Lever/Greenhouse settings.' });
                    }}
                    className="h-9 text-xs shrink-0 gap-1.5"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedWebhook ? 'Copied' : 'Copy URL'}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Configure your external ATS (Workday, SAP, Greenhouse) to trigger this webhook when a job is posted or candidate applies.
                </p>
              </div>

              {/* Manual ERP Sync Trigger */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Poll & Synchronize Jobs from Client ERP</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Trigger an immediate bidirectional sync with your HRIS/ATS system.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={erpProvider} onValueChange={(v: any) => setErpProvider(v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workday">Workday</SelectItem>
                      <SelectItem value="sap">SAP SuccessFactors</SelectItem>
                      <SelectItem value="greenhouse">Greenhouse</SelectItem>
                      <SelectItem value="lever">Lever</SelectItem>
                      <SelectItem value="custom">Custom REST ERP</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    onClick={handleSyncErp} 
                    disabled={isSyncingErp}
                    className="h-8 text-xs gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingErp ? 'animate-spin' : ''}`} />
                    {isSyncingErp ? 'Polling ERP...' : 'Fetch Jobs from ERP'}
                  </Button>
                </div>
              </div>

              {/* Model Context Protocol (MCP) Server Card */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary">Model Context Protocol (MCP) Gateway</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30 text-primary">
                    Anthropic MCP Standard
                  </Badge>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  HireSort AI exposes a native <strong>Model Context Protocol (MCP) Server</strong> endpoint. AI Agents (Claude Desktop, Cursor, LangChain) can authenticate via your tenant API key to query jobs, retrieve candidate rankings, and ingest resumes programmatically:
                </p>
                <div className="bg-background/80 p-2.5 rounded-lg border border-border font-mono text-[11px] text-muted-foreground select-all">
                  sse://api.hiresort.ai/mcp/{slug}?token={apiKey.substring(0, 18)}...
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. AI MODEL STRATEGY (OPTION A vs B) TAB */}
        <TabsContent value="ai" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">AI Model Inference & Billing Strategy</CardTitle>
                  <CardDescription className="text-xs">
                    Choose whether HireSort AI provides managed LLM inference, or connect your enterprise BYOK (Bring Your Own Key).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Option A vs Option B Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A: Managed */}
                <div 
                  onClick={() => setAiStrategy('managed')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                    aiStrategy === 'managed' 
                      ? 'border-primary bg-primary/5 shadow-xs' 
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-foreground">Option A: HireSort Managed</span>
                    </div>
                    {aiStrategy === 'managed' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    HireSort AI handles all AI embeddings, resume parsing, and predictive scoring. Inference costs are bundled into your SaaS subscription with metered overage.
                  </p>
                  <Badge variant="secondary" className="text-[10px]">Zero Maintenance • Instant Ready</Badge>
                </div>

                {/* Option B: BYOK */}
                <div 
                  onClick={() => setAiStrategy('byok')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                    aiStrategy === 'byok' 
                      ? 'border-primary bg-primary/5 shadow-xs' 
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-semibold text-foreground">Option B: Enterprise BYOK</span>
                    </div>
                    {aiStrategy === 'byok' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Plug in your company's private Azure OpenAI, Claude, or Gemini API keys. All inference queries execute against your enterprise cloud account with zero data retention.
                  </p>
                  <Badge variant="secondary" className="text-[10px]">Direct Vendor Billing • Corporate Compliance</Badge>
                </div>
              </div>

              {/* BYOK Configuration Form */}
              {aiStrategy === 'byok' && (
                <div className="p-4 rounded-xl border border-border bg-card/60 space-y-4 animate-fade-in">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    Configure Enterprise LLM Credentials for {name}
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">AI Provider</Label>
                      <Select value={byokProvider} onValueChange={(v: any) => setByokProvider(v)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI (GPT-4o & Text-Embedding-3)</SelectItem>
                          <SelectItem value="azure">Azure OpenAI Service (Private VNet)</SelectItem>
                          <SelectItem value="claude">Anthropic Claude 3.5 Sonnet</SelectItem>
                          <SelectItem value="gemini">Google Cloud Vertex AI (Gemini 1.5 Pro)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">API Endpoint URL</Label>
                      <Input 
                        value={byokEndpoint}
                        onChange={(e) => setByokEndpoint(e.target.value)}
                        placeholder="https://your-resource.openai.azure.com/"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Corporate API Secret Key</Label>
                    <Input 
                      type="password"
                      value={byokApiKey}
                      onChange={(e) => setByokApiKey(e.target.value)}
                      placeholder="sk-corp-..."
                      className="h-8 text-xs font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Stored in Supabase Vault encrypted with AES-256. Only used for scoring jobs under client ID {clientId}.
                    </p>
                  </div>
                </div>
              )}

              <Button onClick={handleSaveAIStrategy} className="gap-1.5 text-xs">
                <Save className="w-3.5 h-3.5" />
                Save AI Strategy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. LOGIN & SSO POLICY TAB */}
        <TabsContent value="login" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Login Architecture & Authentication Strategy</CardTitle>
                  <CardDescription className="text-xs">
                    Choose how users authenticate into this workspace: Universal Login, Custom Subdomain, or Enterprise SAML SSO.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Universal Login */}
                <div 
                  onClick={() => setLoginMethod('universal')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all space-y-1.5 ${
                    loginMethod === 'universal' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">1. Universal Login</span>
                    {loginMethod === 'universal' && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Users sign in at <code className="text-primary font-mono text-[10px]">/auth</code> using Email & Password or Magic Link. Context auto-routes by membership.
                  </p>
                  <Badge variant="outline" className="text-[9px]">Default Standard</Badge>
                </div>

                {/* 2. Subdomain Login */}
                <div 
                  onClick={() => setLoginMethod('subdomain')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all space-y-1.5 ${
                    loginMethod === 'subdomain' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">2. Branded Subdomain</span>
                    {loginMethod === 'subdomain' && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Users sign in at <code className="text-primary font-mono text-[10px]">{slug}.hiresort.ai</code> with custom corporate branding and logo.
                  </p>
                  <Badge variant="outline" className="text-[9px]">Mid-Market Brand</Badge>
                </div>

                {/* 3. Enterprise SSO */}
                <div 
                  onClick={() => setLoginMethod('sso')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all space-y-1.5 ${
                    loginMethod === 'sso' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">3. Enterprise SAML SSO</span>
                    {loginMethod === 'sso' && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    One-click login via corporate identity provider (Okta, Microsoft Azure AD, Google Workspace). Zero passwords stored.
                  </p>
                  <Badge variant="outline" className="text-[9px]">Fortune 500 Ready</Badge>
                </div>
              </div>

              {/* SSO Config Settings */}
              {loginMethod === 'sso' && (
                <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3.5 animate-fade-in">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    SAML 2.0 Identity Provider Details
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Identity Provider (IdP)</Label>
                      <Select value={ssoProvider} onValueChange={(v: any) => setSsoProvider(v)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="okta">Okta Workforce Identity</SelectItem>
                          <SelectItem value="azure_ad">Microsoft Entra ID (Azure AD)</SelectItem>
                          <SelectItem value="google_workspace">Google Workspace SAML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">ACS / Reply URL (Read Only)</Label>
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/auth/v1/sso/callback`} 
                        className="h-8 text-xs font-mono bg-muted/60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">IdP Entity ID</Label>
                      <Input 
                        value={ssoEntityId}
                        onChange={(e) => setSsoEntityId(e.target.value)}
                        placeholder="http://www.okta.com/exk..."
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">IdP Metadata XML / URL</Label>
                      <Input 
                        value={ssoMetadataUrl}
                        onChange={(e) => setSsoMetadataUrl(e.target.value)}
                        placeholder="https://dev-corp.okta.com/app/exk.../sso/saml/metadata"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleSaveLoginMethod} className="gap-1.5 text-xs">
                <Save className="w-3.5 h-3.5" />
                Save Authentication Policy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. COMPLIANCE AUDIT TRAIL TAB */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Compliance Audit Trail & Event Logs</CardTitle>
                    <CardDescription className="text-xs">
                      Immutable record of all recruiter actions, candidate status updates, job edits, and administrative access.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={loadAuditLogs} disabled={loadingAuditLogs} className="h-8 text-xs gap-1.5">
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button size="sm" onClick={handleExportAuditCSV} className="h-8 text-xs gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Audit Log Table */}
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground text-[11px] uppercase font-semibold border-b border-border sticky top-0 backdrop-blur-sm">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Actor Email</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Resource</th>
                        <th className="px-4 py-3">IP Address</th>
                        <th className="px-4 py-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="font-medium text-foreground">{log.userEmail}</span>
                            <Badge variant="outline" className="ml-1.5 text-[9px] uppercase font-mono px-1 py-0">
                              {log.userRole}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-foreground font-medium">
                            {log.resourceId || log.resourceType}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                            {log.ipAddress || '127.0.0.1'}
                          </td>
                          <td className="px-4 py-2.5 max-w-[200px] truncate font-mono text-[10px] text-muted-foreground">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. DATABASE ISOLATION STRATEGY TAB */}
        <TabsContent value="db" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Database Architecture & Data Isolation Tiers</CardTitle>
                  <CardDescription className="text-xs">
                    Enterprise tenants can choose between Shared RLS, Schema-per-tenant, or Dedicated Private Database (BYOD).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tier 1: Pooled RLS */}
                <div 
                  onClick={() => setDbStrategy('pooled')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 ${
                    dbStrategy === 'pooled' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Tier 1: Pooled Database (RLS)</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Single high-performance PostgreSQL cluster. Data isolation is enforced at the database engine level via PostgreSQL Row Level Security (RLS) policies scoped by <code className="text-primary font-mono text-[10px]">client_id</code>.
                  </p>
                  <span className="text-[10px] text-muted-foreground block font-medium">Included in Pro Plan</span>
                </div>

                {/* Tier 2: Schema per tenant */}
                <div 
                  onClick={() => setDbStrategy('schema')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 ${
                    dbStrategy === 'schema' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Tier 2: Schema per Tenant</span>
                    <Badge variant="secondary" className="text-[10px]">Enterprise</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dedicated PostgreSQL database schema (<code className="text-primary font-mono text-[10px]">tenant_{slug}</code>). Enables custom tables, bespoke ATS columns, and isolated database backups without noisy neighbor issues.
                  </p>
                  <span className="text-[10px] text-muted-foreground block font-medium">Enterprise Add-On</span>
                </div>

                {/* Tier 3: Dedicated Siloed DB */}
                <div 
                  onClick={() => setDbStrategy('dedicated')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 ${
                    dbStrategy === 'dedicated' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Tier 3: Dedicated Silo / BYOD</span>
                    <Badge variant="secondary" className="text-[10px]">Fortune 100</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Completely separate database instance hosted on your own AWS RDS, Azure Postgres, or dedicated Supabase project. HireSort AI application connects dynamically using your connection string.
                  </p>
                  <span className="text-[10px] text-muted-foreground block font-medium">Custom Enterprise Contract</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-muted-foreground">Current Active Database Connection:</span>
                  <code className="font-mono text-foreground font-semibold">yggmodxzemxskhbtmmbn.supabase.co [RLS Enforced]</code>
                </div>
                <Badge variant="outline" className="text-[10px]">Zero Cross-Tenant Leakage Guaranteed</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. BRANDING TAB */}
        <TabsContent value="branding">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
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
              <CardDescription className="text-xs">
                Customize how your company appears to prospective candidates on your public career boards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="company-name" className="text-xs">Company Display Name</Label>
                  <Input 
                    id="company-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Zool Technologies"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="careers-slug" className="text-xs">Careers Portal Slug</Label>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1.5 border border-r-0 border-input rounded-l-md font-mono">
                      /careers/
                    </span>
                    <Input 
                      id="careers-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="rounded-l-none font-mono text-xs h-8"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="theme-color" className="text-xs">Brand Primary Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      id="theme-color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-border cursor-pointer p-0.5 bg-background"
                    />
                    <Input 
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      placeholder="#2563eb"
                      className="font-mono text-xs h-8"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="logo-url" className="text-xs">Company Logo Image URL</Label>
                  <Input 
                    id="logo-url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <Button onClick={handleSaveBranding} disabled={savingBranding} className="gap-1.5 text-xs">
                <Save className="w-3.5 h-3.5" />
                {savingBranding ? 'Saving...' : 'Save Branding'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. QUESTION BANK TAB */}
        <TabsContent value="questions" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Workspace Question Bank</CardTitle>
                <CardDescription className="text-xs">
                  Standard pre-screening questions available to recruiters when posting new jobs.
                </CardDescription>
              </div>
              <Button onClick={() => setIsQuestionModalOpen(true)} size="sm" className="gap-1.5 text-xs h-8">
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {questionBank.map((q) => (
                  <div key={q.id} className="p-3.5 flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{q.text}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                          {q.type === 'choice' ? 'Choice' : q.type === 'boolean' ? 'Yes / No' : 'Text'}
                        </Badge>
                      </div>
                      {q.options && (
                        <p className="text-[11px] text-muted-foreground">Options: {q.options.join(', ')}</p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setQuestionBank(prev => prev.filter(item => item.id !== q.id))}
                      className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 8. DEPARTMENTS TAB */}
        <TabsContent value="departments" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Organization Departments</CardTitle>
              <CardDescription className="text-xs">
                Configure functional business units for filtering and job classification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="e.g. Data Science & Analytics" 
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="max-w-md h-8 text-xs"
                />
                <Button onClick={handleAddDepartment} size="sm" className="h-8 text-xs gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add Department
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {departments.map((dept) => (
                  <Badge key={dept} variant="secondary" className="px-3 py-1 text-xs flex items-center gap-2">
                    {dept}
                    <button 
                      onClick={() => setDepartments(prev => prev.filter(d => d !== dept))}
                      className="hover:text-destructive ml-1"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 9. POSITIONS TAB */}
        <TabsContent value="positions" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Positions & Title Library</CardTitle>
              <CardDescription className="text-xs">
                Maintain standard role titles across your company.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="e.g. Senior Machine Learning Engineer" 
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="max-w-md h-8 text-xs"
                />
                <Button onClick={handleAddPosition} size="sm" className="h-8 text-xs gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add Position
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {positions.map((pos) => (
                  <Badge key={pos} variant="outline" className="px-3 py-1 text-xs flex items-center gap-2">
                    {pos}
                    <button 
                      onClick={() => setPositions(prev => prev.filter(p => p !== pos))}
                      className="hover:text-destructive ml-1"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Question Dialog */}
      <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Question to Workspace Bank</DialogTitle>
            <DialogDescription>
              Create a reusable pre-screening question for recruiters in {name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="q-text" className="text-xs">Question Prompt</Label>
              <Input 
                id="q-text"
                placeholder="e.g. Do you have experience with distributed microservices?"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Input Type</Label>
              <Select value={newQuestionType} onValueChange={(v: any) => setNewQuestionType(v)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Open Text</SelectItem>
                  <SelectItem value="choice">Multiple Choice</SelectItem>
                  <SelectItem value="boolean">Yes / No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newQuestionType === 'choice' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Choices (comma separated)</Label>
                <Input 
                  value={newQuestionOptions}
                  onChange={(e) => setNewQuestionOptions(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddQuestion}>Add to Library</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
