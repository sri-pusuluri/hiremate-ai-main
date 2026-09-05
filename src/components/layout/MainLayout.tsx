import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, HIRESORT_PLATFORM_CLIENT } from '@/hooks/useAuth';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { Loader2, Building2 } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  title?: string;
  subtitle?: string;
}

export function MainLayout({ 
  children, 
  currentView, 
  onNavigate,
  title,
  subtitle,
}: MainLayoutProps) {
  const { user, loading, isSuperAdmin, client, setClient } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isImpersonatingTenant = isSuperAdmin && client && client.id !== 'hiresort-platform-hq';

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar 
        currentView={currentView} 
        onNavigate={onNavigate}
      />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {title && <TopBar title={title} subtitle={subtitle} />}

        {/* SuperAdmin Impersonation / Active Tenant Context Banner */}
        {isImpersonatingTenant && (
          <div className="bg-gradient-to-r from-blue-950/50 via-purple-950/40 to-background border-b border-blue-500/30 px-6 py-2 flex items-center justify-between text-xs shrink-0 shadow-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                <span>Active Tenant:</span>
                <strong className="text-foreground font-semibold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  {client.name}
                </strong>
                <span className="text-muted-foreground/80 font-mono text-[11px]">({client.slug})</span>
                <span className="hidden md:inline text-muted-foreground/70">— You are managing this workspace with full client admin privileges.</span>
              </div>
            </div>
            <button
              onClick={() => setClient(HIRESORT_PLATFORM_CLIENT)}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-4 transition-colors"
            >
              <span>← Return to Platform HQ</span>
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
