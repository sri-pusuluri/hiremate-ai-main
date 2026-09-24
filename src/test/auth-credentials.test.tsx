import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Auth from '../pages/Auth';
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
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
  isMockMode: () => false,
  enableMockMode: vi.fn(),
  disableMockMode: vi.fn(),
  getNeedsPasswordReset: () => false,
}));

describe('Auth Login Screen Demo Credentials', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderComponent = (initialEntry = '/auth') => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Auth />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('hides demo credential cards on public auth login form by default', async () => {
    renderComponent('/auth');

    expect(await screen.findByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.queryByText(/Demo Credentials/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1-click autofill/i)).not.toBeInTheDocument();
  });

  it('renders Admin and Recruiter demo credential cards when ?demo=true is provided', async () => {
    renderComponent('/auth?demo=true');

    expect(await screen.findByText(/Demo Credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/1-click autofill/i)).toBeInTheDocument();
    expect(screen.getByText('admin@hiremate.ai')).toBeInTheDocument();
    expect(screen.getByText('recruiter@hiremate.ai')).toBeInTheDocument();
  });

  it('autofills Admin credentials when Admin card is clicked in demo mode', async () => {
    renderComponent('/auth?demo=true');

    await screen.findByText(/Demo Credentials/i);
    const adminButton = screen.getByText('admin@hiremate.ai').closest('button');
    expect(adminButton).not.toBeNull();
    fireEvent.click(adminButton!);

    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;

    expect(emailInput.value).toBe('admin@hiremate.ai');
    expect(passwordInput.value).toBe('admin123');
  });

  it('autofills Recruiter credentials when Recruiter card is clicked in demo mode', async () => {
    renderComponent('/auth?demo=true');

    await screen.findByText(/Demo Credentials/i);
    const recruiterButton = screen.getByText('recruiter@hiremate.ai').closest('button');
    expect(recruiterButton).not.toBeNull();
    fireEvent.click(recruiterButton!);

    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;

    expect(emailInput.value).toBe('recruiter@hiremate.ai');
    expect(passwordInput.value).toBe('recruiter123');
  });
});
