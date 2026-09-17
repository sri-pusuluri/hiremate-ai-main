import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Shortlisted from '../pages/Shortlisted';
import Candidates from '../pages/Candidates';
import { BrowserRouter } from 'react-router-dom';
import { getAppBaseUrl, APP_BASE_URL } from '../lib/app-url';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'recruiter@hiremate.ai' },
    client: { id: '00000000-0000-0000-0000-000000000001', name: 'Zool', slug: 'zool' },
    clientId: '00000000-0000-0000-0000-000000000001',
    isSuperAdmin: false,
  }),
  DEFAULT_ZOOL_CLIENT: { id: '00000000-0000-0000-0000-000000000001', name: 'Zool', slug: 'zool' },
}));

describe('QA Suite: Production URLs & Shortlisted/Candidates Directory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Verifies hosted production base URL strictly resolves to https://hiresortai.zool.in', () => {
    expect(APP_BASE_URL).toBe('https://hiresortai.zool.in');
    expect(getAppBaseUrl()).toBe('https://hiresortai.zool.in');
  });

  it('2. Renders Shortlisted page with functional toolbar, count badge, export and share buttons using valid hosted URL', async () => {
    // Mock navigator.clipboard.writeText
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

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

    // Clicking share copies link with valid hosted production domain
    fireEvent.click(shareBtn);
    expect(writeTextMock).toHaveBeenCalledWith('https://hiresortai.zool.in/shortlisted?filterJob=all');
  });

  it('3. Renders Candidates directory with Export CSV button, Add Candidate button, and tab filters', async () => {
    render(
      <BrowserRouter>
        <Candidates />
      </BrowserRouter>
    );

    // Verify Candidates directory export button
    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn).toBeDefined();
    expect(exportBtn.hasAttribute('disabled')).toBe(false);

    // Verify Add Candidate button
    const addBtn = screen.getByRole('button', { name: /add candidate/i });
    expect(addBtn).toBeDefined();
    expect(addBtn.hasAttribute('disabled')).toBe(false);

    // Verify search input
    expect(screen.getByPlaceholderText('Search by name, email, company...')).toBeDefined();

    // Verify tabs
    expect(screen.getByText('All Candidates')).toBeDefined();
    expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
    expect(screen.getByText('Talent Pool')).toBeDefined();

    // Clicking Add Candidate opens modal
    fireEvent.click(addBtn);
    await waitFor(() => {
      expect(screen.getByText('Add Candidate & Evaluate ATS')).toBeDefined();
    });
  });

  it('4. Verifies production careers and embed URL schemas use https://hiresortai.zool.in', () => {
    const slug = 'zool';
    const careersUrl = `${getAppBaseUrl()}/careers/${slug}`;
    const embedUrl = `${getAppBaseUrl()}/embed/careers/${slug}`;
    const ssoCallbackUrl = `${getAppBaseUrl()}/auth/v1/sso/callback`;

    expect(careersUrl).toBe('https://hiresortai.zool.in/careers/zool');
    expect(embedUrl).toBe('https://hiresortai.zool.in/embed/careers/zool');
    expect(ssoCallbackUrl).toBe('https://hiresortai.zool.in/auth/v1/sso/callback');
  });
});
