import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extracts clean initials from a full name (default max 2 characters).
 * Handles titles, suffixes, and multi-word names so avatars don't overflow (e.g. 'AY' instead of 'AYUUD').
 */
export function getInitials(name?: string, maxChars = 2): string {
  if (!name || !name.trim()) return '?';
  // Strip common job role titles if appended to name
  const stripped = name
    .replace(/\b(ui\/?ux|designer|developer|engineer|architect|manager|lead|frontend|backend|fullstack|consultant|analyst|specialist)\b/gi, '')
    .trim();
  const clean = (stripped || name).replace(/[^a-zA-Z\s]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, maxChars).toUpperCase();
  return (words[0][0] + words[1][0]).slice(0, maxChars).toUpperCase();
}

