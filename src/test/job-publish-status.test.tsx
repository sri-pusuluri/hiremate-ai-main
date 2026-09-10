import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { JobDashboard } from '../components/flows/JobDashboard';

// Mock test jobs
const initialJobs = [
  {
    id: 'job-pub-1',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Bangalore, India',
    type: 'full-time',
    status: 'active',
    is_public: true,
    candidateCount: 8,
    hire_sort_enabled: true,
    salary: '₹35-50 LPA',
    created_at: '2026-08-29T00:00:00.000Z'
  },
  {
    id: 'job-priv-2',
    title: 'Staff Security Engineer',
    department: 'Security',
    location: 'Remote',
    type: 'full-time',
    status: 'active',
    is_public: false,
    candidateCount: 2,
    hire_sort_enabled: false,
    salary: '$150,000 - $180,000',
    created_at: '2026-08-30T00:00:00.000Z'
  }
];

let mockDbJobs = [...initialJobs];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'jobs') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockDbJobs, error: null }),
            then: (cb: any) => Promise.resolve({ data: mockDbJobs, error: null }).then(cb)
          }),
          update: (payload: any) => ({
            eq: (_field: string, id: string) => {
              mockDbJobs = mockDbJobs.map(j => j.id === id ? { ...j, ...payload } : j);
              return Promise.resolve({ error: null });
            }
          })
        };
      }
      if (table === 'candidates') {
        return {
          select: () => Promise.resolve({ data: [], error: null })
        };
      }
      if (table === 'profiles') {
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

describe('Job Publish Status Suite', () => {
  beforeEach(() => {
    mockDbJobs = [...initialJobs];
    localStorage.clear();
  });

  it('1. Job Cards display publish status pills for both published and unpublished jobs', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <JobDashboard onSelectJob={() => {}} onEnableHireSort={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
      expect(screen.getByText('Staff Security Engineer')).toBeInTheDocument();
    });

    // Public job displays "Public Careers"
    expect(screen.getByText('Public Careers')).toBeInTheDocument();

    // Unpublished job displays "Unpublished"
    expect(screen.getByText('Unpublished')).toBeInTheDocument();
  });

  it('2. Clicking on the publish status pill toggles is_public state live', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <JobDashboard onSelectJob={() => {}} onEnableHireSort={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Staff Security Engineer')).toBeInTheDocument();
    });

    const unpublishedBtn = screen.getByText('Unpublished');
    expect(unpublishedBtn).toBeInTheDocument();

    // Click to publish the job
    fireEvent.click(unpublishedBtn);

    // It should immediately toggle to "Public Careers"
    await waitFor(() => {
      expect(screen.getAllByText('Public Careers')).toHaveLength(2);
    });
  });
});
