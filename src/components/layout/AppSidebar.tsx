import { cn } from '@/lib/utils';
import { Sparkles, LayoutDashboard, Briefcase, Users, Settings, UserCog, LogOut, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'shortlisted', label: 'Shortlisted', icon: Star },
];

const adminItems = [
  { id: 'users', label: 'User Management', icon: UserCog },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppSidebar({ currentView, onNavigate }: SidebarProps) {
  const { isAdmin, profile, signOut } = useAuth();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">HS</span>
          </div>
          <span className="font-semibold text-lg">Hiresort GenAI</span>
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
          
          {/* Talent Pool */}
          <li>
            <button
              onClick={() => onNavigate('candidates')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                currentView === 'candidates'
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Users className="w-5 h-5" />
              All Candidates
            </button>
          </li>
        </ul>

        {/* Admin Items */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-sidebar-border">
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase mb-2">Admin</p>
            <ul className="space-y-1">
              {adminItems.map((item) => (
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
          </div>
        )}

        {/* HireSort AI Badge */}
        <div className="mt-6 p-3 rounded-lg bg-sidebar-accent/30 border border-sidebar-border">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-sidebar-primary" />
            <span className="text-xs font-semibold text-sidebar-primary">Hiresort GenAI</span>
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
