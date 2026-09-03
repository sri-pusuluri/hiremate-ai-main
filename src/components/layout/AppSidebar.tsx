import { cn } from '@/lib/utils';
import { Sparkles, LayoutDashboard, Briefcase, Users, Settings, UserCog, LogOut, Star, Building2, Layers } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Jobs & ATS', icon: Briefcase },
  { id: 'shortlisted', label: 'Shortlisted', icon: Star },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppSidebar({ currentView, onNavigate }: SidebarProps) {
  const { isAdmin, isSuperAdmin, client, profile, signOut } = useAuth();

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

        {/* Current Active Tenant */}
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
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-sidebar-primary">
                {profile?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{profile?.email}</p>
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
