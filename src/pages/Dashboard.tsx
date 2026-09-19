import { useAuth, DEFAULT_COMMIT_CLIENT } from '@/hooks/useAuth';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { PlatformAdminDashboard } from '@/components/dashboard/PlatformAdminDashboard';

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

  return isPlatformMode ? (
    <PlatformAdminDashboard 
      onNavigate={onNavigate} 
      onSwitchToClientPreview={() => setClient(DEFAULT_COMMIT_CLIENT)}
    />
  ) : (
    <ClientDashboard onNavigate={onNavigate} />
  );
}
