import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TenantSettings from '../pages/TenantSettings';
import { AuthProvider } from '../hooks/useAuth';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [] }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        order: () => Promise.resolve({ data: [] }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
  getNeedsPasswordReset: () => false,
}));

describe('TenantSettings Component & Tab Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderComponent = (initialPath = '/settings/tenant') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <TenantSettings />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('renders header, live careers link, and enterprise tabs', async () => {
    renderComponent();

    expect(screen.getByText(/Workspace Settings & Enterprise Config/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /REST API & Webhooks/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /AI Strategy \(BYOK\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Login & SSO Policy/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Database Isolation/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Audit Trail/i })).toBeInTheDocument();
  });

  it('displays REST API key and MCP server endpoint on default tab', async () => {
    renderComponent();

    expect(screen.getByText(/Tenant Scoped REST API Key/i)).toBeInTheDocument();
    expect(screen.getByText(/Inbound ATS \/ ERP Webhook Receiver URL/i)).toBeInTheDocument();
    expect(screen.getByText(/Model Context Protocol \(MCP\) Gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/Fetch Jobs from ERP/i)).toBeInTheDocument();
  });

  it('renders AI Strategy (BYOK) tab with Option A and Option B', async () => {
    renderComponent('/settings/tenant?tab=ai');

    expect(screen.getByText(/Option A: HireSort Managed/i)).toBeInTheDocument();
    expect(screen.getByText(/Option B: Enterprise BYOK/i)).toBeInTheDocument();

    // Toggle to Option B
    const optionBCard = screen.getByTestId('option-b-card');
    fireEvent.click(optionBCard);

    // Verify BYOK configuration input appears with correct placeholder
    await waitFor(() => {
      expect(screen.getByTestId('byok-api-key-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/sk-corp-\.\.\./i)).toBeInTheDocument();
    });
  });

  it('renders Login & SSO Policy tab with 3 architectural options', async () => {
    renderComponent('/settings/tenant?tab=login');

    expect(screen.getByText(/1\. Universal Login/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Branded Subdomain/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Enterprise SAML SSO/i)).toBeInTheDocument();
  });

  it('renders Database Isolation tab with 3 architectural tiers', async () => {
    renderComponent('/settings/tenant?tab=db');

    expect(screen.getByText(/Tier 1: Pooled Database \(RLS\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Tier 2: Schema per Tenant/i)).toBeInTheDocument();
    expect(screen.getByText(/Tier 3: Dedicated Silo \/ BYOD/i)).toBeInTheDocument();
  });

  it('renders Audit Trail tab with export audit log button', async () => {
    renderComponent('/settings/tenant?tab=audit');

    expect(screen.getByText(/Compliance Audit Trail & Event Logs/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Export Audit Log/i).length).toBeGreaterThan(0);
  });

  it('renders Branding tab with logo uploader and preset logos', async () => {
    renderComponent('/settings/tenant?tab=branding');

    expect(screen.getByText(/Company Logo \/ Branding/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Logo/i)).toBeInTheDocument();
    expect(screen.getByText(/Or choose from professional presets:/i)).toBeInTheDocument();
    expect(screen.getByText(/Tech Hexagon/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Spark/i)).toBeInTheDocument();
  });
});
