import { useState, useEffect } from 'react';
import { supabase, isMockMode, saveMockClients, getMockClients } from '@/integrations/supabase/client';
import { useAuth, DEFAULT_ZOOL_CLIENT, DEFAULT_COMMIT_CLIENT } from '@/hooks/useAuth';
import { getAppBaseUrl } from '@/lib/app-url';
import { ClientTenant } from '@/types/hiresort';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check, 
  Code2, 
  Edit, 
  Users, 
  Briefcase,
  Search,
  ArrowRight,
  Trash2,
  Archive,
  ArchiveRestore,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import TenantLogoUploader from '@/components/common/TenantLogoUploader';
import TenantBrandLogo, { getResolvedTenantLogo } from '@/components/common/TenantBrandLogo';

export const SEED_CLIENTS: ClientTenant[] = [
  DEFAULT_ZOOL_CLIENT,
  DEFAULT_COMMIT_CLIENT,
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Nexus Tech Global',
    slug: 'nexus-tech',
    themeColor: '#10b981',
    subscriptionTier: 'enterprise',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Horizon Innovations',
    slug: 'horizon',
    themeColor: '#8b5cf6',
    subscriptionTier: 'pro',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  }
];

export default function ClientManagement() {
  const { client: activeClient, setClient, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const [clients, setClients] = useState<ClientTenant[]>(SEED_CLIENTS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientTenant | null>(null);
  const [embedModalClient, setEmbedModalClient] = useState<ClientTenant | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Delete & Archive Dialog State
  const [clientToAction, setClientToAction] = useState<ClientTenant | null>(null);
  const [actionType, setActionType] = useState<'archive' | 'restore' | 'delete' | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'pending'>('all');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logoUrl: '',
    themeColor: '#2563eb',
    subscriptionTier: 'pro' as 'free' | 'pro' | 'enterprise',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const isProtectedClient = (client: ClientTenant | null) => {
    if (!client) return false;
    const s = (client.slug || '').toLowerCase();
    const id = client.id;
    return s === 'zool' || s === 'commit' || id === DEFAULT_ZOOL_CLIENT.id || id === DEFAULT_COMMIT_CLIENT.id;
  };

  const handleArchiveClient = async (targetClient: ClientTenant) => {
    if (isProtectedClient(targetClient)) {
      toast({
        title: 'Protected Workspace',
        description: 'Default platform client cannot be archived.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessingAction(true);
      if (!isMockMode()) {
        await supabase
          .from('clients')
          .update({ status: 'archived' } as any)
          .eq('id', targetClient.id);
      }

      const updated = clients.map(c => c.id === targetClient.id ? { ...c, status: 'archived' as const } : c);
      setClients(updated);
      saveMockClients(updated);

      toast({
        title: 'Workspace Archived',
        description: `${targetClient.name} is now archived and hidden from public portal.`,
      });
      setActionType(null);
      setClientToAction(null);
    } catch (e: any) {
      toast({
        title: 'Error Archiving',
        description: e.message || 'Could not archive client',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRestoreClient = async (targetClient: ClientTenant) => {
    try {
      setIsProcessingAction(true);
      if (!isMockMode()) {
        await supabase
          .from('clients')
          .update({ status: 'active' } as any)
          .eq('id', targetClient.id);
      }

      const updated = clients.map(c => c.id === targetClient.id ? { ...c, status: 'active' as const } : c);
      setClients(updated);
      saveMockClients(updated);

      toast({
        title: 'Workspace Restored',
        description: `${targetClient.name} is now active and accessible.`,
      });
      setActionType(null);
      setClientToAction(null);
    } catch (e: any) {
      toast({
        title: 'Error Restoring',
        description: e.message || 'Could not restore client',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteClient = async (targetClient: ClientTenant) => {
    if (isProtectedClient(targetClient)) {
      toast({
        title: 'Protected Workspace',
        description: 'System root tenants (Zool and Commit) cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }

    if (activeClient?.id === targetClient.id) {
      toast({
        title: 'Active Workspace In Use',
        description: 'Please switch to another workspace (e.g. Zool) before deleting this workspace.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessingAction(true);

      // 1. Delete associated jobs and candidates for this client in Supabase
      if (!isMockMode()) {
        try {
          await supabase.from('candidates').delete().eq('client_id', targetClient.id);
          await supabase.from('jobs').delete().eq('client_id', targetClient.id);
          await supabase.from('departments').delete().eq('client_id', targetClient.id);
          await supabase.from('positions').delete().eq('client_id', targetClient.id);
          await supabase.from('question_bank').delete().eq('client_id', targetClient.id);
          await supabase.from('clients').delete().eq('id', targetClient.id);
        } catch (dbErr) {
          console.warn('Supabase cascade delete notice:', dbErr);
        }
      }

      // 2. Remove from local state & mock storage
      const updated = clients.filter(c => c.id !== targetClient.id && c.slug !== targetClient.slug);
      setClients(updated);
      saveMockClients(updated);

      // 3. Remove from pending workspaces if present
      try {
        const pendingKey = 'hiresort_pending_workspaces';
        const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
        const updatedPending = pending.filter((p: any) => p.id !== targetClient.id && p.slug !== targetClient.slug);
        localStorage.setItem(pendingKey, JSON.stringify(updatedPending));
      } catch (e) {}

      toast({
        title: 'Workspace Deleted Permanently',
        description: `Client ${targetClient.name} and associated workspace partition have been deleted.`,
      });

      setActionType(null);
      setClientToAction(null);
      setDeleteConfirmationInput('');
    } catch (e: any) {
      toast({
        title: 'Error Deleting Client',
        description: e.message || 'Could not delete client.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: ClientTenant[] = data.map((c: any) => {
          const resolvedLogo = (c.logo_url && !c.logo_url.includes('localhost'))
            ? c.logo_url
            : getResolvedTenantLogo(c.slug, c.name, c.logo_url);
          return {
            id: c.id,
            name: c.name,
            slug: c.slug,
            logoUrl: resolvedLogo,
            themeColor: c.theme_color || (c.slug === 'commit' ? '#f97316' : '#2563eb'),
            subscriptionTier: (c.subscription_tier as any) || 'pro',
            status: (c.status as any) || 'active',
            adminEmail: c.admin_email,
            adminName: c.admin_name,
            stripeCustomerId: c.stripe_customer_id,
            createdAt: c.created_at,
          };
        });
        // Ensure Zool and Commit are always preserved with brand logos
        const zoolIdx = mapped.findIndex(c => c.slug === 'zool' || c.id === DEFAULT_ZOOL_CLIENT.id);
        if (zoolIdx >= 0) {
          if (!mapped[zoolIdx].logoUrl) mapped[zoolIdx].logoUrl = DEFAULT_ZOOL_CLIENT.logoUrl;
        } else {
          mapped.unshift(DEFAULT_ZOOL_CLIENT);
        }

        const commitIdx = mapped.findIndex(c => c.slug === 'commit' || c.id === DEFAULT_COMMIT_CLIENT.id);
        if (commitIdx >= 0) {
          if (!mapped[commitIdx].logoUrl) mapped[commitIdx].logoUrl = DEFAULT_COMMIT_CLIENT.logoUrl;
        } else {
          mapped.splice(1, 0, DEFAULT_COMMIT_CLIENT);
        }
        setClients(mapped);
      } else {
        // Fallback to mock / seeds and pending workspaces
        const mockList = getMockClients();
        try {
          const pendingKey = 'hiresort_pending_workspaces';
          const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
          const combined = [...pending.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            logoUrl: getResolvedTenantLogo(p.slug, p.name),
            themeColor: '#2563eb',
            subscriptionTier: p.subscriptionTier || 'pro',
            status: p.status || 'pending',
            adminEmail: p.adminEmail,
            adminName: p.adminName,
            createdAt: p.submittedAt || new Date().toISOString()
          })), ...mockList];
          setClients(combined.length > 0 ? combined : SEED_CLIENTS);
        } catch (e) {
          setClients(mockList.length > 0 ? mockList : SEED_CLIENTS);
        }
      }
    } catch (err) {
      console.warn('Using seeded client list:', err);
      setClients(SEED_CLIENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClient = async (clientToApprove: ClientTenant) => {
    try {
      if (!isMockMode()) {
        await supabase
          .from('clients')
          .update({ status: 'active' } as any)
          .eq('id', clientToApprove.id);
      }
      const updated = clients.map(c => c.id === clientToApprove.id ? { ...c, status: 'active' as const } : c);
      setClients(updated);
      saveMockClients(updated);
      
      try {
        const pendingKey = 'hiresort_pending_workspaces';
        const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
        const updatedPending = pending.map((p: any) => p.id === clientToApprove.id ? { ...p, status: 'active' } : p);
        localStorage.setItem(pendingKey, JSON.stringify(updatedPending));
      } catch (e) {}

      toast({
        title: 'Workspace Approved! 🎉',
        description: `${clientToApprove.name} is now active. Access details & activation status updated.`,
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Could not approve client',
        variant: 'destructive',
      });
    }
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingClient ? prev.slug : slug,
    }));
  };

  const handleSaveClient = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Client name and URL slug are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingClient) {
        // Update
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            slug: formData.slug,
            logo_url: formData.logoUrl || null,
            theme_color: formData.themeColor,
            subscription_tier: formData.subscriptionTier,
          } as any)
          .eq('id', editingClient.id);

        if (error) throw error;

        setClients(prev =>
          prev.map(c =>
            c.id === editingClient.id
              ? {
                  ...c,
                  name: formData.name,
                  slug: formData.slug,
                  logoUrl: formData.logoUrl,
                  themeColor: formData.themeColor,
                  subscriptionTier: formData.subscriptionTier,
                }
              : c
          )
        );

        if (activeClient?.id === editingClient.id) {
          setClient({
            ...activeClient,
            name: formData.name,
            slug: formData.slug,
            logoUrl: formData.logoUrl,
            themeColor: formData.themeColor,
            subscriptionTier: formData.subscriptionTier,
          });
        }

        toast({
          title: 'Client Updated',
          description: `Successfully updated ${formData.name}`,
        });
      } else {
        // Create
        const newClientRecord = {
          name: formData.name,
          slug: formData.slug,
          logo_url: formData.logoUrl || null,
          theme_color: formData.themeColor,
          subscription_tier: formData.subscriptionTier,
        };

        const { data, error } = await supabase
          .from('clients')
          .insert([newClientRecord])
          .select()
          .single();

        const createdClient: ClientTenant = data
          ? {
              id: (data as any).id,
              name: (data as any).name,
              slug: (data as any).slug,
              logoUrl: (data as any).logo_url,
              themeColor: (data as any).theme_color,
              subscriptionTier: (data as any).subscription_tier,
              createdAt: (data as any).created_at,
            }
          : {
              id: 'client-' + Date.now(),
              ...newClientRecord,
              logoUrl: formData.logoUrl,
              createdAt: new Date().toISOString(),
            };

        setClients(prev => [createdClient, ...prev]);

        toast({
          title: 'Client Created',
          description: `Tenant ${formData.name} is now active with slug /${formData.slug}`,
        });
      }

      setIsCreateOpen(false);
      setEditingClient(null);
      setFormData({
        name: '',
        slug: '',
        logoUrl: '',
        themeColor: '#2563eb',
        subscriptionTier: 'pro',
      });
    } catch (err: any) {
      console.error('Error saving client:', err);
      toast({
        title: 'Error Saving Client',
        description: err.message || 'Could not save client. Check if the slug is already taken.',
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (client: ClientTenant) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      slug: client.slug,
      logoUrl: client.logoUrl || '',
      themeColor: client.themeColor || '#2563eb',
      subscriptionTier: client.subscriptionTier || 'pro',
    });
    setIsCreateOpen(true);
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'archived') return c.status === 'archived';
    if (statusFilter === 'pending') return c.status === 'pending';
    if (statusFilter === 'active') return c.status === 'active' || !c.status;
    return true;
  });

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'enterprise':
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-medium">Enterprise</Badge>;
      case 'pro':
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-medium">Pro SaaS</Badge>;
      default:
        return <Badge variant="secondary">Starter / Free</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-5 space-y-4 animate-fade-in max-w-7xl">
      {/* Top Actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {clients.length} registered client tenants with isolated workspace partitions and custom branding
        </p>

        <Button 
          onClick={() => {
            setEditingClient(null);
            setFormData({
              name: '',
              slug: '',
              themeColor: '#2563eb',
              subscriptionTier: 'pro',
            });
            setIsCreateOpen(true);
          }}
          size="sm"
          className="gap-1.5 shadow-sm h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add New Tenant
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0 p-3.5">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Tenants</CardTitle>
            <Building2 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-bold">{clients.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Isolated workspace partitions</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0 p-3.5">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-bold">
              {clients.filter(c => c.status !== 'archived' && (c.subscriptionTier === 'pro' || c.subscriptionTier === 'enterprise')).length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pro & Enterprise plans</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0 p-3.5">
            <CardTitle className="text-xs font-medium text-muted-foreground">Careers Portals</CardTitle>
            <ExternalLink className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-bold">{clients.filter(c => c.status !== 'archived').length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Live public career portals</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0 p-3.5">
            <CardTitle className="text-xs font-medium text-primary">Current Active Workspace</CardTitle>
            <Sparkles className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-lg font-bold text-foreground flex items-center gap-2">
              {activeClient?.slug === 'zool' || activeClient?.name?.toLowerCase() === 'zool' ? (
                <TenantBrandLogo client={activeClient} variant="full" size="sm" showBorder={false} />
              ) : (
                <>
                  <TenantBrandLogo client={activeClient} size="xs" />
                  {activeClient?.name || 'Zool'}
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Slug: /{activeClient?.slug || 'zool'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter / Search Bar with Status Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search clients by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${statusFilter === 'all' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All ({clients.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${statusFilter === 'active' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Active ({clients.filter(c => c.status === 'active' || !c.status).length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${statusFilter === 'pending' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Pending ({clients.filter(c => c.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${statusFilter === 'archived' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Archived ({clients.filter(c => c.status === 'archived').length})
          </button>
        </div>
      </div>

      {/* Client Tenant Table / List */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-3.5 py-2.5">Client Tenant</th>
                <th className="px-3.5 py-2.5">Careers Portal URL</th>
                <th className="px-3.5 py-2.5">Plan / Tier</th>
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClients.map((client) => {
                const isCurrent = activeClient?.id === client.id;
                const isProtected = isProtectedClient(client);

                return (
                  <tr key={client.id} className={`hover:bg-muted/30 transition-colors ${client.status === 'archived' ? 'opacity-70 bg-muted/15' : ''}`}>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <TenantBrandLogo client={client} size="sm" />
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {client.name}
                            {isCurrent && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary">
                                Active Workspace
                              </Badge>
                            )}
                            {isProtected && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Protected
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">ID: {client.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5">
                      <a 
                        href={`/careers/${client.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15"
                      >
                        /careers/{client.slug}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    <td className="px-3.5 py-2.5">
                      {getTierBadge(client.subscriptionTier)}
                    </td>

                    <td className="px-3.5 py-2.5">
                      {client.status === 'archived' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-900/60 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                          <Archive className="w-3 h-3" />
                          Archived
                        </span>
                      ) : client.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live & Ready
                        </span>
                      )}
                    </td>

                    <td className="px-3.5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Approve Pending Workspace (SuperAdmin only) */}
                        {client.status === 'pending' && isSuperAdmin && (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold"
                            onClick={() => handleApproveClient(client)}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </Button>
                        )}
                        {/* Embed Widget Button */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEmbedModalClient(client)}
                          title="Generate website embed snippet"
                          className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
                        >
                          <Code2 className="w-3.5 h-3.5 mr-1" />
                          Embed
                        </Button>

                        {/* Edit Client */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => openEditModal(client)}
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Settings
                        </Button>

                        {/* Switch Workspace */}
                        {!isCurrent && client.status !== 'archived' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setClient(client);
                              toast({
                                title: 'Switched Workspace',
                                description: `Now viewing as ${client.name}`,
                              });
                            }}
                          >
                            Switch To
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        )}

                        {/* Soft Delete (Archive / Restore) */}
                        {!isProtected && (
                          client.status === 'archived' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              title="Restore archived client"
                              className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                              onClick={() => {
                                setClientToAction(client);
                                setActionType('restore');
                              }}
                            >
                              <ArchiveRestore className="w-3.5 h-3.5 mr-1" />
                              Restore
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              title="Archive client (soft-delete)"
                              className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              onClick={() => {
                                setClientToAction(client);
                                setActionType('archive');
                              }}
                            >
                              <Archive className="w-3.5 h-3.5 mr-1" />
                              Archive
                            </Button>
                          )
                        )}

                        {/* Hard Delete */}
                        {!isProtected && !isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Permanently delete client workspace"
                            className="h-7 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={() => {
                              setClientToAction(client);
                              setActionType('delete');
                              setDeleteConfirmationInput('');
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No client tenants found matching "{searchQuery}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Tenant Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client Tenant' : 'Register New Client Tenant'}</DialogTitle>
            <DialogDescription>
              Create an isolated multi-tenant workspace with custom branding and URL slug.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <TenantLogoUploader
              value={formData.logoUrl}
              onChange={(newLogoUrl) => setFormData(prev => ({ ...prev, logoUrl: newLogoUrl }))}
              companyName={formData.name || 'Company'}
              themeColor={formData.themeColor}
              label="Tenant Logo / Branding"
            />

            <div className="space-y-2">
              <Label htmlFor="tenant-name">Company / Client Name *</Label>
              <Input
                id="tenant-name"
                placeholder="e.g. Zool Technologies"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant-slug">Careers Portal Slug *</Label>
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-2 border border-r-0 border-input rounded-l-md">
                  /careers/
                </span>
                <Input
                  id="tenant-slug"
                  placeholder="zool"
                  className="rounded-l-none"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Public URL: {getAppBaseUrl()}/careers/{formData.slug || 'slug'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand-color">Brand Theme Color</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color"
                    id="brand-color"
                    value={formData.themeColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, themeColor: e.target.value }))}
                    className="w-10 h-10 p-0 border border-input rounded-md cursor-pointer"
                  />
                  <Input 
                    value={formData.themeColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, themeColor: e.target.value }))}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub-tier">Subscription Plan</Label>
                <Select
                  value={formData.subscriptionTier}
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, subscriptionTier: val }))}
                >
                  <SelectTrigger id="sub-tier">
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free Starter</SelectItem>
                    <SelectItem value="pro">Pro Plan</SelectItem>
                    <SelectItem value="enterprise">Enterprise VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClient}>
              {editingClient ? 'Save Changes' : 'Create Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embed Code Dialog */}
      {embedModalClient && (
        <Dialog open={!!embedModalClient} onOpenChange={() => setEmbedModalClient(null)}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                Third-Party Website Embed Snippet
              </DialogTitle>
              <DialogDescription>
                Clients can paste this snippet onto their own company website (e.g. WordPress, Webflow, Squarespace) to automatically sync and render their open job board!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase">1. Direct Job Board URL</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input 
                    readOnly 
                    value={`${getAppBaseUrl()}/careers/${embedModalClient.slug}`} 
                    className="font-mono text-xs bg-muted/40"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${getAppBaseUrl()}/careers/${embedModalClient.slug}`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                      toast({ title: 'Copied Link to Clipboard' });
                    }}
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase">2. Auto-Sync Responsive iFrame Code</Label>
                <div className="relative mt-1.5">
                  <pre className="p-3 bg-muted/70 border border-border rounded-lg text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
{`<iframe 
  src="${getAppBaseUrl()}/embed/careers/${embedModalClient.slug}" 
  width="100%" 
  height="700" 
  style="border:none; border-radius:12px; overflow:hidden;" 
  title="${embedModalClient.name} Career Board"
></iframe>`}
                  </pre>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      const snippet = `<iframe src="${getAppBaseUrl()}/embed/careers/${embedModalClient.slug}" width="100%" height="700" style="border:none; border-radius:12px; overflow:hidden;" title="${embedModalClient.name} Career Board"></iframe>`;
                      navigator.clipboard.writeText(snippet);
                      setCopiedEmbed(true);
                      setTimeout(() => setCopiedEmbed(false), 2000);
                      toast({ title: 'Copied Embed Code to Clipboard' });
                    }}
                  >
                    {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    Copy Code
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  ⚡ <strong>Auto-Sync Push:</strong> When you add, edit, or close a job inside Sahab Portal, the embedded list on the client's website will update immediately in real-time.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setEmbedModalClient(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Archive / Restore Confirmation Dialog */}
      <Dialog 
        open={actionType === 'archive' || actionType === 'restore'} 
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null);
            setClientToAction(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
              {actionType === 'archive' ? <Archive className="w-5 h-5" /> : <ArchiveRestore className="w-5 h-5" />}
            </div>
            <DialogTitle>
              {actionType === 'archive' ? `Archive "${clientToAction?.name}"?` : `Restore "${clientToAction?.name}"?`}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'archive' ? (
                <>
                  Archiving this workspace will hide it from the active workspace switcher and take its public careers portal offline (<strong>/careers/{clientToAction?.slug}</strong>). All underlying job records, candidates, and AI screenings will remain preserved.
                </>
              ) : (
                <>
                  Restoring this workspace will reactivate its portal and allow team members to access and switch to it normally.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={isProcessingAction}
              onClick={() => {
                setActionType(null);
                setClientToAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className={actionType === 'archive' ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
              disabled={isProcessingAction}
              onClick={() => {
                if (!clientToAction) return;
                if (actionType === 'archive') {
                  handleArchiveClient(clientToAction);
                } else {
                  handleRestoreClient(clientToAction);
                }
              }}
            >
              {isProcessingAction ? 'Processing...' : actionType === 'archive' ? 'Confirm Archive' : 'Confirm Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog 
        open={actionType === 'delete'} 
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null);
            setClientToAction(null);
            setDeleteConfirmationInput('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mb-1">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-rose-600 dark:text-rose-400">
              Permanently Delete Tenant Workspace?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                This action is <span className="font-semibold text-rose-600">irreversible</span>. Deleting <strong>{clientToAction?.name}</strong> will permanently wipe:
              </p>
              <ul className="list-disc pl-5 text-xs space-y-1 text-muted-foreground">
                <li>Tenant configuration and branding</li>
                <li>All active and archived jobs posted under this tenant</li>
                <li>All candidates and AI screening scores in this workspace partition</li>
                <li>Public careers page at <code className="bg-muted px-1 py-0.5 rounded text-[11px]">/careers/{clientToAction?.slug}</code></li>
              </ul>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirm-input" className="text-xs">
              To confirm, type <strong className="font-mono text-foreground">{clientToAction?.name}</strong> below:
            </Label>
            <Input
              id="delete-confirm-input"
              placeholder={clientToAction?.name}
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              className="text-xs"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={isProcessingAction}
              onClick={() => {
                setActionType(null);
                setClientToAction(null);
                setDeleteConfirmationInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isProcessingAction || deleteConfirmationInput.trim().toLowerCase() !== (clientToAction?.name || '').trim().toLowerCase()}
              onClick={() => {
                if (clientToAction) {
                  handleDeleteClient(clientToAction);
                }
              }}
            >
              {isProcessingAction ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
