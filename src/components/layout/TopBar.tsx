import { useState } from 'react';
import { Bell, Search, Building2, Globe, ShieldCheck, HelpCircle, LifeBuoy, Compass, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { isMockMode, disableMockMode } from '@/integrations/supabase/client';
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
              <span className="font-semibold text-foreground">{client?.name || 'Zool'}</span>
              <span className="text-muted-foreground text-[11px]">({client?.slug || 'zool'})</span>
            </>
          )}
        </div>

        {/* Database Connection / Mock Mode Indicator */}
        {isMockMode() ? (
          <button
            type="button"
            onClick={() => {
              disableMockMode();
              window.location.reload();
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer shadow-2xs"
            title="Local offline mock mode is active. Click to switch to live Supabase Cloud database."
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Mock Mode (Click for Live DB)</span>
          </button>
        ) : (
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium"
            title="Connected to live Supabase Cloud database"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live DB</span>
          </div>
        )}

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
