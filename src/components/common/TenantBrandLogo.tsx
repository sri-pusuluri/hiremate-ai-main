import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ClientTenant } from '@/types/hiresort';

interface TenantBrandLogoProps {
  client?: Partial<ClientTenant> | { name?: string; slug?: string; logoUrl?: string | null; themeColor?: string | null } | null;
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  themeColor?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'icon' | 'full' | 'auto';
  className?: string;
  alt?: string;
  showBorder?: boolean;
}

export const getResolvedTenantLogo = (
  slug?: string, 
  name?: string, 
  logoUrl?: string | null,
  variant: 'icon' | 'full' | 'auto' = 'auto'
): string | null => {
  // If custom uploaded logo is provided and not a broken localhost URL
  if (logoUrl && typeof logoUrl === 'string' && logoUrl.trim().length > 0 && !logoUrl.includes('localhost')) {
    return logoUrl.trim();
  }

  const s = (slug || name || '').toLowerCase();
  const isZool = s.includes('zool');
  const isCommit = s.includes('commit') || s.includes('comm-it');

  if (isZool) {
    if (variant === 'icon') return '/logos/zool-icon.png';
    return '/logos/zool-logo-dark.png';
  }

  if (isCommit) {
    if (variant === 'icon') return '/logos/commit-icon.png';
    return '/logos/commit-logo.png';
  }

  return null;
};

const sizeClasses = {
  xs: 'w-5 h-5 rounded-md text-[10px]',
  sm: 'w-7 h-7 rounded-lg text-xs',
  md: 'w-10 h-10 rounded-xl text-sm',
  lg: 'w-14 h-14 rounded-2xl text-lg',
  xl: 'w-18 h-18 rounded-2xl text-xl',
  hero: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl text-2xl shadow-xl'
};

const fullSizeClasses = {
  xs: 'h-5 w-auto max-w-[100px]',
  sm: 'h-6 sm:h-7 w-auto max-w-[130px]',
  md: 'h-8 sm:h-9 w-auto max-w-[160px]',
  lg: 'h-10 sm:h-12 w-auto max-w-[200px]',
  xl: 'h-12 sm:h-14 w-auto max-w-[240px]',
  hero: 'h-12 sm:h-16 w-auto max-w-[280px]'
};

