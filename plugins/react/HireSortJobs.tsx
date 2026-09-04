import React, { useEffect, useRef, useState } from 'react';

export interface HireSortJobsProps {
  /**
   * Your unique company slug in HireSort (e.g. 'zool').
   */
  clientSlug?: string;

  /**
   * Theme mode: 'dark' or 'light'. Defaults to 'dark'.
   */
  theme?: 'dark' | 'light';

  /**
   * Base URL of the HireSort ATS instance.
   * Defaults to 'http://localhost:8080' in development or 'https://app.hiresort.ai' in production.
   */
  atsBaseUrl?: string;

  /**
   * Optional custom CSS class name for the wrapper div.
   */
  className?: string;

  /**
   * Initial minimum height in pixels before content loads. Defaults to 600.
   */
  initialHeight?: number;
}

export const HireSortJobs: React.FC<HireSortJobsProps> = ({
  clientSlug = 'zool',
  theme = 'dark',
  atsBaseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : 'https://app.hiresort.ai',
  className = '',
  initialHeight = 650,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(initialHeight);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate event type
      if (!event.data || event.data.type !== 'HIRESORT_RESIZE') {
        return;
      }

      // Check clientSlug match if provided
      if (event.data.clientSlug && event.data.clientSlug !== clientSlug) {
        return;
      }

      if (typeof event.data.height === 'number' && event.data.height > 100) {
        setIframeHeight(event.data.height);
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [clientSlug]);

  const embedUrl = `${atsBaseUrl.replace(/\/$/, '')}/embed/careers/${encodeURIComponent(clientSlug)}?theme=${encodeURIComponent(theme)}`;

  return (
    <div 
      className={`hiresort-embed-wrapper relative w-full transition-all duration-300 ${className}`}
      style={{ minHeight: `${iframeHeight}px` }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 text-sm text-muted-foreground animate-pulse">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Loading career opportunities...
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={embedUrl}
        id={`hiresort-iframe-${clientSlug}`}
        title={`HireSort Careers Portal — ${clientSlug}`}
        className="w-full border-0 rounded-xl overflow-hidden block transition-all duration-200"
        style={{
          height: `${iframeHeight}px`,
          backgroundColor: theme === 'dark' ? '#0b0f19' : '#ffffff',
        }}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
      />
    </div>
  );
};

export default HireSortJobs;
