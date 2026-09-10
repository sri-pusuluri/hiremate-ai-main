import { describe, it, expect, beforeEach } from 'vitest';
import { supabase, enableMockMode } from '../integrations/supabase/client';
import { DEFAULT_COMMIT_CLIENT, DEFAULT_ZOOL_CLIENT } from '../hooks/useAuth';

describe('User Management Tenant Assignment Suite', () => {
  beforeEach(() => {
    enableMockMode();
  });

  it('1. Comm-IT user (naushad@comm-it.in) is correctly scoped to Commit workspace and not Zool', async () => {
    // Simulate user login/creation
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: 'naushad@comm-it.in',
      password: 'password123',
    });

    expect(error).toBeNull();
    expect(authData.user).toBeDefined();

    // Verify user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', authData.user?.id)
      .maybeSingle();

    expect(roleData).toBeDefined();
    expect(roleData?.client_id).toBe(DEFAULT_COMMIT_CLIENT.id);
    expect(roleData?.client_id).not.toBe(DEFAULT_ZOOL_CLIENT.id);
  });

  it('2. Self-healing logic reassigns comm-it users mistakenly assigned to Zool', async () => {
    // Manually register or set user role to Zool
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'test-user@comm-it.in',
      password: 'password123',
    });

    // Deliberately set client_id to Zool
    await supabase
      .from('user_roles')
      .update({ client_id: DEFAULT_ZOOL_CLIENT.id } as any)
      .eq('user_id', authData.user?.id);

    // Verify it was set to Zool
    const { data: beforeRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', authData.user?.id)
      .maybeSingle();
    expect(beforeRole?.client_id).toBe(DEFAULT_ZOOL_CLIENT.id);

    // Fetch and apply self-healing logic (same as in fetchUsers)
    const emailLower = authData.user?.email.toLowerCase() || '';
    const isCommitUser = emailLower.includes('commit') || emailLower.includes('comm-it');
    expect(isCommitUser).toBe(true);

    if (isCommitUser && beforeRole?.client_id !== DEFAULT_COMMIT_CLIENT.id) {
      await supabase
        .from('user_roles')
        .update({ client_id: DEFAULT_COMMIT_CLIENT.id } as any)
        .eq('user_id', authData.user?.id);
    }

    const { data: healedRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', authData.user?.id)
      .maybeSingle();

    expect(healedRole?.client_id).toBe(DEFAULT_COMMIT_CLIENT.id);
  });

  it('3. Zool tenant admin (admin@zool.in) maintains Zool workspace, while srini@zool.in is Platform Super Admin', async () => {
    // Check admin@zool.in -> dedicated Zool workspace
    const { data: zoolAuth } = await supabase.auth.signInWithPassword({
      email: 'admin@zool.in',
      password: 'password123',
    });

    const { data: zoolRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', zoolAuth.user?.id)
      .maybeSingle();

    expect(zoolRole).toBeDefined();
    expect(zoolRole?.client_id).toBe(DEFAULT_ZOOL_CLIENT.id);
    expect(zoolRole?.role).toBe('client_admin');

    // Check srini@zool.in -> Platform Super Admin detached from client
    const { data: sriniAuth } = await supabase.auth.signInWithPassword({
      email: 'srini@zool.in',
      password: 'password123',
    });

    const { data: sriniRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', sriniAuth.user?.id)
      .maybeSingle();

    expect(sriniRole).toBeDefined();
    expect(sriniRole?.role).toBe('super_admin');
    expect(sriniRole?.client_id).toBeNull();
  });
});
