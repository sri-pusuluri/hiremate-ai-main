import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Workflow from '@/pages/Workflow';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'admin@hiresort.ai' },
    profile: { full_name: 'Admin User', email: 'admin@hiresort.ai' },
    client: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Zool',
      slug: 'zool',
      themeColor: '#2563eb',
      subscriptionTier: 'pro'
    },
    clientId: '00000000-0000-0000-0000-000000000001',
    role: 'admin',
    isAdmin: true,
    isSuperAdmin: true,
    isClientAdmin: false,
    loading: false,
    signOut: vi.fn(),
  }),
  DEFAULT_ZOOL_CLIENT: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Zool',
    slug: 'zool',
    themeColor: '#2563eb',
    subscriptionTier: 'pro'
  },
  DEFAULT_COMMIT_CLIENT: {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Commit',
    slug: 'commit',
    themeColor: '#f97316',
    subscriptionTier: 'enterprise'
  },
  HIRESORT_PLATFORM_CLIENT: {
    id: 'hiresort-platform-hq',
    name: 'HireSort Platform HQ',
    slug: 'platform',
    themeColor: '#7c3aed',
    subscriptionTier: 'enterprise'
  }
}));

describe('Workflow & Operations Hub Page', () => {
  it('renders page banner and all 5 navigation tabs', () => {
    render(
      <BrowserRouter>
        <Workflow />
      </BrowserRouter>
    );

    expect(screen.getByText(/HireSort AI Operational Workflow & Blueprint/i)).toBeInTheDocument();
    expect(screen.getByText(/1. Hiring Lifecycle/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Architecture & Data/i)).toBeInTheDocument();
    expect(screen.getByText(/3. Role Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/4. Live Simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/5. Data Dictionary/i)).toBeInTheDocument();
  });

  it('navigates through the 8 lifecycle stages on tab 1', () => {
    render(
      <BrowserRouter>
        <Workflow />
      </BrowserRouter>
    );

    // Initial stage is Stage 1
    expect(screen.getByText(/Stage 1: Requisition/i)).toBeInTheDocument();
    expect(screen.getByText(/Job Architecture & Multi-Tenant Publishing/i)).toBeInTheDocument();

    // Click Next Stage
    const nextBtn = screen.getByRole('button', { name: /Next Stage/i });
    fireEvent.click(nextBtn);

    // Should now show Stage 2
    expect(screen.getByText(/Stage 2: Sourcing/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Channel Candidate Application & Ingestion/i)).toBeInTheDocument();
  });

  it('renders Architecture tab and shows tech layers', () => {
    render(
      <BrowserRouter>
        <Workflow defaultTab="architecture" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Single Page Web App & Portals/i)).toBeInTheDocument();
    expect(screen.getByText(/Semantic Cosine Vector Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL Multi-Tenant Database/i)).toBeInTheDocument();
  });

  it('renders Role Matrix tab and displays permission comparison', () => {
    render(
      <BrowserRouter>
        <Workflow defaultTab="roles" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Operational Permissions Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Client Tenants & Subscriptions/i)).toBeInTheDocument();
    expect(screen.getByText(/Create, Edit & Publish Job Requisitions/i)).toBeInTheDocument();
  });

  it('renders Live Simulator and executes simulated candidate pipeline', () => {
    render(
      <BrowserRouter>
        <Workflow defaultTab="simulator" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Simulation Parameters/i)).toBeInTheDocument();
    expect(screen.getByText(/Real-Time Pipeline Execution Trace/i)).toBeInTheDocument();

    const runBtn = screen.getByRole('button', { name: /Run Pipeline Simulation/i });
    fireEvent.click(runBtn);

    // Immediate state after running
    expect(screen.getByText(/1. Public Form Submission/i)).toBeInTheDocument();
  });

  it('renders Data Dictionary tab and lists database tables', () => {
    render(
      <BrowserRouter>
        <Workflow defaultTab="dictionary" />
      </BrowserRouter>
    );

    expect(screen.getByText(/public.jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/public.candidates/i)).toBeInTheDocument();
    expect(screen.getByText(/public.audit_logs/i)).toBeInTheDocument();
  });
});
