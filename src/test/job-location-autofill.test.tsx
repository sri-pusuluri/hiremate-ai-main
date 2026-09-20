import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CreateJobModal } from '@/components/ats/CreateJobModal';
import { ALL_LOCATION_PRESETS, WORKPLACE_MODES, MAJOR_TECH_HUBS, INDIAN_STATES, COUNTRIES } from '@/lib/location-presets';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'test@example.com' },
    tenant: { id: 'demo-tenant', name: 'Demo Tenant', slug: 'demo' },
    role: 'admin',
    members: [],
  }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
    }),
  },
}));

describe('Job Location Presets & Autofill Suite', () => {
  it('contains comprehensive global location categories', () => {
    expect(WORKPLACE_MODES.length).toBeGreaterThanOrEqual(5);
    expect(MAJOR_TECH_HUBS.length).toBeGreaterThanOrEqual(20);
    expect(INDIAN_STATES.length).toBeGreaterThanOrEqual(25);
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(30);
    expect(ALL_LOCATION_PRESETS.length).toBeGreaterThan(80);

    // Verify key locations exist
    expect(ALL_LOCATION_PRESETS).toContain('Bangalore, Karnataka, India (Hybrid)');
    expect(ALL_LOCATION_PRESETS).toContain('San Francisco, CA, United States (Hybrid)');
    expect(ALL_LOCATION_PRESETS).toContain('Remote (Worldwide)');
    expect(ALL_LOCATION_PRESETS).toContain('Dubai, United Arab Emirates (Hybrid)');
  });

  it('renders CreateJobModal with datalist and quick location selector buttons', () => {
    render(
      <CreateJobModal
        open={true}
        onOpenChange={() => {}}
      />
    );

    const locationInput = screen.getByLabelText(/Location \*/i) as HTMLInputElement;
    expect(locationInput).toBeDefined();
    expect(locationInput.getAttribute('list')).toBe('global-locations-datalist');

    // Datalist should exist in DOM with presets
    const datalist = document.getElementById('global-locations-datalist');
    expect(datalist).not.toBeNull();
    expect(datalist?.children.length).toBe(ALL_LOCATION_PRESETS.length);

    // Quick pills should be present
    const remoteQuickBtn = screen.getByRole('button', { name: /^Remote$/i });
    expect(remoteQuickBtn).toBeDefined();

    fireEvent.click(remoteQuickBtn);
    expect(locationInput.value).toBe('Remote (Worldwide)');
  });

  it('allows manual input and autofill typing in Location input', () => {
    render(
      <CreateJobModal
        open={true}
        onOpenChange={() => {}}
      />
    );

    const locationInput = screen.getByLabelText(/Location \*/i) as HTMLInputElement;
    fireEvent.change(locationInput, { target: { value: 'Bangalore, Karnataka, India (Hybrid)' } });
    expect(locationInput.value).toBe('Bangalore, Karnataka, India (Hybrid)');
  });
});
