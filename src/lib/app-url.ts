/**
 * Centralized Application URL Helper
 * Always prioritizes the production domain: https://hiresortai.zool.in
 * Replaces localhost in URLs for links, embeds, webhooks, invitations, and redirects.
 */

export const APP_BASE_URL = 'https://hiresortai.zool.in';

/**
 * Returns the base application URL.
 * When running on localhost or loopback during development, returns 'https://hiresortai.zool.in'
 * so that shared links, embed snippets, careers URLs, and password reset redirects
 * are immediately valid and accessible for production clients.
 */
export const getAppBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return APP_BASE_URL;
  }
  const origin = window.location.origin;
  if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return APP_BASE_URL;
  }
  return origin;
};
