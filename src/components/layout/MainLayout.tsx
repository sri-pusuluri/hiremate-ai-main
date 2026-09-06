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
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-6 py-2.5 flex items-center justify-between text-xs shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-100 truncate text-xs font-medium">
                <span className="text-amber-800 dark:text-amber-300 font-semibold">Active Tenant:</span>
                <strong className="text-amber-950 dark:text-amber-50 font-bold flex items-center gap-1 bg-amber-100/80 dark:bg-amber-900/50 px-2 py-0.5 rounded border border-amber-300/60 dark:border-amber-700/60">
                  <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  {client.name}
                </strong>
                <span className="text-amber-800/80 dark:text-amber-300/80 font-mono text-[11px]">({client.slug})</span>
                <span className="hidden md:inline text-amber-900/80 dark:text-amber-200/80 font-normal">
                  — You are managing this workspace with full client admin privileges.
                </span>
              </div>
            </div>
            <button
              onClick={() => setClient(HIRESORT_PLATFORM_CLIENT)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-amber-200/90 hover:bg-amber-300 text-amber-950 dark:bg-amber-900/70 dark:hover:bg-amber-900 dark:text-amber-100 text-xs font-semibold cursor-pointer shrink-0 ml-4 transition-all shadow-xs border border-amber-300 dark:border-amber-700"
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
