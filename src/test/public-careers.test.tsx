import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PublicCareers from '../pages/PublicCareers';
import PublicJobApplication from '../pages/PublicJobApplication';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === 'clients') {
            return Promise.resolve({
              data: {
                id: '00000000-0000-0000-0000-000000000001',
                name: 'Zool',
                slug: 'zool',
                logo_url: 'https://hiresortai.zool.in/logos/zool-logo-dark.png',
                theme_color: '#2563eb',
                subscription_tier: 'enterprise',
              },
              error: null
            });
          }
          if (table === 'jobs') {
            return Promise.resolve({
              data: {
                id: '327d29eb-2660-47be-a55a-2b42c96b0f66',
                title: 'WordPress Developer (Custom Themes, Plugins & Headless)',
                department: 'Engineering',
                location: 'Bangalore, India (Hybrid)',
                type: 'full-time',
                salary: 'Competitive',
                description: '## About Zool\nAt Zool we craft high-performance digital platforms.\n\n## Key Responsibilities\n- Build custom themes and plugins',
                responsibilities: ['Build custom themes and plugins'],
                requirements: ['3+ years experience'],
                nice_to_have: ['Docker'],
                client_id: '00000000-0000-0000-0000-000000000001',
                is_public: true,
                slug: 'wordpress-developer-custom-themes-plugins-headless-unlz',
                custom_questions: [],
              },
              error: null
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
        then: vi.fn().mockImplementation((resolve: any) => {
          if (table === 'jobs') {
            return Promise.resolve({
              data: [
                {
                  id: '327d29eb-2660-47be-a55a-2b42c96b0f66',
                  title: 'WordPress Developer (Custom Themes, Plugins & Headless)',
                  department: 'Engineering',
                  location: 'Bangalore, India (Hybrid)',
                  type: 'full-time',
                  salary: 'Competitive',
                  description: '## About Zool\nAt Zool we craft high-performance digital platforms.',
                  client_id: '00000000-0000-0000-0000-000000000001',
                  is_public: true,
                  slug: 'wordpress-developer-custom-themes-plugins-headless-unlz',
                  status: 'active',
                }
              ],
              error: null
            }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        })
      };
      return builder;
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
  getNeedsPasswordReset: () => false,
  isMockMode: () => false,
}));

describe('Public Careers & Job Application Pages', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders PublicCareers page at /careers/zool without error', async () => {
    render(
      <MemoryRouter initialEntries={['/careers/zool']}>
        <Routes>
          <Route path="/careers/:clientSlug" element={<PublicCareers />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Careers/i).length).toBeGreaterThan(0);
    });
  });

  it('renders PublicJobApplication page at /careers/zool/wordpress-developer without error', async () => {
    render(
      <MemoryRouter initialEntries={['/careers/zool/wordpress-developer-custom-themes-plugins-headless-unlz']}>
        <Routes>
          <Route path="/careers/:clientSlug/:jobSlug" element={<PublicJobApplication />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/WordPress Developer/i)).toBeDefined();
    });
  });
});
