import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Auth from '../pages/Auth';
import CompanyOnboarding from '../pages/CompanyOnboarding';
import NotFound from '../pages/NotFound';
import { AuthProvider } from '../hooks/useAuth';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
      signOut: vi.fn(),
    },
  },
  isMockMode: () => false,
  enableMockMode: vi.fn(),
  disableMockMode: vi.fn(),
  getNeedsPasswordReset: () => false,
}));

describe('Company Onboarding & Streamlined Auth Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders streamlined Sign In form with B2B Create Company Workspace CTA on /auth', async () => {
    render(
      <MemoryRouter initialEntries={['/auth']}>
        <AuthProvider>
          <Auth />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.queryByText(/Demo Credentials/i)).not.toBeInTheDocument();
    expect(screen.getByText(/New Organization\?/i)).toBeInTheDocument();

    const ctaButton = screen.getByRole('link', { name: /Create Company Workspace/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton.getAttribute('href')).toBe('/onboarding');
  });

  it('renders Step 1 (Admin Account) in CompanyOnboarding wizard', () => {
    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <AuthProvider>
          <CompanyOnboarding />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Create your Company Workspace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Work Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
  });

  it('correctly matches /onboarding route and does not fall through to 404 NotFound', () => {
    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<CompanyOnboarding />} />
            <Route path="/signup" element={<CompanyOnboarding />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText(/Oops! Page not found/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Create your Company Workspace/i)).toBeInTheDocument();
  });

  it('advances through Step 1 to Step 2 (Company Details) and Step 3 (AI Strategy)', async () => {
    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <AuthProvider>
          <CompanyOnboarding />
        </AuthProvider>
      </MemoryRouter>
    );

    // Fill Step 1
    fireEvent.change(screen.getByLabelText(/Your Full Name/i), { target: { value: 'Sarah Connor' } });
    fireEvent.change(screen.getByLabelText(/Work Email Address/i), { target: { value: 'sarah@skynet-resistance.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'secret123' } });

    // Click Continue
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Now on Step 2
    await waitFor(() => {
      expect(screen.getByLabelText(/Company Legal or Brand Name/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Public Careers Portal URL/i)).toBeInTheDocument();

    // Fill company name, auto-slug should update
    fireEvent.change(screen.getByLabelText(/Company Legal or Brand Name/i), { target: { value: 'Acme Robotics' } });

    // Click Continue to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Now on Step 3: AI Inference & Subscription Tier
    await waitFor(() => {
      expect(screen.getByText(/AI Inference & Architecture Strategy/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Option A: HireSort Managed/i)).toBeInTheDocument();
    expect(screen.getByText(/Option B: Enterprise BYOK/i)).toBeInTheDocument();
    expect(screen.getByText(/Starter/i)).toBeInTheDocument();
    expect(screen.getByText(/Professional/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Enterprise/i).length).toBeGreaterThanOrEqual(1);
    const submitBtn = screen.getByRole('button', { name: /Submit/i });
    expect(submitBtn).toBeInTheDocument();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Workspace Request Submitted!/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending SuperAdmin Approval/i)).toBeInTheDocument();
      expect(screen.getByText(/Return to Sign In/i)).toBeInTheDocument();
    });
  });
});
