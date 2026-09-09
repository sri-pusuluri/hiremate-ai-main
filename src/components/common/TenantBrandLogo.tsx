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
  className?: string;
  alt?: string;
  showBorder?: boolean;
}

export const getResolvedTenantLogo = (
  slug?: string, 
  name?: string, 
  logoUrl?: string | null
): string | null => {
  if (logoUrl && typeof logoUrl === 'string' && logoUrl.trim().length > 0 && !logoUrl.includes('localhost')) {
    return logoUrl.trim();
  }
  const s = (slug || name || '').toLowerCase();
  if (s.includes('zool')) return '/logos/zool-logo.svg';
  if (s.includes('commit') || s.includes('comm-it')) return '/logos/commit-logo.svg';
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

export default function TenantBrandLogo({
  client,
  name,
  slug,
  logoUrl,
  themeColor,
  size = 'md',
  className,
  alt,
  showBorder = true
}: TenantBrandLogoProps) {
  const [imageError, setImageError] = useState(false);

  const effectiveName = name || client?.name || 'Company';
  const effectiveSlug = slug || client?.slug || '';
  const effectiveLogoUrl = logoUrl !== undefined ? logoUrl : client?.logoUrl;
  const effectiveThemeColor = themeColor || client?.themeColor || '#2563eb';

  const resolvedLogo = getResolvedTenantLogo(effectiveSlug, effectiveName, effectiveLogoUrl);
  const initialLetter = (effectiveName || effectiveSlug || 'C').charAt(0).toUpperCase();

  if (resolvedLogo && !imageError) {
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
          src={resolvedLogo}
          alt={alt || `${effectiveName} Logo`}
          className="w-full h-full object-contain p-0.5 rounded-[inherit]"
          onError={() => setImageError(true)}
          loading="eager"
        />
      </div>
    );
  }

  // Fallback high-fidelity monogram badge
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

