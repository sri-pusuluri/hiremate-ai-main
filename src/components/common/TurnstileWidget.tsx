import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

type WidgetState = 'loading' | 'ready' | 'verified' | 'expired' | 'error';

export default function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  className
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [state, setState] = useState<WidgetState>('loading');

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const handleReset = () => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setState('ready');
        onExpire?.();
      } catch (_) {}
    }
  };

  useEffect(() => {
    if (!siteKey) return;

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current) return;
      if (widgetIdRef.current) return;

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            setState('verified');
            onVerify(token);
          },
          'expired-callback': () => {
            setState('expired');
            onExpire?.();
          },
          'error-callback': () => {
            setState('error');
            onError?.();
          },
          theme: 'auto',
        });
        widgetIdRef.current = id;
        setState('ready');
      } catch (err) {
        console.warn('Turnstile render note:', err);
        setState('error');
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderWidget();
        };
        script.onerror = () => {
          setState('error');
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', renderWidget);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  // Dev/staging fallback — no site key configured
  if (!siteKey) {
    return (
      <div className="p-2.5 rounded-lg border border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Spam Protection Active</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">Dev Mode</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Cloudflare widget container */}
      <div
        ref={containerRef}
        className={`min-h-[65px] flex items-center justify-center my-1 transition-opacity duration-300 ${state === 'loading' ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}
      />

      {/* Loading state */}
      {state === 'loading' && (
        <div className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center gap-2 text-[11px] text-muted-foreground min-h-[42px]">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>Loading security check…</span>
        </div>
      )}

      {/* Expired state */}
      {state === 'expired' && (
        <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 min-h-[42px]">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Verification expired. Please re-verify.</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 font-medium hover:opacity-80 transition-opacity"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/5 flex items-center justify-between text-[11px] text-destructive min-h-[42px]">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Security check failed. Check your connection.</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 font-medium hover:opacity-80 transition-opacity"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
