import { useAuth, HIRESORT_PLATFORM_CLIENT, DEFAULT_COMMIT_CLIENT, DEFAULT_ZOOL_CLIENT } from '@/hooks/useAuth';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { PlatformAdminDashboard } from '@/components/dashboard/PlatformAdminDashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ShieldCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { isSuperAdmin, client, setClient } = useAuth();

  // If regular client user or client admin, show strictly the Client Workspace Dashboard
  if (!isSuperAdmin) {
    return <ClientDashboard onNavigate={onNavigate} />;
  }

  // Super Admin: Determine whether in Platform HQ or inside a specific client tenant workspace
  const isPlatformMode = !client || client.id === 'hiresort-platform-hq';

  return (
    <div className="space-y-4">
      {/* Super Admin Dashboard Persona Switcher Banner */}
      <div className="bg-gradient-to-r from-purple-950/20 via-background to-blue-950/20 border-b border-border px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Super Admin View
          </Badge>
          <span className="text-xs text-muted-foreground hidden md:inline">
            {isPlatformMode
              ? 'Viewing HireSort Platform SaaS HQ. Select any tenant from the workspace dropdown to manage their hiring workspace.'
              : `Managing ${client?.name || 'Client'} workspace with full Super Admin privileges.`
            }
          </span>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center bg-muted p-1 rounded-lg border border-border shadow-2xs">
          <button
            onClick={() => setClient(HIRESORT_PLATFORM_CLIENT)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
              isPlatformMode
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            Platform HQ
          </button>
          <button
            onClick={() => {
              if (isPlatformMode) {
                setClient(DEFAULT_COMMIT_CLIENT);
              }
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
              !isPlatformMode
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            Workspace: {client && client.id !== 'hiresort-platform-hq' ? client.name : 'Select Tenant'}
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {isPlatformMode ? (
        <PlatformAdminDashboard 
          onNavigate={onNavigate} 
          onSwitchToClientPreview={() => setClient(DEFAULT_COMMIT_CLIENT)}
        />
      ) : (
        <ClientDashboard onNavigate={onNavigate} />
      )}
    </div>
  );
}
