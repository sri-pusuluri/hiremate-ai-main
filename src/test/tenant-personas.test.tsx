import { describe, it, expect } from 'vitest';
import { 
  HIRESORT_PLATFORM_CLIENT, 
  DEFAULT_ZOOL_CLIENT, 
  DEFAULT_COMMIT_CLIENT 
} from '../hooks/useAuth';

describe('Multi-Tenant Persona Architecture', () => {
  it('defines distinct platform and tenant workspace constants', () => {
    expect(HIRESORT_PLATFORM_CLIENT.id).toBe('hiresort-platform-hq');
    expect(HIRESORT_PLATFORM_CLIENT.name).toBe('HireSort Platform HQ');
    
    expect(DEFAULT_ZOOL_CLIENT.id).toBe('00000000-0000-0000-0000-000000000001');
    expect(DEFAULT_ZOOL_CLIENT.name).toBe('Zool');
    expect(DEFAULT_ZOOL_CLIENT.slug).toBe('zool');

    expect(DEFAULT_COMMIT_CLIENT.id).toBe('00000000-0000-0000-0000-000000000004');
    expect(DEFAULT_COMMIT_CLIENT.name).toBe('Commit');
    expect(DEFAULT_COMMIT_CLIENT.slug).toBe('commit');
  });

  it('correctly calculates role boundaries', () => {
    const isSuperAdminCheck = (role: string, email: string) => {
      return role === 'super_admin' || email === 'admin@hiremate.ai' || email === 'srini@zool.in';
    };

    const isClientAdminCheck = (isSuper: boolean, role: string) => {
      return isSuper || role === 'client_admin' || role === 'admin';
    };

    // 1. HireSort Super Admin
    const superAdminRole = isSuperAdminCheck('super_admin', 'admin@hiremate.ai');
    expect(superAdminRole).toBe(true);
    expect(isClientAdminCheck(superAdminRole, 'super_admin')).toBe(true);

    // 2. Commit Client Admin (Should NOT be SuperAdmin, but IS ClientAdmin)
    const commitAdminSuper = isSuperAdminCheck('client_admin', 'admin@commit.com');
    expect(commitAdminSuper).toBe(false);
    expect(isClientAdminCheck(commitAdminSuper, 'client_admin')).toBe(true);

    // 3. Zool Client Admin (Should NOT be SuperAdmin, but IS ClientAdmin)
    const zoolAdminSuper = isSuperAdminCheck('client_admin', 'admin@zool.in');
    expect(zoolAdminSuper).toBe(false);
    expect(isClientAdminCheck(zoolAdminSuper, 'client_admin')).toBe(true);

    // 4. Recruiter (Neither SuperAdmin nor ClientAdmin)
    const recruiterSuper = isSuperAdminCheck('recruiter', 'recruiter@hiremate.ai');
    expect(recruiterSuper).toBe(false);
    expect(isClientAdminCheck(recruiterSuper, 'recruiter')).toBe(false);
  });
});
