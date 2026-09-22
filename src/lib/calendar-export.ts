import { Interview } from '@/types/interviews';

/**
 * Formats a Date object into iCalendar UTC timestamp format (YYYYMMDDTHHmmssZ)
 */
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate standard RFC 5545 iCalendar (.ics) content for an interview
 */
export function generateIcsCalendarContent(interview: Interview): string {
  const startDate = new Date(interview.scheduledAt);
  const endDate = new Date(startDate.getTime() + (interview.durationMinutes || 45) * 60 * 1000);

  const dtStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(startDate);
  const dtEnd = formatIcsDate(endDate);

  const summary = interview.title;
  const description = [
    `Interview Round: ${interview.roundType.toUpperCase()}`,
    `Candidate: ${interview.candidateName} (${interview.candidateEmail || 'No email specified'})`,
    `Position: ${interview.jobTitle}`,
    interview.meetingLink ? `Meeting Link: ${interview.meetingLink}` : '',
    interview.interviewerNames?.length ? `Interviewers: ${interview.interviewerNames.join(', ')}` : '',
    interview.notes ? `\nNotes: ${interview.notes}` : '',
    '\nScheduled via HireMate AI'
  ].filter(Boolean).join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HireMate AI//Interview Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${interview.id}@hiresort.ai`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${interview.meetingLink || 'Virtual / Remote'}`,
    'ORGANIZER;CN=HireMate AI:mailto:interviews@hiresort.ai',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Upcoming Candidate Interview',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export const generateIcsContent = generateIcsCalendarContent;

/**
 * Triggers a browser download of an .ics calendar invitation file
 */
export function downloadInterviewIcs(interview: Interview): void {
  const icsData = generateIcsCalendarContent(interview);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `interview-${interview.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Returns a direct Google Calendar web event creation link
 */
export function getGoogleCalendarUrl(interview: Interview): string {
  const startDate = new Date(interview.scheduledAt);
  const endDate = new Date(startDate.getTime() + (interview.durationMinutes || 45) * 60 * 1000);

  const startFormatted = formatIcsDate(startDate);
  const endFormatted = formatIcsDate(endDate);

  const details = [
    `Interview for: ${interview.jobTitle}`,
    `Candidate: ${interview.candidateName} (${interview.candidateEmail || ''})`,
    `Meeting Link: ${interview.meetingLink || 'To be shared'}`,
    `Panel: ${interview.interviewerNames?.join(', ') || 'Hiring Team'}`,
    interview.notes ? `\nNotes: ${interview.notes}` : ''
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: interview.title,
    dates: `${startFormatted}/${endFormatted}`,
    details: details,
    location: interview.meetingLink || 'Online'
  });

  if (interview.candidateEmail) {
    params.append('add', interview.candidateEmail);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate formatted email invitation text
 */
export function getCandidateEmailInvite(interview: Interview): {
  to: string;
  subject: string;
  body: string;
  mailtoUrl: string;
} {
  const to = interview.candidateEmail || '';
  const startDate = new Date(interview.scheduledAt);
  const dateFormatted = startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeFormatted = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const subject = `Interview Invitation: ${interview.title}`;
  const body = `Hi ${interview.candidateName},

We are pleased to invite you to an interview for the ${interview.jobTitle} position.

Interview Details:
- Title: ${interview.title}
- Date: ${dateFormatted}
- Time: ${timeFormatted} (${interview.durationMinutes || 45} minutes)
${interview.meetingLink ? `- Meeting Link: ${interview.meetingLink}\n` : ''}- Interviewers: ${interview.interviewerNames?.join(', ') || 'Hiring Team'}

Please let us know if you have any questions or need to reschedule.

Best regards,
${interview.clientName || 'HireMate AI Hiring Team'}`;

  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { to, subject, body, mailtoUrl };
}
