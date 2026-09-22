import { describe, it, expect } from 'vitest';
import { generateIcsCalendarContent, getGoogleCalendarUrl, getCandidateEmailInvite } from '@/lib/calendar-export';
import { Interview } from '@/types/interview';

describe('Calendar Export and Invite Utilities', () => {
  const mockInterview: Interview = {
    id: 'int-test-1',
    clientId: 'client-1',
    candidateId: 'cand-101',
    candidateName: 'Jane Doe',
    candidateEmail: 'jane.doe@example.com',
    jobId: 'job-202',
    jobTitle: 'Senior Fullstack Engineer',
    title: 'System Design Interview with Jane Doe',
    roundType: 'technical',
    status: 'scheduled',
    scheduledAt: '2026-10-15T14:30:00.000Z',
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    interviewerIds: ['usr-1', 'usr-2'],
    interviewerNames: ['Alex Rivera', 'Jordan Lee'],
    notes: 'Please review past architecture portfolio before call.'
  };

  it('generates a valid iCalendar .ics format string', () => {
    const ics = generateIcsCalendarContent(mockInterview);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//HireMate AI//Interview Scheduler//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:int-test-1@hiresort.ai');
    expect(ics).toContain('SUMMARY:System Design Interview with Jane Doe');
    expect(ics).toContain('LOCATION:https://meet.google.com/abc-defg-hij');
    expect(ics).toContain('DTSTART:20261015T143000Z');
    expect(ics).toContain('DTEND:20261015T153000Z');
    expect(ics).toContain('ORGANIZER;CN=HireMate AI:mailto:interviews@hiresort.ai');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('constructs a Google Calendar deep link with properly encoded parameters', () => {
    const gcalUrl = getGoogleCalendarUrl(mockInterview);

    expect(gcalUrl).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
    expect(gcalUrl).toContain('text=System+Design+Interview+with+Jane+Doe');
    expect(gcalUrl).toContain('dates=20261015T143000Z%2F20261015T153000Z');
    expect(gcalUrl).toContain('location=https%3A%2F%2Fmeet.google.com%2Fabc-defg-hij');
    expect(gcalUrl).toContain('add=jane.doe%40example.com');
  });

  it('formats candidate email invite with mailto URL and friendly body', () => {
    const invite = getCandidateEmailInvite(mockInterview);

    expect(invite.to).toBe('jane.doe@example.com');
    expect(invite.subject).toContain('Interview Invitation: System Design Interview with Jane Doe');
    expect(invite.body).toContain('Hi Jane Doe');
    expect(invite.body).toContain('Senior Fullstack Engineer');
    expect(invite.body).toContain('https://meet.google.com/abc-defg-hij');
    expect(invite.mailtoUrl).toContain('mailto:jane.doe%40example.com');
  });

  it('handles interviews without candidate email gracefully', () => {
    const interviewWithoutEmail: Interview = {
      ...mockInterview,
      id: 'int-test-2',
      candidateEmail: undefined
    };

    const ics = generateIcsCalendarContent(interviewWithoutEmail);
    expect(ics).toContain('No email specified');

    const gcalUrl = getGoogleCalendarUrl(interviewWithoutEmail);
    expect(gcalUrl).not.toContain('&add=');

    const emailInvite = getCandidateEmailInvite(interviewWithoutEmail);
    expect(emailInvite.to).toBe('');
    expect(emailInvite.mailtoUrl).toBe('mailto:?subject=Interview%20Invitation%3A%20System%20Design%20Interview%20with%20Jane%20Doe&body=' + encodeURIComponent(emailInvite.body));
  });
});