export default function TenantBrandLogo({
  client,
  name,
  slug,
  logoUrl,
  themeColor,
  size = 'md',
  variant = 'auto',
  className,
  alt,
  showBorder = true
}: TenantBrandLogoProps) {
  const [imageError, setImageError] = useState(false);

  const effectiveName = name || client?.name || 'Company';
  const effectiveSlug = slug || client?.slug || '';
  const rawLogoUrl = logoUrl !== undefined ? logoUrl : client?.logoUrl;
  const effectiveLogoUrl = rawLogoUrl && !rawLogoUrl.includes('localhost') ? rawLogoUrl : null;
  const effectiveThemeColor = themeColor || client?.themeColor || '#2563eb';

  const s = (effectiveSlug || effectiveName).toLowerCase();
  const isZool = s.includes('zool');
  const isCommit = s.includes('commit') || s.includes('comm-it');

  // If full wordmark variant is requested or auto on larger display sizes
  const useFullVariant = variant === 'full' || (variant === 'auto' && (size === 'hero' || size === 'xl' || size === 'lg'));

  // If there's an explicit custom logo url that isn't one of our internal paths
  const hasCustomLogo = effectiveLogoUrl && 
    !effectiveLogoUrl.startsWith('/logos/') && 
    effectiveLogoUrl.trim().length > 0;

  // 1. Explicit Custom Logo
  if (hasCustomLogo && !imageError) {
    return (
      <div 
        className={cn(
          "relative shrink-0 flex items-center justify-center overflow-hidden bg-card/95 transition-transform duration-200",
          showBorder && "border border-border/80 shadow-sm",
          useFullVariant ? fullSizeClasses[size] : sizeClasses[size],
          className
        )}
      >
        <img
          src={effectiveLogoUrl}
          alt={alt || `${effectiveName} Logo`}
          className="w-full h-full object-contain p-0.5 rounded-[inherit]"
          onError={() => setImageError(true)}
          loading="eager"
        />
      </div>
    );
  }

  // 2. Official Zool Full Wordmark
  if (isZool && useFullVariant && !imageError) {
    return (
      <div 
        className={cn(
          "relative shrink-0 flex items-center justify-center transition-transform duration-200",
          fullSizeClasses[size],
          showBorder && "border border-border/80 rounded-xl px-2.5 py-1.5 bg-card/95 shadow-sm",
          className
        )}
      >
        <img
          src="/logos/zool-logo-dark.png"
          alt={alt || `${effectiveName} Logo`}
          className="h-full w-auto object-contain dark:hidden"
          onError={() => setImageError(true)}
          loading="eager"
        />
        <img
          src="/logos/zool-logo-light.png"
          alt={alt || `${effectiveName} Logo`}
          className="h-full w-auto object-contain hidden dark:block"
          onError={() => setImageError(true)}
          loading="eager"
        />
      </div>
    );
  }

  // 3. Official Commit Logo (Icon for square sizes, full wordmark for wide/hero sizes)
  if (isCommit && !imageError) {
    const useIcon = !useFullVariant && (size === 'xs' || size === 'sm' || size === 'md');
    return (
      <div 
        className={cn(
          "relative shrink-0 flex items-center justify-center transition-transform duration-200 overflow-hidden",
          useFullVariant ? fullSizeClasses[size] : sizeClasses[size],
          showBorder && "border border-border/80 rounded-xl p-1 bg-card/95 shadow-sm",
          className
        )}
      >
        <img
          src={useIcon ? "/logos/commit-icon.png" : "/logos/commit-logo.png"}
          alt={alt || `${effectiveName} Logo`}
          className="w-full h-full object-contain p-0.5"
          onError={() => {
            // Fallback to commit-logo if commit-icon fails
            if (useIcon) {
              const target = event?.target as HTMLImageElement | undefined;
              if (target) target.src = "/logos/commit-logo.png";
            } else {
              setImageError(true);
            }
          }}
          loading="eager"
        />
      </div>
    );
  }

  // 4. Official Zool 4-Ring Icon Mark
  if (isZool && !imageError) {
    return (
      <div 
        className={cn(
          "relative shrink-0 flex items-center justify-center overflow-hidden bg-card/95 transition-transform duration-200",
          showBorder && "border border-border/80 shadow-sm",
          sizeClasses[size],
          className
        )}
      >
        <img
          src="/logos/zool-icon.png"
          alt={alt || `${effectiveName} Icon`}
          className="w-full h-full object-contain p-1 rounded-[inherit]"
          onError={() => setImageError(true)}
          loading="eager"
        />
      </div>
    );
  }

  // 4. Custom Client Uploaded Logo
  const resolvedLogo = getResolvedTenantLogo(effectiveSlug, effectiveName, effectiveLogoUrl, variant);
  if (resolvedLogo && !imageError) {
    return (
      <div 
        className={cn(
          "relative shrink-0 flex items-center justify-center overflow-hidden bg-card/95 transition-transform duration-200",
          showBorder && "border border-border/80 shadow-sm",
          useFullVariant ? fullSizeClasses[size] : sizeClasses[size],
          className
        )}
      >
        <img
          src={resolvedLogo}
          alt={alt || `${effectiveName} Logo`}
          className="w-full h-full object-contain p-0.5 rounded-[inherit]"
          onError={() => setImageError(true)}
          loading="eager"
        />
      </div>
    );
  }

  // 5. Fallback Monogram Badge
  const initialLetter = (effectiveName || effectiveSlug || 'C').charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        "relative shrink-0 flex items-center justify-center font-bold text-white shadow-sm transition-transform duration-200",
        showBorder && "border border-white/20",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: effectiveThemeColor,
        background: `linear-gradient(135deg, ${effectiveThemeColor}, ${effectiveThemeColor}cc)`
      }}
    >
      <span className="leading-none drop-shadow-sm select-none">
        {initialLetter}
      </span>
    </div>
  );
}


