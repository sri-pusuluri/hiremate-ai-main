import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { Loader2 } from 'lucide-react';

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
  const { user, loading } = useAuth();

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

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar 
        currentView={currentView} 
        onNavigate={onNavigate}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {title && <TopBar title={title} subtitle={subtitle} />}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
