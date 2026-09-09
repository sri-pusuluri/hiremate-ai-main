import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAppBaseUrl, APP_BASE_URL } from '../lib/app-url';

describe('App URL Configuration Suite', () => {
  const originalLocation = window.location;

  afterEach(() => {
    // Restore window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('1. Returns https://hiresortai.zool.in when window.location.origin is localhost', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        origin: 'http://localhost:8080',
        hostname: 'localhost',
        href: 'http://localhost:8080/dashboard',
      },
    });

    expect(getAppBaseUrl()).toBe('https://hiresortai.zool.in');
  });

  it('2. Returns https://hiresortai.zool.in when window.location.origin is 127.0.0.1', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        origin: 'http://127.0.0.1:5173',
        hostname: '127.0.0.1',
        href: 'http://127.0.0.1:5173/',
      },
    });

    expect(getAppBaseUrl()).toBe('https://hiresortai.zool.in');
  });

  it('3. Preserves custom production domain or returns production base URL', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        origin: 'https://hiresortai.zool.in',
        hostname: 'hiresortai.zool.in',
        href: 'https://hiresortai.zool.in/users',
      },
    });

    expect(getAppBaseUrl()).toBe('https://hiresortai.zool.in');
    expect(APP_BASE_URL).toBe('https://hiresortai.zool.in');
  });
});
