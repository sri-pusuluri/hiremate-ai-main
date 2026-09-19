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
    <header className="h-13 sm:h-14 border-b border-border bg-card px-4 sm:px-5 flex items-center justify-between gap-3 shrink-0">
      <div className="min-w-0 flex-1 pr-2">
        <h1 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate hidden md:block mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Active Tenant / Platform Context Indicator - No wrapping breaks */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/40 text-xs text-foreground shrink-0 whitespace-nowrap select-none">
          {isPlatformMode ? (
            <>
              <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="font-semibold text-purple-700 dark:text-purple-300 whitespace-nowrap">HireSort Platform HQ</span>
              <span className="text-muted-foreground text-[11px] whitespace-nowrap">(Global)</span>
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground whitespace-nowrap">{client?.name || 'Zool'}</span>
              <span className="text-muted-foreground text-[11px] whitespace-nowrap">({client?.slug || 'zool'})</span>
            </>
          )}
        </div>

        {/* Database Connection / Mock Mode Indicator - No wrapping breaks */}
        {isMockMode() ? (
          <button
            type="button"
            onClick={() => {
              disableMockMode();
              window.location.reload();
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
            title="Local offline mock mode is active. Click to switch to live Supabase Cloud database."
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">Mock Mode (Click for Live DB)</span>
          </button>
        ) : (
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium shrink-0 whitespace-nowrap select-none"
            title="Connected to live Supabase Cloud database"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="whitespace-nowrap font-medium">Live DB</span>
          </div>
        )}

        {/* Search */}
        <div className="relative hidden xl:block shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidates, jobs..."
            className="h-8 w-44 lg:w-52 pl-8 pr-3 rounded-lg border border-input bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* System Workflow & Blueprint */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/workflow')}
          className="h-7.5 px-2 text-xs gap-1 border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 cursor-pointer shrink-0 whitespace-nowrap"
          title="System Workflow & Blueprint"
        >
          <Compass className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="hidden md:inline">Workflow</span>
        </Button>

        {/* Quick Help & Docs Drawer */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowHelpDrawer(true)}
          className="h-7.5 px-2 text-xs gap-1 border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 cursor-pointer shrink-0 whitespace-nowrap"
          title="Open Help & Knowledge Base"
        >
          <LifeBuoy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="hidden md:inline">Help & Docs</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" className="h-7.5 w-7.5 shrink-0" title="Notifications">
          <Bell className="w-4 h-4" />
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
