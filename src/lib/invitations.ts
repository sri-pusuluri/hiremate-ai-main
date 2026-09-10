const PENDING_INVITES_KEY = 'hiresort_pending_invitations';
const ACCEPTED_ACCOUNTS_KEY = 'hiresort_accepted_accounts';

// Pre-seeded list includes newly invited user from screenshot
const DEFAULT_PENDING: string[] = ['sri.pusuluri@gmail.com'];

export function getPendingInvitedEmails(): string[] {
  try {
    const raw = localStorage.getItem(PENDING_INVITES_KEY);
    if (!raw) {
      localStorage.setItem(PENDING_INVITES_KEY, JSON.stringify(DEFAULT_PENDING));
      return DEFAULT_PENDING;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_PENDING;
  }
}

export function markInvitationPending(email: string) {
  if (!email) return;
  try {
    const list = getPendingInvitedEmails().filter(e => e.toLowerCase() !== email.toLowerCase().trim());
    list.push(email.toLowerCase().trim());
    localStorage.setItem(PENDING_INVITES_KEY, JSON.stringify(list));
  } catch (e) {}
}

export function markInvitationAccepted(email: string) {
  if (!email) return;
  try {
    const list = getPendingInvitedEmails().filter(e => e.toLowerCase() !== email.toLowerCase().trim());
    localStorage.setItem(PENDING_INVITES_KEY, JSON.stringify(list));
    
    const acceptedRaw = localStorage.getItem(ACCEPTED_ACCOUNTS_KEY) || '[]';
    const acceptedList: string[] = JSON.parse(acceptedRaw);
    if (!acceptedList.includes(email.toLowerCase().trim())) {
      acceptedList.push(email.toLowerCase().trim());
      localStorage.setItem(ACCEPTED_ACCOUNTS_KEY, JSON.stringify(acceptedList));
    }
  } catch (e) {}
}

export function isInvitationPending(email: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  
  // Permanent active accounts
  if ([
    'admin@hiremate.ai', 
    'srini@zool.in', 
    'admin@zool.in', 
    'admin@commit.com', 
    'naushad@comm-it.in', 
    'recruiter@hiremate.ai'
  ].includes(clean)) {
    return false;
  }

  // Check if explicitly marked accepted
  try {
    const acceptedRaw = localStorage.getItem(ACCEPTED_ACCOUNTS_KEY);
    if (acceptedRaw) {
      const acceptedList: string[] = JSON.parse(acceptedRaw);
      if (acceptedList.includes(clean)) return false;
    }
  } catch (e) {}

  const pending = getPendingInvitedEmails();
  return pending.some(p => p.toLowerCase() === clean);
}
