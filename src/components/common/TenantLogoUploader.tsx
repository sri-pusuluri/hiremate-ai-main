import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, Link as LinkIcon, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Curated modern SVG preset logos for quick selection
export const PRESET_LOGOS = [
  {
    id: 'tech-hexagon',
    name: 'Tech Hexagon',
    color: '#6366f1',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="24" fill="%236366f1"/><path d="M50 22L76 37V67L50 82L24 67V37L50 22Z" stroke="white" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="52" r="10" fill="white"/></svg>`
  },
  {
    id: 'ai-spark',
    name: 'AI Spark',
    color: '#f59e0b',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="24" fill="%23f59e0b"/><path d="M50 20L58 42L80 50L58 58L50 80L42 58L20 50L42 42L50 20Z" fill="white"/></svg>`
  },
  {
    id: 'global-orbit',
    name: 'Global Node',
    color: '#10b981',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="24" fill="%2310b981"/><circle cx="50" cy="50" r="26" stroke="white" stroke-width="6"/><circle cx="50" cy="24" r="7" fill="white"/><circle cx="76" cy="50" r="7" fill="white"/><circle cx="50" cy="76" r="7" fill="white"/><circle cx="24" cy="50" r="7" fill="white"/></svg>`
  },
  {
    id: 'quantum-core',
    name: 'Quantum Core',
    color: '#06b6d4',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="24" fill="%2306b6d4"/><rect x="32" y="32" width="36" height="36" rx="8" transform="rotate(45 50 50)" stroke="white" stroke-width="6"/><circle cx="50" cy="50" r="9" fill="white"/></svg>`
  },
  {
    id: 'fintech-shield',
    name: 'Shield Scale',
    color: '#ec4899',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="24" fill="%23ec4899"/><path d="M50 20C50 20 74 24 74 48C74 68 50 82 50 82C50 82 26 68 26 48C26 24 50 20 50 20Z" stroke="white" stroke-width="6" stroke-linejoin="round"/><path d="M40 50L47 57L62 42" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  },
  {
    id: 'nebula-flow',
    name: 'Nebula Flow',
    color: '#8b5cf6',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="24" fill="%238b5cf6"/><path d="M28 50C28 38 38 28 50 28C62 28 72 38 72 50C72 62 62 72 50 72" stroke="white" stroke-width="7" stroke-linecap="round"/><circle cx="50" cy="72" r="5" fill="white"/></svg>`
  }
];

interface TenantLogoUploaderProps {
  value?: string;
  onChange: (newLogoUrl: string) => void;
  companyName?: string;
  themeColor?: string;
  label?: string;
}

export const TenantLogoUploader: React.FC<TenantLogoUploaderProps> = ({
  value = '',
  onChange,
  companyName = 'Company',
  themeColor = '#2563eb',
  label = 'Tenant Logo'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState(value);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image under 2MB.',
        variant: 'destructive'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file (PNG, JPG, SVG, WebP).',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        onChange(result);
        setCustomUrl(result);
        toast({
          title: 'Logo Uploaded',
          description: `Successfully loaded logo for ${companyName}.`,
        });
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so user can re-upload same file if needed
    e.target.value = '';
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) {
      onChange('');
      setShowUrlInput(false);
      return;
    }
    onChange(customUrl.trim());
    toast({
      title: 'Logo URL Applied',
      description: 'Image link updated.',
    });
    setShowUrlInput(false);
  };

  const handleRemove = () => {
    onChange('');
    setCustomUrl('');
  };

  const initials = companyName
    ? companyName.trim().substring(0, 2).toUpperCase()
    : 'TC';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-foreground">{label}</Label>
        {value && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={handleRemove}
            className="h-6 px-2 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Remove Logo
          </Button>
        )}
      </div>

      {/* Main Preview & Action Row */}
      <div className="flex items-center gap-4 p-3.5 rounded-xl border border-border bg-card/60">
        {/* Logo Preview Square */}
        <div 
          className="w-14 h-14 rounded-xl border border-border shadow-xs flex items-center justify-center overflow-hidden shrink-0 transition-transform hover:scale-105"
          style={{ backgroundColor: value ? '#ffffff' : (themeColor || '#2563eb') }}
        >
          {value ? (
            <img 
              src={value} 
              alt={`${companyName} Logo`} 
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                // Fallback on broken image link
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="font-bold text-base text-white tracking-wider">
              {initials}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center flex-wrap gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden" 
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 text-xs gap-1.5 font-medium"
            >
              <UploadCloud className="w-3.5 h-3.5 text-primary" />
              Upload Logo
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              {showUrlInput ? 'Cancel URL' : 'Paste Image URL'}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Recommended: Square PNG, SVG, or WebP with transparent background (max 2MB).
          </p>
        </div>
      </div>

      {/* Optional URL input toggle */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40 animate-fade-in">
          <Input 
            placeholder="https://yourcompany.com/assets/logo.png"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="h-8 text-xs font-mono bg-background"
          />
          <Button 
            type="button" 
            size="sm" 
            onClick={handleApplyUrl}
            className="h-8 text-xs shrink-0"
          >
            Apply
          </Button>
        </div>
      )}

      {/* Preset Badges Quick Select */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Or choose from professional presets:</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PRESET_LOGOS.map((preset) => {
            const isSelected = value === preset.dataUrl;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onChange(preset.dataUrl);
                  setCustomUrl(preset.dataUrl);
                }}
                className={`relative group p-1.5 rounded-lg border text-left transition-all flex flex-col items-center gap-1 hover:border-primary ${
                  isSelected 
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30' 
                    : 'border-border bg-background/80 hover:bg-muted/40'
                }`}
                title={preset.name}
              >
                <img 
                  src={preset.dataUrl} 
                  alt={preset.name} 
                  className="w-8 h-8 rounded-md shadow-2xs"
                />
                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground truncate max-w-full">
                  {preset.name}
                </span>
                {isSelected && (
                  <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-primary rounded-full text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default TenantLogoUploader;
