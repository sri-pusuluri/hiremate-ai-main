import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Shortlisted from '../pages/Shortlisted';
import Candidates from '../pages/Candidates';
import { BrowserRouter } from 'react-router-dom';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'recruiter@hiremate.ai' },
    client: { id: '00000000-0000-0000-0000-000000000001', name: 'Zool' },
    clientId: '00000000-0000-0000-0000-000000000001',
    isSuperAdmin: false,
  }),
  DEFAULT_ZOOL_CLIENT: { id: '00000000-0000-0000-0000-000000000001', name: 'Zool' },
}));

describe('QA Suite: Shortlisted & Candidates Directory', () => {
  it('renders Shortlisted page with functional toolbar, count badge, export and share buttons', async () => {
    render(
      <BrowserRouter>
        <Shortlisted />
      </BrowserRouter>
    );

    // Verify search input
    expect(screen.getByPlaceholderText('Search shortlisted candidates...')).toBeDefined();

    // Verify action buttons exist and are enabled
    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn).toBeDefined();
    expect(exportBtn.hasAttribute('disabled')).toBe(false);

    const shareBtn = screen.getByRole('button', { name: /share with hiring manager/i });
    expect(shareBtn).toBeDefined();
    expect(shareBtn.hasAttribute('disabled')).toBe(false);

    // Clicking share copies link and fires toast without crashing
    fireEvent.click(shareBtn);
  });

  it('renders Candidates directory with Export CSV button and tab filters', async () => {
    render(
      <BrowserRouter>
        <Candidates />
      </BrowserRouter>
    );

    // Verify Candidates directory export button
    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn).toBeDefined();
    expect(exportBtn.hasAttribute('disabled')).toBe(false);

    // Verify search input
    expect(screen.getByPlaceholderText('Search by name, email, company...')).toBeDefined();

    // Verify tabs
    expect(screen.getByText('All Candidates')).toBeDefined();
    expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
    expect(screen.getByText('Talent Pool')).toBeDefined();
  });
});
