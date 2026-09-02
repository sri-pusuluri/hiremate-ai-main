import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import Dashboard from './Dashboard';
import Candidates from './Candidates';
import Shortlisted from './Shortlisted';
import UserManagement from './UserManagement';
import Settings from './Settings';
import ClientManagement from './ClientManagement';
import TenantSettings from './TenantSettings';
import { HireSortApp } from '@/components/HireSortApp';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

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

  const getPageConfig = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Overview of your hiring pipeline', component: <Dashboard /> };
      case 'jobs':
        return { title: 'Jobs & ATS', subtitle: 'Manage job postings, publishing, and screening questions', component: <HireSortApp /> };
      case 'candidates':
        return { title: undefined, subtitle: undefined, component: <Candidates /> };
      case 'shortlisted':
        return { title: undefined, subtitle: undefined, component: <Shortlisted /> };
      case 'users':
        return { title: 'User Management', subtitle: 'Manage team members and client roles', component: <UserManagement /> };
      case 'tenant-settings':
        return { title: 'Workspace Libraries', subtitle: 'Departments, Positions, and Question Bank', component: <TenantSettings /> };
      case 'clients':
        return { title: 'Client Tenants', subtitle: 'Manage multi-tenant client accounts and subscriptions', component: <ClientManagement /> };
      case 'settings':
        return { title: 'Settings', subtitle: 'Account preferences and AI keys', component: <Settings /> };
      default:
        return { title: 'Dashboard', subtitle: '', component: <Dashboard /> };
    }
  };

  const { title, subtitle, component } = getPageConfig();

  return (
    <MainLayout
      currentView={currentView}
      onNavigate={setCurrentView}
      title={title}
      subtitle={subtitle}
    >
      {component}
    </MainLayout>
  );
};

export default Index;
