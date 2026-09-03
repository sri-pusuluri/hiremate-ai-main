import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  UserCog, 
  LogOut, 
  Star, 
  Building2, 
  Layers,
  ChevronsUpDown,
  Check,
  Plus,
  BarChart3
} from 'lucide-react';
import { useAuth, DEFAULT_ZOOL_CLIENT } from '@/hooks/useAuth';
import { ClientTenant } from '@/types/hiresort';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Jobs & ATS', icon: Briefcase },
  { id: 'shortlisted', label: 'Shortlisted', icon: Star },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppSidebar({ currentView, onNavigate }: SidebarProps) {
  const { isAdmin, isSuperAdmin, client, setClient, profile, user, signOut } = useAuth();

  const [availableClients, setAvailableClients] = useState<ClientTenant[]>([
    DEFAULT_ZOOL_CLIENT,
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Nexus Tech Global',
      slug: 'nexus-tech',
      themeColor: '#10b981',
      subscriptionTier: 'enterprise',
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Horizon Innovations',
      slug: 'horizon',
      themeColor: '#8b5cf6',
      subscriptionTier: 'pro',
    }
  ]);

  useEffect(() => {
    async function loadClients() {
      if (!isSuperAdmin) return;
      try {
        const { data } = await supabase.from('clients').select('id, name, slug, theme_color, subscription_tier');
        if (data && data.length > 0) {
          const mapped = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            themeColor: c.theme_color || '#2563eb',
            subscriptionTier: c.subscription_tier || 'pro'
          }));
          setAvailableClients(mapped);
        }
      } catch (err) {
        console.error('Failed to load tenants for switcher:', err);
      }
    }
    loadClients();
  }, [isSuperAdmin]);

  const workspaceAdminItems = [
    { id: 'users', label: 'User Management', icon: UserCog },
    { id: 'tenant-settings', label: 'Workspace Libraries', icon: Layers },
  ];

  const platformItems = [
    { id: 'clients', label: 'Client Tenants', icon: Building2 },
  ];

  return (
    <aside className="w-64 shrink-0 min-w-[16rem] bg-sidebar text-sidebar-foreground flex flex-col h-screen border-r border-sidebar-border select-none">
      {/* Logo & Tenant Context */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">HS</span>
          </div>
          <div>
            <span className="font-semibold text-lg leading-none">HireSortAi</span>
            <div className="text-[10px] text-sidebar-foreground/60 font-medium">ATS & GenAI Hiring</div>
          </div>
        </div>

        {/* Current Active Tenant Context & Switcher */}
        {isSuperAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="mt-3 w-full p-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent border border-sidebar-border flex items-center justify-between transition-colors text-left group cursor-pointer"
                title="Switch Active Client Workspace"
              >
                <div className="flex items-center gap-2 overflow-hidden min-w-0">
                  <div 
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs" 
                    style={{ backgroundColor: client?.themeColor || '#2563eb' }}
                  >
                    {client?.name ? client.name.substring(0, 2).toUpperCase() : 'ZL'}
                  </div>
                  <span className="truncate text-xs font-semibold text-sidebar-foreground group-hover:text-primary transition-colors">
                    {client?.name || 'Zool'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase border-sidebar-border">
                    {client?.subscriptionTier || 'Pro'}
                  </Badge>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-sidebar-foreground/50 group-hover:text-sidebar-foreground" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Switch Client Tenant
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableClients.map((c) => {
                const isActive = client?.id === c.id;
                return (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => setClient(c)}
                    className="flex items-center justify-between cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <div 
                        className="w-4 h-4 rounded text-[9px] font-bold text-white flex items-center justify-center shrink-0"
                        style={{ backgroundColor: c.themeColor || '#2563eb' }}
                      >
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={cn("text-xs truncate", isActive && "font-semibold text-primary")}>
                        {c.name}
                      </span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onNavigate('clients')}
                className="text-xs text-primary font-medium flex items-center gap-1.5 cursor-pointer py-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Manage All Tenants
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="mt-3 p-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div 
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0" 
                style={{ backgroundColor: client?.themeColor || '#2563eb' }}
              >
                {client?.name ? client.name.substring(0, 2).toUpperCase() : 'ZL'}
              </div>
              <span className="truncate text-xs font-medium text-sidebar-foreground">
                {client?.name || 'Zool'}
              </span>
            </div>
            <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase border-sidebar-border">
              {client?.subscriptionTier || 'Pro'}
            </Badge>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                  currentView === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          ))}
          
          {/* Talent Pool */}
          <li>
            <button
              onClick={() => onNavigate('candidates')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                currentView === 'candidates'
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Users className="w-5 h-5 shrink-0" />
              <span className="truncate">All Candidates</span>
            </button>
          </li>
        </ul>

        {/* Workspace Admin Items (Client Admins & Super Admins) */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-sidebar-border">
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase mb-2">Workspace Admin</p>
            <ul className="space-y-1">
              {workspaceAdminItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                      currentView === item.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* HireSortAi Platform Admin (Platform Super Admins Only) */}
        {isSuperAdmin && (
          <div className="mt-4 pt-4 border-t border-sidebar-border">
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase mb-2">Platform Admin</p>
            <ul className="space-y-1">
              {platformItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                      currentView === item.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* HireSort AI Badge */}
        <div className="mt-6 p-3 rounded-lg bg-sidebar-accent/30 border border-sidebar-border">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-sidebar-primary" />
            <span className="text-xs font-semibold text-sidebar-primary">HireSortAi</span>
          </div>
          <p className="text-xs text-sidebar-foreground/60 leading-relaxed">
            AI-assisted resume ranking available on your job postings.
          </p>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-sidebar-border">
        <ul className="space-y-1">
          {bottomItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  currentView === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        
        {/* User Info & Logout */}
        <div className="mt-3 pt-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-sidebar-primary">
                {profile?.full_name?.split(' ').map(n => n[0]).join('') || (user?.email ? user.email.substring(0, 2).toUpperCase() : 'SR')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-sidebar-foreground">{profile?.full_name || user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{profile?.email || user?.email}</p>
              <div className="mt-1">
                <span className={cn(
                  "inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider",
                  isSuperAdmin 
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                    : isAdmin 
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                )}>
                  {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Recruiter'}
                </span>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2 text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
