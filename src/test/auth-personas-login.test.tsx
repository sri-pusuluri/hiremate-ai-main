import { describe, it, expect, beforeEach } from 'vitest';
import { supabase, enableMockMode } from '../integrations/supabase/client';
import { 
  DEFAULT_COMMIT_CLIENT, 
  DEFAULT_ZOOL_CLIENT, 
  HIRESORT_PLATFORM_CLIENT 
} from '../hooks/useAuth';

describe('All Demo Personas Authentication Suite', () => {
  beforeEach(() => {
    enableMockMode();
  });

  it('1. SuperAdmin (admin@hiremate.ai) logs in cleanly with super_admin privileges', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@hiremate.ai',
      password: 'anypassword123',
    });

    expect(error).toBeNull();
    expect(data.session).toBeDefined();
    expect(data.user?.email).toBe('admin@hiremate.ai');

    // Verify role in user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', data.user?.id)
      .maybeSingle();

    expect(roleData).toBeDefined();
    expect(roleData?.role).toBe('super_admin');
    expect(roleData?.client_id).toBeNull();
  });

  it('2. Commit Admin (admin@commit.com) logs in cleanly and scopes to Commit workspace', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@commit.com',
      password: 'anypassword123',
    });

    expect(error).toBeNull();
    expect(data.session).toBeDefined();
    expect(data.user?.email).toBe('admin@commit.com');

    // Verify role in user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', data.user?.id)
      .maybeSingle();

    expect(roleData).toBeDefined();
    expect(roleData?.role).toBe('client_admin');
    expect(roleData?.client_id).toBe(DEFAULT_COMMIT_CLIENT.id);
  });

  it('3. Zool Admin (admin@zool.in) logs in cleanly and scopes to Zool workspace', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@zool.in',
      password: 'anypassword123',
    });

    expect(error).toBeNull();
    expect(data.session).toBeDefined();
    expect(data.user?.email).toBe('admin@zool.in');

    // Verify role in user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', data.user?.id)
      .maybeSingle();

    expect(roleData).toBeDefined();
    expect(roleData?.role).toBe('client_admin');
    expect(roleData?.client_id).toBe(DEFAULT_ZOOL_CLIENT.id);
  });

  it('4. Recruiter (recruiter@hiremate.ai) logs in cleanly with recruiter role', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'recruiter@hiremate.ai',
      password: 'anypassword123',
    });

    expect(error).toBeNull();
    expect(data.session).toBeDefined();
    expect(data.user?.email).toBe('recruiter@hiremate.ai');

    // Verify role in user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', data.user?.id)
      .maybeSingle();

    expect(roleData).toBeDefined();
    expect(roleData?.role).toBe('recruiter');
  });

  it('5. Signing out cleans up session', async () => {
    const { error } = await supabase.auth.signOut();
    expect(error).toBeNull();

    const { data } = await supabase.auth.getSession();
    expect(data.session).toBeNull();
  });

  it('6. Registering onAuthStateChange does NOT emit SIGNED_OUT when initial session is null', async () => {
    let receivedEvent: string | null = null;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      receivedEvent = event;
    });

    await new Promise(r => setTimeout(r, 20));
    expect(receivedEvent).not.toBe('SIGNED_OUT');
    subscription.unsubscribe();
  });
});
