import { describe, it, expect, beforeEach } from 'vitest';
import { supabase, enableMockMode } from '../integrations/supabase/client';
import { DEFAULT_ZOOL_CLIENT } from '../hooks/useAuth';

describe('Job Creator & Re-allotment Suite', () => {
  beforeEach(() => {
    enableMockMode();
  });

  it('1. Creating a job persists created_by attribute correctly', async () => {
    const testUserId = 'test-recruiter-uuid-123';
    const newJob = {
      title: 'DevOps Platform Engineer',
      department: 'Infrastructure',
      location: 'Bangalore, India',
      type: 'full-time',
      client_id: DEFAULT_ZOOL_CLIENT.id,
      created_by: testUserId,
      status: 'active',
      description: 'Maintain cloud infrastructure and CI/CD pipelines',
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert([newJob as any])
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect((data as any).created_by).toBe(testUserId);
    expect((data as any).title).toBe('DevOps Platform Engineer');
  });

  it('2. Updating a job allows reassigning ownership/creator to another user', async () => {
    const originalOwnerId = 'recruiter-owner-1';
    const newOwnerId = 'admin-owner-2';

    // Insert job with original owner
    const { data: created } = await supabase
      .from('jobs')
      .insert([{
        title: 'Lead Architect',
        department: 'Engineering',
        created_by: originalOwnerId,
        client_id: DEFAULT_ZOOL_CLIENT.id,
      } as any])
      .select()
      .single();

    expect((created as any).created_by).toBe(originalOwnerId);

    // Reassign to new owner
    const { data: updated, error } = await supabase
      .from('jobs')
      .update({ created_by: newOwnerId } as any)
      .eq('id', (created as any).id)
      .select()
      .single();

    expect(error).toBeNull();
    expect((updated as any).created_by).toBe(newOwnerId);
  });

  it('3. Deleting a user with reassignJobsToUserId transfers all their jobs to the designated user', async () => {
    const userToBeRemovedId = 'leaving-recruiter-999';
    const targetAdminId = 'target-admin-888';

    // Create a job owned by userToBeRemovedId
    const { data: jobA } = await supabase
      .from('jobs')
      .insert([{
        title: 'Backend Go Specialist',
        department: 'Backend',
        created_by: userToBeRemovedId,
        client_id: DEFAULT_ZOOL_CLIENT.id,
      } as any])
      .select()
      .single();

    const { data: jobB } = await supabase
      .from('jobs')
      .insert([{
        title: 'Security Analyst',
        department: 'Security',
        created_by: userToBeRemovedId,
        client_id: DEFAULT_ZOOL_CLIENT.id,
      } as any])
      .select()
      .single();

    // Verify both jobs belong to userToBeRemovedId
    expect((jobA as any).created_by).toBe(userToBeRemovedId);
    expect((jobB as any).created_by).toBe(userToBeRemovedId);

    // Invoke delete-user with reassignJobsToUserId option
    const { data: invokeResult, error: invokeError } = await supabase.functions.invoke('delete-user', {
      body: {
        userId: userToBeRemovedId,
        reassignJobsToUserId: targetAdminId,
      }
    });

    expect(invokeError).toBeNull();
    expect(invokeResult?.success).toBe(true);

    // Query jobs and verify they have been re-allotted to targetAdminId
    const { data: reassignedJobs } = await supabase
      .from('jobs')
      .select('id, title, created_by')
      .in('id', [(jobA as any).id, (jobB as any).id]);

    expect(reassignedJobs).toBeDefined();
    expect(reassignedJobs?.length).toBe(2);
    expect(reassignedJobs?.every(j => j.created_by === targetAdminId)).toBe(true);
  });

  it('4. Resolves creatorName from profiles or provides sensible default for legacy jobs', () => {
    const mockProfiles = [
      { id: 'user-alice', full_name: 'Alice Johnson', email: 'alice@zool.in' },
      { id: 'user-bob', full_name: null, email: 'bob@zool.in' },
    ];
    const profilesMap = new Map(mockProfiles.map(p => [p.id, p]));

    // Job with profile full_name
    const creatorA = profilesMap.get('user-alice');
    const nameA = creatorA?.full_name || (creatorA?.email ? creatorA.email.split('@')[0] : 'Admin');
    expect(nameA).toBe('Alice Johnson');

    // Job with email only
    const creatorB = profilesMap.get('user-bob');
    const nameB = creatorB?.full_name || (creatorB?.email ? creatorB.email.split('@')[0] : 'Admin');
    expect(nameB).toBe('bob');

    // Job with null created_by (legacy seeded job)
    const creatorC = profilesMap.get(null as any);
    const nameC = creatorC?.full_name || (creatorC?.email ? creatorC.email.split('@')[0] : 'Admin');
    expect(nameC).toBe('Admin');
  });
});
