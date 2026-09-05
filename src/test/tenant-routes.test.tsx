import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Index from '../pages/Index';
import { AuthProvider } from '../hooks/useAuth';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [] }),
          single: () => Promise.resolve({
            data: table === 'profiles' ? { id: 'mock-admin-id', email: 'admin@hiremate.ai', full_name: 'Admin' } : null,
            error: null
          }),
          maybeSingle: () => Promise.resolve({
            data: table === 'profiles' 
              ? { id: 'mock-admin-id', email: 'admin@hiremate.ai', full_name: 'Admin' } 
              : table === 'user_roles'
              ? { role: 'admin' }
              : null,
            error: null
          }),
        }),
        order: () => Promise.resolve({ data: [] }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({
        data: {
          session: {
            user: { id: 'mock-admin-id', email: 'admin@hiremate.ai' }
          }
        },
        error: null
      }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve(),
    },
  },
  getNeedsPasswordReset: () => false,
  isMockMode: () => false,
}));

describe('Direct URL Routing to Tenant Settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Tenant Settings Login & SSO tab directly at /settings/tenant?tab=login', async () => {
    render(
      <MemoryRouter initialEntries={['/settings/tenant?tab=login']}>
        <AuthProvider>
          <Routes>
            <Route path="/settings/tenant" element={<Index initialView="tenant-settings" />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should render TenantSettings and the Login tab without 404
    expect(await screen.findByText(/Login & SSO Policy/i)).toBeInTheDocument();
    expect(await screen.findByText(/1\. Universal Login/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Branded Subdomain/i)).toBeInTheDocument();
  });

  it('renders Tenant Settings AI BYOK tab directly at /settings/tenant?tab=ai', async () => {
    render(
      <MemoryRouter initialEntries={['/settings/tenant?tab=ai']}>
        <AuthProvider>
          <Routes>
            <Route path="/settings/tenant" element={<Index initialView="tenant-settings" />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Option A: HireSort Managed/i)).toBeInTheDocument();
    expect(screen.getByText(/Option B: Enterprise BYOK/i)).toBeInTheDocument();
  });
});
