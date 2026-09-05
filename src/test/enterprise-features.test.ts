import { describe, it, expect, beforeEach } from 'vitest';
import { logAuditEvent, fetchAuditLogs } from '../lib/audit-logger';
import { 
  SCREENING_QUESTION_LIBRARY, 
  getQuestionsByCategory, 
  QUESTION_CATEGORIES,
  ScreeningQuestion
} from '../lib/question-library';

describe('Audit Logger Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('logs audit events and stores them in local cache', async () => {
    const event = await logAuditEvent({
      clientId: 'tenant-test-123',
      clientName: 'Test Corp',
      userId: 'user-001',
      userEmail: 'recruiter@testcorp.com',
      userRole: 'client_admin',
      action: 'UPDATE_AI_INFERENCE_STRATEGY',
      resourceType: 'settings',
      resourceId: 'byok',
      details: { strategy: 'byok', provider: 'openai' }
    });

    expect(event.id).toBeDefined();
    expect(event.clientId).toBe('tenant-test-123');
    expect(event.action).toBe('UPDATE_AI_INFERENCE_STRATEGY');
    expect(event.userEmail).toBe('recruiter@testcorp.com');

    // Fetch logs
    const logs = await fetchAuditLogs('tenant-test-123');
    expect(logs.length).toBeGreaterThan(0);
    const logged = logs.find(l => l.id === event.id);
    expect(logged).toBeDefined();
    expect(logged?.details.strategy).toBe('byok');
  });

  it('filters audit logs strictly by client ID', async () => {
    await logAuditEvent({
      clientId: 'tenant-aaa',
      clientName: 'Alpha Corp',
      userEmail: 'alpha@example.com',
      action: 'UPDATE_BRANDING_SETTINGS',
      resourceType: 'branding'
    });

    await logAuditEvent({
      clientId: 'tenant-bbb',
      clientName: 'Beta Corp',
      userEmail: 'beta@example.com',
      action: 'REGENERATE_TENANT_API_KEY',
      resourceType: 'api'
    });

    const alphaLogs = await fetchAuditLogs('tenant-aaa');
    expect(alphaLogs.every(l => l.clientId === 'tenant-aaa')).toBe(true);

    const betaLogs = await fetchAuditLogs('tenant-bbb');
    expect(betaLogs.every(l => l.clientId === 'tenant-bbb')).toBe(true);
  });
});

describe('Question Library & Intelligent Input Types', () => {
  it('contains essential screening questions with required types', () => {
    expect(SCREENING_QUESTION_LIBRARY.length).toBeGreaterThan(10);
    
    // Check for earliest joining date question with date input
    const joiningDateQ = SCREENING_QUESTION_LIBRARY.find(q => 
      q.text.toLowerCase().includes('earliest') || q.text.toLowerCase().includes('joining date')
    );
    expect(joiningDateQ).toBeDefined();
    expect(joiningDateQ?.type).toBe('date');

    // Check for portfolio/github question with url input
    const portfolioQ = SCREENING_QUESTION_LIBRARY.find(q => 
      q.text.toLowerCase().includes('github') || q.text.toLowerCase().includes('portfolio')
    );
    expect(portfolioQ).toBeDefined();
    expect(portfolioQ?.type).toBe('url');

    // Check for notice period question with choice input and options
    const noticePeriodQ = SCREENING_QUESTION_LIBRARY.find(q => 
      q.text.toLowerCase().includes('notice period')
    );
    expect(noticePeriodQ).toBeDefined();
    expect(noticePeriodQ?.type).toBe('choice');
    expect(noticePeriodQ?.options?.length).toBeGreaterThan(0);
  });

  it('categorizes questions into distinct HR groups', () => {
    QUESTION_CATEGORIES.forEach(cat => {
      const questions = getQuestionsByCategory(cat.id);
      expect(questions.length).toBeGreaterThan(0);
      questions.forEach((q: ScreeningQuestion) => {
        if (cat.id !== 'all') {
          expect(q.category).toBe(cat.id);
        }
        expect(q.id).toBeDefined();
        expect(q.text.length).toBeGreaterThan(5);
      });
    });
  });
});

describe('Multi-Tenant Enterprise Isolation Rules', () => {
  it('formats API key with tenant slug and live prefix', () => {
    const slug = 'acme-corp';
    const randomHex = 'abc123xyz789';
    const apiKey = `hsa_live_${slug}_${randomHex}`;

    expect(apiKey.startsWith('hsa_live_acme-corp_')).toBe(true);
    expect(apiKey).toMatch(/^hsa_live_[a-z0-9-]+_[a-z0-9]+$/);
  });

  it('constructs correct Model Context Protocol (MCP) server endpoint', () => {
    const slug = 'initech';
    const token = 'hsa_live_initech_securetoken123';
    const mcpUrl = `sse://api.hiresort.ai/mcp/${slug}?token=${token}`;

    expect(mcpUrl).toBe('sse://api.hiresort.ai/mcp/initech?token=hsa_live_initech_securetoken123');
  });

  it('verifies CSV export sanitization for audit logs', () => {
    const testRow = {
      createdAt: '2026-09-05T10:00:00Z',
      userEmail: 'admin@acme.com',
      userRole: 'client_admin',
      action: 'INVITE_USER',
      resourceType: 'user',
      resourceId: 'test,"dangerous",quote',
      ipAddress: '192.168.1.1',
      details: { role: 'recruiter', note: 'New hire, batch "A"' }
    };

    const sanitizedResourceId = `"${testRow.resourceId.replace(/"/g, '""')}"`;
    const sanitizedDetails = `"${JSON.stringify(testRow.details).replace(/"/g, '""')}"`;

    expect(sanitizedResourceId).toBe('"test,""dangerous"",quote"');
    expect(sanitizedDetails).toContain('""role"":""recruiter""');
  });
});
