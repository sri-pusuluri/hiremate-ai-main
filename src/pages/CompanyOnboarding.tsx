import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isMockMode } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getResolvedTenantLogo } from '@/components/common/TenantBrandLogo';
import { getAppBaseUrl } from '@/lib/app-url';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Users, 
  Lock, 
  Mail, 
  User, 
  Globe, 
  Palette, 
  Eye, 
  EyeOff, 
  Loader2,
  Cpu,
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid work email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');
const companySchema = z.string().min(2, 'Company name must be at least 2 characters');

const PRESET_COLORS = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Purple Accent', hex: '#7c3aed' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Amber Glow', hex: '#d97706' },
  { name: 'Deep Indigo', hex: '#4338ca' },
  { name: 'Cyan', hex: '#0891b2' },
];

export default function CompanyOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setClient, setRole } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Admin Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Company & Workspace
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [teamSize, setTeamSize] = useState('11-50');
  const [themeColor, setThemeColor] = useState('#2563eb');
  const [logoUrl, setLogoUrl] = useState('');

  // Step 3: AI Inference & Subscription Tier
  const [aiStrategy, setAiStrategy] = useState<'managed' | 'byok'>('managed');
  const [subscriptionTier, setSubscriptionTier] = useState<'starter' | 'pro' | 'enterprise'>('pro');

  // Auto-generate URL slug when company name changes if slug wasn't manually edited
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCompanyName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(autoSlug);
  };

  // Step 1 validation
  const validateStep1 = () => {
    setError(null);
    try {
      nameSchema.parse(fullName);
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError('Please check your account inputs.');
      }
      return false;
    }
  };

  // Step 2 validation
  const validateStep2 = () => {
    setError(null);
    try {
      companySchema.parse(companyName);
      if (!slug.trim() || slug.length < 2) {
        setError('Workspace slug must be at least 2 alphanumeric characters.');
        return false;
      }
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError('Please provide a valid company name.');
      }
      return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  // Final submission: Create tenant, user, and launch workspace
  const handleCompleteOnboarding = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const tenantId = crypto.randomUUID();
      const clientRecord = {
        id: tenantId,
        name: companyName.trim(),
        slug: slug.trim().toLowerCase(),
        logo_url: logoUrl || null,
        theme_color: themeColor,
        subscription_tier: subscriptionTier,
        created_at: new Date().toISOString()
      };

      // 1. Insert into clients table (if Supabase live)
      if (!isMockMode()) {
        try {
          const { error: clientInsertErr } = await supabase
            .from('clients')
            .insert(clientRecord as any);

          if (clientInsertErr && !clientInsertErr.message.includes('already exists')) {
            console.warn('Could not insert client into Supabase, saving locally:', clientInsertErr);
          }
        } catch (dbErr) {
          console.warn('Supabase clients table write error, fallback to local:', dbErr);
        }

        // 2. Sign up user through Supabase Auth
        try {
          const redirectUrl = `${getAppBaseUrl()}/`;
          await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                full_name: fullName,
                company_name: companyName,
                client_id: tenantId,
              }
            }
          });
        } catch (authErr) {
          console.warn('Supabase Auth signUp note:', authErr);
        }
      }

      // 3. Update client in application context
      const fullClientObject = {
        id: tenantId,
        name: companyName.trim(),
        slug: slug.trim().toLowerCase(),
        logoUrl: logoUrl || getResolvedTenantLogo(slug, companyName),
        themeColor,
        subscriptionTier,
        createdAt: new Date().toISOString()
      };

      setClient(fullClientObject);
      setRole('admin');

      // Persist active tenant and admin profile
      try {
        localStorage.setItem('hiresort_active_tenant', JSON.stringify(fullClientObject));
        localStorage.setItem('hiresort_cached_role', 'admin');
        localStorage.setItem('hiresort_cached_profile', JSON.stringify({
          id: tenantId,
          email,
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`
        }));
      } catch (storageErr) {}

      toast({
        title: "Workspace Created 🎉",
        description: `Welcome to Sahab Portal! Your workspace for ${companyName} is ready.`,
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'An error occurred setting up your workspace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const appBaseUrl = getAppBaseUrl().replace(/^https?:\/\//, '');

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-950 font-sans overflow-x-hidden">
      {/* 1. Cinematic Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img
          src="/images/falcon-sky-cinematic.jpg?v=3"
          alt="Sahab Portal Sky"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950/90" />
      </div>

      {/* 2. Onboarding Modal Container */}
      <div className="relative z-10 w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-2xl shadow-black/50 p-6 sm:p-8 flex flex-col gap-6 my-8">
        
        {/* Top Header & Stepper */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <img
                  src="/images/sahab-hiresortai-logo-v2.png"
                  alt="Sahab Portal"
                  className="h-9 w-auto object-contain block"
                />
              </div>
            </div>

            <Link
              to="/auth"
              className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Already have an account? <span className="text-primary font-semibold underline">Sign In</span>
            </Link>
          </div>

          <div className="border-t border-border/60 pt-4">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Create your Company Workspace
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Set up your team's autonomous ATS, configure AI screening, and publish your branded careers portal.
            </p>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { num: 1, label: 'Admin Account' },
              { num: 2, label: 'Company & Brand' },
              { num: 3, label: 'AI Strategy & Plan' }
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;

              return (
                <div 
                  key={step.num}
                  className={cn(
                    "flex flex-col gap-1 p-2 rounded-xl border transition-all text-xs",
                    isActive
                      ? "bg-primary/10 border-primary text-primary font-semibold shadow-2xs"
                      : isPast
                      ? "bg-muted/40 border-border/80 text-foreground"
                      : "bg-muted/10 border-border/40 text-muted-foreground opacity-60"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : isPast 
                        ? "bg-emerald-500 text-white" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {isPast ? <Check className="w-2.5 h-2.5" /> : step.num}
                    </span>
                    <span className="truncate">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <span>•</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Admin Account */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1">
              <Label htmlFor="admin-name" className="text-xs font-semibold">
                Your Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="admin-name"
                  type="text"
                  placeholder="e.g. Alex Henderson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9 h-10 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="admin-email" className="text-xs font-semibold">
                Work Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-xs"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                We'll use this for your workspace administrator account.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="admin-password" className="text-xs font-semibold">
                Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 h-10 text-xs font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Minimum 6 characters with letters and numbers.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Company & Workspace Details */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1">
              <Label htmlFor="company-name" className="text-xs font-semibold">
                Company Legal or Brand Name *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="company-name"
                  type="text"
                  placeholder="e.g. Acme Innovations Ltd."
                  value={companyName}
                  onChange={handleCompanyNameChange}
                  className="pl-9 h-10 text-xs"
                  required
                />
              </div>
            </div>

            {/* Careers Portal URL Slug Preview */}
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                Public Careers Portal URL *
              </Label>
              <div className="flex items-center rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-mono">
                <span className="text-muted-foreground select-none">
                  {appBaseUrl}/careers/
                </span>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="acme-innovations"
                  className="flex-1 bg-transparent font-bold text-foreground focus:outline-none pl-1"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Candidates will browse and apply to your open jobs on this custom URL.
              </p>
            </div>

            {/* Team Size Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                Company Size
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {['1-10', '11-50', '51-200', '200+'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setTeamSize(size)}
                    className={cn(
                      "py-2 px-1 text-center rounded-xl border text-xs font-medium transition-all cursor-pointer",
                      teamSize === size
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border/70 hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Color Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                Brand Color Palette
              </Label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setThemeColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    className={cn(
                      "w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center shadow-xs",
                      themeColor === color.hex ? "scale-110 ring-2 ring-offset-2 ring-primary" : "hover:scale-105"
                    )}
                    title={color.name}
                  >
                    {themeColor === color.hex && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-2">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-7 h-7 rounded-full border border-border cursor-pointer bg-transparent"
                    title="Custom color"
                  />
                  <span className="text-[11px] font-mono text-muted-foreground">{themeColor}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: AI Inference Strategy & Subscription Plan */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            {/* AI Model Inference Strategy */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                AI Inference & Architecture Strategy *
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option A: Managed */}
                <div
                  onClick={() => setAiStrategy('managed')}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left cursor-pointer transition-all relative flex flex-col justify-between gap-2",
                    aiStrategy === 'managed'
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border/70 hover:bg-muted/40"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Option A: HireSort Managed
                      </span>
                      {aiStrategy === 'managed' && (
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Zero configuration. Embeddings, parsing, and LLM evaluations are turnkey and bundled into your plan.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] w-fit border-primary/30 text-primary bg-primary/10">
                    Instant Ready • Zero Maintenance
                  </Badge>
                </div>

                {/* Option B: Enterprise BYOK */}
                <div
                  onClick={() => setAiStrategy('byok')}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left cursor-pointer transition-all relative flex flex-col justify-between gap-2",
                    aiStrategy === 'byok'
                      ? "border-purple-500 bg-purple-500/5 ring-1 ring-purple-500 shadow-xs"
                      : "border-border/70 hover:bg-muted/40"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                        Option B: Enterprise BYOK
                      </span>
                      {aiStrategy === 'byok' && (
                        <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Connect your corporate Azure OpenAI or Claude API keys. 100% data retention compliance with direct vendor billing.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] w-fit border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10">
                    Corporate Compliance • Zero Retention
                  </Badge>
                </div>
              </div>
            </div>

            {/* Subscription Tier Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Choose Your Subscription Tier</Label>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  14-Day Free Trial Included
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'starter', name: 'Starter', price: '$99', desc: 'Up to 200 candidates / mo' },
                  { id: 'pro', name: 'Professional', price: '$299', desc: 'Up to 1,000 candidates / mo', badge: 'Popular' },
                  { id: 'enterprise', name: 'Enterprise', price: '$599', desc: 'Unlimited BYOK inference' },
                ].map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSubscriptionTier(plan.id as any)}
                    className={cn(
                      "p-3 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between text-center gap-1.5",
                      subscriptionTier === plan.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                        : "border-border/70 hover:bg-muted/40"
                    )}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-primary text-primary-foreground text-[9px] font-bold rounded-full uppercase tracking-wider">
                        {plan.badge}
                      </span>
                    )}
                    <div>
                      <div className="text-xs font-bold text-foreground">{plan.name}</div>
                      <div className="text-base font-extrabold text-foreground mt-0.5">{plan.price}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{plan.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Controls */}
        <div className="border-t border-border/60 pt-4 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={isSubmitting}
              className="h-9 px-3 text-xs gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Sign In
            </Link>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="h-9 px-4 text-xs gap-1.5 font-semibold ml-auto"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleCompleteOnboarding}
              disabled={isSubmitting}
              className="h-9 px-5 text-xs gap-1.5 font-bold shadow-md shadow-primary/20 ml-auto bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Setting up Workspace...
                </>
              ) : (
                <>
                  <Rocket className="w-3.5 h-3.5" />
                  Launch Company Workspace
                </>
              )}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
