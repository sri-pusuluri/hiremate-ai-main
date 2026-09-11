import { useState } from 'react';
import { Bell, Search, Building2, Globe, ShieldCheck, HelpCircle, LifeBuoy, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import TenantBrandLogo from '@/components/common/TenantBrandLogo';
import { HelpDrawer } from '@/components/support/HelpDrawer';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { profile, user, client, role, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  
  const getInitials = () => {
    const nameToUse = profile?.full_name || user?.user_metadata?.full_name;
    if (nameToUse) {
      const names = nameToUse.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return nameToUse.substring(0, 2).toUpperCase();
    }
    const emailToUse = profile?.email || user?.email;
    if (emailToUse) {
      return emailToUse.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getRoleLabel = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (role === 'admin') return 'Platform Admin';
    if (role === 'client_admin') return 'Workspace Admin';
    return 'Recruiter';
  };

  const isPlatformMode = !client || client.id === 'hiresort-platform-hq';

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Active Tenant / Platform Context Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/40 text-xs text-foreground">
          {isPlatformMode ? (
            <>
              <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-purple-700 dark:text-purple-300">HireSort Platform HQ</span>
              <span className="text-muted-foreground">(Global)</span>
            </>
          ) : (
            <>
              {client?.slug === 'zool' || client?.name?.toLowerCase() === 'zool' ? (
                <TenantBrandLogo client={client} variant="full" size="xs" showBorder={false} className="h-5 max-w-[100px]" />
              ) : (
                <>
                  <TenantBrandLogo client={client} size="xs" />
                  <span className="font-semibold">{client?.name}</span>
                </>
              )}
              <span className="text-muted-foreground text-[11px]">({client?.slug})</span>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidates, jobs..."
            className="h-9 w-60 pl-9 pr-4 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* System Workflow & Blueprint */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/workflow')}
          className="h-8 px-2.5 text-xs gap-1.5 border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 cursor-pointer"
          title="System Workflow & Blueprint"
        >
          <Compass className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span className="hidden sm:inline">Workflow</span>
        </Button>

        {/* Quick Help & Docs Drawer */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowHelpDrawer(true)}
          className="h-8 px-2.5 text-xs gap-1.5 border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 cursor-pointer"
          title="Open Help & Knowledge Base"
        >
          <LifeBuoy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Help & Docs</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" title="Notifications">
          <Bell className="w-5 h-5" />
        </Button>
      </div>

      <HelpDrawer 
        open={showHelpDrawer} 
        onOpenChange={setShowHelpDrawer}
        onNavigateToSupportPage={() => navigate('/support')}
      />
    </header>
  );
}
