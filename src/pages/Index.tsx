import { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import Dashboard from './Dashboard';
import Candidates from './Candidates';
import Shortlisted from './Shortlisted';
import UserManagement from './UserManagement';
import Settings from './Settings';
import ClientManagement from './ClientManagement';
import TenantSettings from './TenantSettings';
import Reports from './Reports';
import { HireSortApp } from '@/components/HireSortApp';
import { Loader2 } from 'lucide-react';

interface IndexProps {
  initialView?: string;
}

const Index = ({ initialView }: IndexProps) => {
  const { user, loading, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const resolveViewFromUrl = () => {
    if (initialView) return initialView;
    const path = location.pathname.toLowerCase();
    if (path.includes('/settings/tenant') || path.includes('/tenant-settings')) return 'tenant-settings';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/clients')) return 'clients';
    if (path.includes('/jobs')) return 'jobs';
    if (path.includes('/candidates')) return 'candidates';
    if (path.includes('/shortlisted')) return 'shortlisted';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/users')) return 'users';
    return 'dashboard';
  };

  const [currentView, setCurrentView] = useState<string>(resolveViewFromUrl);

  useEffect(() => {
    const matched = resolveViewFromUrl();
    if (matched !== currentView) {
      setCurrentView(matched);
    }
  }, [location.pathname, initialView]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const currentUrl = location.pathname + location.search;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(currentUrl)}`} replace />;
  }

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    // Sync browser URL cleanly
    switch (view) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'jobs':
        navigate('/jobs');
        break;
      case 'candidates':
        navigate('/candidates');
        break;
      case 'shortlisted':
        navigate('/shortlisted');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'users':
        navigate('/users');
        break;
      case 'tenant-settings':
        navigate('/settings/tenant');
        break;
      case 'clients':
        navigate('/clients');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        navigate('/');
    }
  };

  const getPageConfig = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Overview of your hiring pipeline', component: <Dashboard onNavigate={handleNavigate} /> };
      case 'jobs':
        return { title: 'Jobs & ATS', subtitle: 'Manage job postings, publishing, and screening questions', component: <HireSortApp /> };
      case 'candidates':
        return { title: undefined, subtitle: undefined, component: <Candidates /> };
      case 'shortlisted':
        return { title: undefined, subtitle: undefined, component: <Shortlisted /> };
      case 'reports':
        return { title: 'Reports & Analytics', subtitle: 'Candidate selection, AI match analysis, and pipeline reports', component: <Reports /> };
      case 'users':
        return { title: 'User Management', subtitle: 'Manage team members and client roles', component: <UserManagement /> };
      case 'tenant-settings':
        return { title: 'Workspace Settings & Libraries', subtitle: 'Branding, Enterprise REST API, AI strategy, SSO, and compliance', component: <TenantSettings /> };
      case 'clients':
        if (!isSuperAdmin) {
          return { title: 'Dashboard', subtitle: 'Overview of your hiring pipeline', component: <Dashboard onNavigate={handleNavigate} /> };
        }
        return { title: 'Client Tenants', subtitle: 'Manage multi-tenant client accounts and subscriptions', component: <ClientManagement /> };
      case 'settings':
        return { title: 'Settings', subtitle: 'Account preferences and AI keys', component: <Settings /> };
      default:
        return { title: 'Dashboard', subtitle: '', component: <Dashboard onNavigate={handleNavigate} /> };
    }
  };

  const { title, subtitle, component } = getPageConfig();

  return (
    <MainLayout
      currentView={currentView}
      onNavigate={handleNavigate}
      title={title}
      subtitle={subtitle}
    >
      {component}
    </MainLayout>
  );
};

export default Index;
