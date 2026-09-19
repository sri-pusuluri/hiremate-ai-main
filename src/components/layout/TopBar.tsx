import { useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isMockMode, disableMockMode } from '@/integrations/supabase/client';
import { HelpDrawer } from '@/components/support/HelpDrawer';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const navigate = useNavigate();
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

  return (
    <header className="h-13 sm:h-14 border-b border-border bg-card px-4 sm:px-5 flex items-center justify-between gap-3 shrink-0">
      <div className="min-w-0 flex-1 pr-2">
        <h1 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate hidden md:block mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Database Connection / Mock Mode Indicator */}
        {isMockMode() ? (
          <button
            type="button"
            onClick={() => {
              disableMockMode();
              window.location.reload();
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
            title="Local offline mock mode is active. Click to switch to live Supabase Cloud database."
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">Mock Mode (Click for Live DB)</span>
          </button>
        ) : (
          <div 
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium shrink-0 whitespace-nowrap select-none"
            title="Connected to live Supabase Cloud database"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="whitespace-nowrap font-medium">Live DB</span>
          </div>
        )}

        {/* Search */}
        <div className="relative hidden sm:block shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidates, jobs..."
            className="h-8 w-48 lg:w-60 pl-8 pr-3 rounded-lg border border-input bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" className="h-8 w-8 shrink-0" title="Notifications">
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
