import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, DEFAULT_ZOOL_CLIENT } from '@/hooks/useAuth';
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
  ArrowRight
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

const SEED_CLIENTS: ClientTenant[] = [
  DEFAULT_ZOOL_CLIENT,
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

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: ClientTenant[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          logoUrl: c.logo_url,
          themeColor: c.theme_color || '#2563eb',
          subscriptionTier: (c.subscription_tier as any) || 'pro',
          stripeCustomerId: c.stripe_customer_id,
          createdAt: c.created_at,
        }));
        setClients(mapped);
      } else {
        // Fallback to seeds if database table is not yet migrated or empty
        setClients(SEED_CLIENTS);
      }
    } catch (err) {
      console.warn('Using seeded client list:', err);
      setClients(SEED_CLIENTS);
    } finally {
      setLoading(false);
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

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl">
      {/* Top Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
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
          className="gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Tenant
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
            <Building2 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Isolated workspace partitions</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.subscriptionTier === 'pro' || c.subscriptionTier === 'enterprise').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pro & Enterprise plans</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Careers Portals</CardTitle>
            <ExternalLink className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Public branded landing pages</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-primary">Current Active Workspace</CardTitle>
            <Sparkles className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full inline-block" 
                style={{ backgroundColor: activeClient?.themeColor || '#2563eb' }}
              />
              {activeClient?.name || 'Zool'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Slug: /{activeClient?.slug || 'zool'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Client Tenant Table / List */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Client Tenant</th>
                <th className="px-6 py-4">Careers Portal URL</th>
                <th className="px-6 py-4">Plan / Tier</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClients.map((client) => {
                const isCurrent = activeClient?.id === client.id;
                const portalUrl = `${window.location.origin}/careers/${client.slug}`;

                return (
                  <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm overflow-hidden border border-border/50 shrink-0 bg-muted"
                          style={{ backgroundColor: client.logoUrl ? 'transparent' : (client.themeColor || '#2563eb') }}
                        >
                          {client.logoUrl ? (
                            <img 
                              src={client.logoUrl} 
                              alt={client.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            client.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {client.name}
                            {isCurrent && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary">
                                Active Workspace
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">ID: {client.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <a 
                        href={`/careers/${client.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono bg-primary/5 px-2.5 py-1 rounded-md border border-primary/15"
                      >
                        /careers/{client.slug}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    <td className="px-6 py-4">
                      {getTierBadge(client.subscriptionTier)}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live & Ready
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Embed Widget Button */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEmbedModalClient(client)}
                          title="Generate website embed snippet"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Code2 className="w-4 h-4 mr-1" />
                          Embed
                        </Button>

                        {/* Edit Client */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditModal(client)}
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Settings
                        </Button>

                        {/* Switch Workspace */}
                        {!isCurrent ? (
                          <Button 
                            variant="default" 
                            size="sm"
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
                        ) : (
                          <Button variant="secondary" size="sm" disabled>
                            Current
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
                Public URL: {window.location.origin}/careers/{formData.slug || 'slug'}
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
                    value={`${window.location.origin}/careers/${embedModalClient.slug}`} 
                    className="font-mono text-xs bg-muted/40"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/careers/${embedModalClient.slug}`);
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
  src="${window.location.origin}/embed/careers/${embedModalClient.slug}" 
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
                      const snippet = `<iframe src="${window.location.origin}/embed/careers/${embedModalClient.slug}" width="100%" height="700" style="border:none; border-radius:12px; overflow:hidden;" title="${embedModalClient.name} Career Board"></iframe>`;
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
                  ⚡ <strong>Auto-Sync Push:</strong> When you add, edit, or close a job inside HireSortAi, the embedded list on the client's website will update immediately in real-time.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setEmbedModalClient(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
