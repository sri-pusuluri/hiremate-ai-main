import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { JobDashboard } from '../components/flows/JobDashboard';

// Mock DB jobs where expiry is in 2027 but status was marked inactive
const initialJobs = [
  {
    id: 'job-mean-1',
    title: 'MEAN Stack Developer (Angular, React, Node.js, MongoDB)',
    department: 'Engineering',
    location: 'Bangalore, India (Hybrid)',
    type: 'full-time',
    status: 'inactive',
    expires_at: '2027-01-01T23:59:59.000Z',
    is_public: true,
    candidateCount: 20,
    hire_sort_enabled: true,
    salary: 'Competitive',
    created_at: '2026-09-11T00:00:00.000Z'
  },
  {
    id: 'job-wp-2',
    title: 'WordPress Developer (Custom Themes, Plugins & Headless)',
    department: 'Engineering',
    location: 'Bangalore, India (Hybrid)',
    type: 'full-time',
    status: 'inactive',
    expires_at: '2027-01-01T23:59:59.000Z',
    is_public: true,
    candidateCount: 21,
    hire_sort_enabled: true,
    salary: 'Competitive',
    created_at: '2026-09-11T00:00:00.000Z'
  }
];

let mockDbJobs = [...initialJobs];
let updatedPayloads: any[] = [];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'jobs') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockDbJobs, error: null }),
            then: (cb: any) => Promise.resolve({ data: mockDbJobs, error: null }).then(cb)
          }),
          update: (payload: any) => {
            updatedPayloads.push(payload);
            return {
              eq: (_field: string, id: string) => {
                mockDbJobs = mockDbJobs.map(j => j.id === id ? { ...j, ...payload } : j);
                return Promise.resolve({ error: null });
              },
              in: (_field: string, ids: string[]) => {
                mockDbJobs = mockDbJobs.map(j => ids.includes(j.id) ? { ...j, ...payload } : j);
                return Promise.resolve({ error: null });
              }
            };
          }
        };
      }
      if (table === 'candidates' || table === 'profiles') {
        return {
          select: () => Promise.resolve({ data: [], error: null })
        };
      }
      return {
        select: () => Promise.resolve({ data: [], error: null })
      };
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  },
  getNeedsPasswordReset: () => false,
  enableMockMode: () => {}
}));

import { AuthProvider } from '../hooks/useAuth';

describe('Job Expiry & Reactivation Suite', () => {
  beforeEach(() => {
    mockDbJobs = JSON.parse(JSON.stringify(initialJobs));
    updatedPayloads = [];
    localStorage.clear();
  });

  it('1. Displays extended postings notice banner and Make Active buttons when postings have future expiry dates', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <JobDashboard onSelectJob={() => {}} onEnableHireSort={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('MEAN Stack Developer (Angular, React, Node.js, MongoDB)')).toBeInTheDocument();
    });

    // Should detect extended expiry dates (2027) with inactive status and show the notice banner
    expect(screen.getByText(/Extended expiry date detected/i)).toBeInTheDocument();
    expect(screen.getByText('Activate All Extended Postings')).toBeInTheDocument();

    // Each inactive card should render a direct "Make Active" button
    const makeActiveButtons = screen.getAllByText('Make Active');
    expect(makeActiveButtons.length).toBe(2);
  });

  it('2. Clicking "Make Active" directly updates the job status to active in Supabase and UI', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <JobDashboard onSelectJob={() => {}} onEnableHireSort={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('MEAN Stack Developer (Angular, React, Node.js, MongoDB)')).toBeInTheDocument();
    });

    const makeActiveButtons = screen.getAllByText('Make Active');
    fireEvent.click(makeActiveButtons[0]);

    await waitFor(() => {
      // Check that supabase.from('jobs').update was invoked with status: 'active'
      const statusUpdate = updatedPayloads.find(p => p.status === 'active');
      expect(statusUpdate).toBeDefined();
    });
  });

  it('3. Clicking "Activate All Extended Postings" batch-activates all unexpired inactive jobs', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <JobDashboard onSelectJob={() => {}} onEnableHireSort={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Activate All Extended Postings')).toBeInTheDocument();
    });

    const activateAllBtn = screen.getByText('Activate All Extended Postings');
    fireEvent.click(activateAllBtn);

    await waitFor(() => {
      expect(mockDbJobs.every(j => j.status === 'active')).toBe(true);
    });
  });
});
