import { describe, it, expect, beforeEach } from 'vitest';
import { 
  fetchInterviews, 
  createInterview, 
  submitInterviewScorecard, 
  SEED_DEMO_INTERVIEWS 
} from '../lib/interview-storage';
import { 
  fetchSupportTickets, 
  createSupportTicket, 
  addTicketMessage, 
  updateTicketStatus, 
  KNOWLEDGE_BASE_ARTICLES 
} from '../lib/support-storage';

describe('Interview & Interviewer Module Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('fetches initial demo interview pipeline', async () => {
    const interviews = await fetchInterviews();
    expect(interviews.length).toBeGreaterThanOrEqual(1);
    expect(interviews[0]).toHaveProperty('roundType');
    expect(interviews[0]).toHaveProperty('scheduledAt');
    expect(interviews[0]).toHaveProperty('status');
  });

  it('filters interviews by client ID', async () => {
    const zoolInterviews = await fetchInterviews('00000000-0000-0000-0000-000000000001');
    expect(zoolInterviews.every(i => i.clientId === '00000000-0000-0000-0000-000000000001')).toBe(true);
  });

  it('schedules a new interview round with meeting link', async () => {
    const newInterview = await createInterview({
      clientId: '00000000-0000-0000-0000-000000000001',
      clientName: 'Zool',
      candidateId: 'cand-test-1',
      candidateName: 'Test Candidate',
      jobId: 'job-test-1',
      jobTitle: 'Full Stack Engineer',
      title: 'Round 1: Fullstack Coding',
      roundType: 'technical',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: 45,
      meetingLink: 'https://meet.google.com/test-room',
      interviewerIds: ['usr-1'],
      interviewerNames: ['Naushad Recruiter']
    });

    expect(newInterview.id).toBeDefined();
    expect(newInterview.status).toBe('scheduled');
    expect(newInterview.roundType).toBe('technical');
    expect(newInterview.meetingLink).toBe('https://meet.google.com/test-room');

    // Verify stored
    const list = await fetchInterviews();
    expect(list.some(i => i.id === newInterview.id)).toBe(true);
  });

  it('submits a 5-star rubric scorecard and completes interview', async () => {
    const targetInterview = SEED_DEMO_INTERVIEWS[0];

    const scorecard = await submitInterviewScorecard({
      interviewId: targetInterview.id,
      candidateId: targetInterview.candidateId,
      interviewerId: 'usr-evaluator',
      interviewerName: 'Srini Lead',
      recommendation: 'strong_hire',
      overallScore: 4.75,
      rubricRatings: {
        technicalSkills: 5,
        problemSolving: 5,
        communication: 4,
        cultureFit: 5
      },
      strengths: 'Outstanding problem solving and system thinking.',
      areasForImprovement: 'Minor edge cases in error recovery.'
    });

    expect(scorecard.id).toBeDefined();
    expect(scorecard.recommendation).toBe('strong_hire');
    expect(scorecard.overallScore).toBe(4.75);

    // Verify interview status marked completed
    const updatedList = await fetchInterviews();
    const updated = updatedList.find(i => i.id === targetInterview.id);
    expect(updated?.status).toBe('completed');
    expect(updated?.scorecard?.overallScore).toBe(4.75);
  });
});

describe('Help & Support System Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads knowledge base articles with search tags', () => {
    expect(KNOWLEDGE_BASE_ARTICLES.length).toBeGreaterThanOrEqual(3);
    const widgetArticle = KNOWLEDGE_BASE_ARTICLES.find(a => a.slug === 'embed-careers-widget');
    expect(widgetArticle).toBeDefined();
    expect(widgetArticle?.tags).toContain('widget');
  });

  it('creates a support ticket with category and initial message', async () => {
    const ticket = await createSupportTicket({
      clientId: '00000000-0000-0000-0000-000000000001',
      clientName: 'Zool',
      userId: 'usr-1',
      userEmail: 'hr@zool.in',
      subject: 'Inquiry regarding custom screening question validation',
      category: 'integration',
      priority: 'medium',
      description: 'How do we enforce regex patterns on candidate text inputs?'
    });

    expect(ticket.id).toBeDefined();
    expect(ticket.status).toBe('open');
    expect(ticket.messages.length).toBe(1);
    expect(ticket.messages[0].message).toContain('regex patterns');

    const all = await fetchSupportTickets();
    expect(all.some(t => t.id === ticket.id)).toBe(true);
  });

  it('appends threaded replies between user and admin and updates ticket status', async () => {
    const ticket = await createSupportTicket({
      clientId: '00000000-0000-0000-0000-000000000001',
      clientName: 'Zool',
      userId: 'usr-1',
      userEmail: 'hr@zool.in',
      subject: 'Testing threaded communication',
      category: 'general',
      priority: 'low',
      description: 'First inquiry message'
    });

    const reply = await addTicketMessage(ticket.id, {
      senderId: 'super-admin-id',
      senderEmail: 'support@hiresort.ai',
      senderRole: 'super_admin',
      message: 'Here is the direct resolution instruction from HireSort Support.'
    });

    expect(reply.id).toBeDefined();
    expect(reply.senderRole).toBe('super_admin');

    const updatedList = await fetchSupportTickets();
    const updated = updatedList.find(t => t.id === ticket.id);
    expect(updated?.messages.length).toBe(2);
    expect(updated?.status).toBe('waiting_on_client');

    // Resolve ticket
    await updateTicketStatus(ticket.id, 'resolved');
    const resolvedList = await fetchSupportTickets();
    const resolved = resolvedList.find(t => t.id === ticket.id);
    expect(resolved?.status).toBe('resolved');
    expect(resolved?.resolvedAt).toBeDefined();
  });
});
