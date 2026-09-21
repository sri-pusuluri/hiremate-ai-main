import { Interview } from '@/types/interviews';

/**
 * Format a Date object into iCalendar UTC string format: YYYYMMDDTHHmmssZ
 */
function formatDateToIcs(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Escape text for iCalendar description / summary fields
 */
function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant .ics (iCalendar) file string
 */
export function generateIcsContent(interview: Interview): string {
  const startDate = new Date(interview.scheduledAt);
  const durationMs = (interview.durationMinutes || 45) * 60 * 1000;
  const endDate = new Date(startDate.getTime() + durationMs);

  const dtStart = formatDateToIcs(startDate);
  const dtEnd = formatDateToIcs(endDate);
  const dtStamp = formatDateToIcs(new Date());
  const uid = `interview-${interview.id}@hiresort.ai`;

  const summary = escapeIcsText(`${interview.title} - ${interview.candidateName} (${interview.jobTitle})`);
  const description = escapeIcsText(
    `Candidate: ${interview.candidateName}${interview.candidateEmail ? ` <${interview.candidateEmail}>` : ''}\n` +
    `Role: ${interview.jobTitle}\n` +
    `Round Type: ${interview.roundType.replace('_', ' ').toUpperCase()}\n` +
    `Interviewers: ${interview.interviewerNames.join(', ')}\n` +
    (interview.meetingLink ? `Video Meeting Link: ${interview.meetingLink}\n` : '') +
    (interview.notes ? `\nPrep Notes:\n${interview.notes}\n` : '') +
    `\nScheduled via HireSort AI Recruitment Platform.`
  );
  const location = escapeIcsText(interview.meetingLink || 'Virtual Video Conference');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HireSort AI//Interview Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `STATUS:CONFIRMED`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview starting in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Triggers a browser download of the .ics calendar file
 */
export function downloadIcsFile(interview: Interview): void {
  const icsContent = generateIcsContent(interview);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeCandidate = (interview.candidateName || 'candidate').toLowerCase().replace(/[^a-z0-9]/g, '-');
  link.download = `interview-${safeCandidate}-${interview.roundType}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a pre-filled mailto: URL to invite the candidate with interview details
 */
export function generateEmailInviteUrl(interview: Interview): string {
  const candidateEmail = interview.candidateEmail || '';
  const dateFormatted = new Date(interview.scheduledAt).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const subject = encodeURIComponent(`Interview Invitation: ${interview.title} for ${interview.jobTitle} at ${interview.clientName || 'HireSort'}`);
  
  const bodyText = 
`Dear ${interview.candidateName},

We are pleased to invite you to the next stage of our recruitment process for the ${interview.jobTitle} position.

Interview Details:
------------------------------------------
• Round: ${interview.title} (${interview.roundType.replace('_', ' ').toUpperCase()})
• Date & Time: ${dateFormatted}
• Duration: ${interview.durationMinutes} minutes
• Interviewers: ${interview.interviewerNames.join(', ')}
${interview.meetingLink ? `• Video Call Link: ${interview.meetingLink}` : ''}
------------------------------------------

${interview.notes ? `Preparation Notes:\n${interview.notes}\n\n` : ''}Please confirm if this time works for you or let us know if you need to reschedule.

Best regards,
${interview.clientName || 'Recruitment Team'}
HireSort AI Platform`;

  return `mailto:${candidateEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
}

/**
 * Formats a plain text summary of the interview invite for quick clipboard copy
 */
export function generateFormattedInviteText(interview: Interview): string {
  const dateFormatted = new Date(interview.scheduledAt).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `📅 ${interview.title}
👤 Candidate: ${interview.candidateName}
💼 Role: ${interview.jobTitle}
⏰ When: ${dateFormatted} (${interview.durationMinutes} mins)
👥 Panel: ${interview.interviewerNames.join(', ')}
🔗 Link: ${interview.meetingLink || 'To be shared'}`;
}
