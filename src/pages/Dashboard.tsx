import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { PlatformAdminDashboard } from '@/components/dashboard/PlatformAdminDashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ShieldCheck, Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { isSuperAdmin, client } = useAuth();
  const [adminViewMode, setAdminViewMode] = useState<'platform' | 'client'>('platform');

  // If regular client user or client admin, show strictly the Client Workspace Dashboard
  if (!isSuperAdmin) {
    return <ClientDashboard onNavigate={onNavigate} />;
  }

  // HireSortAi Super Admin view with instant toggle between Platform HQ & Client Workspace preview
  return (
    <div className="space-y-4">
      {/* Super Admin Dashboard Persona Switcher Banner */}
      <div className="bg-gradient-to-r from-purple-950/30 via-background to-blue-950/30 border-b border-border px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin Access
          </Badge>
          <span className="text-xs text-muted-foreground hidden md:inline">
            Toggle between Platform SaaS Intelligence and Client Workspace Preview ({client?.name || 'Zool'}).
          </span>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center bg-muted p-1 rounded-lg border border-border shadow-2xs">
          <button
            onClick={() => setAdminViewMode('platform')}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
              adminViewMode === 'platform'
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            Platform HQ
          </button>
          <button
            onClick={() => setAdminViewMode('client')}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer",
              adminViewMode === 'client'
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            Client Workspace ({client?.name || 'Zool'})
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {adminViewMode === 'platform' ? (
        <PlatformAdminDashboard 
          onNavigate={onNavigate} 
          onSwitchToClientPreview={() => setAdminViewMode('client')}
        />
      ) : (
        <div>
          {/* Informational preview notice */}
          <div className="mx-6 mt-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Live Client Preview:</strong> You are currently viewing the workspace dashboard as <strong>{client?.name || 'Zool'}</strong>. You can change active tenants via the sidebar dropdown.
              </span>
            </div>
            <button 
              onClick={() => setAdminViewMode('platform')}
              className="text-xs font-medium text-blue-400 hover:underline cursor-pointer ml-4 shrink-0"
            >
              Return to Platform HQ →
            </button>
          </div>
          <ClientDashboard onNavigate={onNavigate} />
        </div>
      )}
    </div>
  );
}
