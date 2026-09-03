import { Bell, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { profile, user, client, role, isSuperAdmin } = useAuth();
  
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
    if (role === 'admin') return 'Admin';
    if (role === 'client_admin' || user?.email?.endsWith('@zool.in')) return 'Workspace Admin';
    return 'Recruiter';
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Active Tenant Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/40 text-xs text-foreground">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold">{client?.name || 'Zool'}</span>
          <span className="text-muted-foreground">({client?.slug || 'zool'})</span>
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

        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" title="Notifications">
          <Bell className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
