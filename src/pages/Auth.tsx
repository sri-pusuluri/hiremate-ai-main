import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getAppBaseUrl } from '@/lib/app-url';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Mail, Lock, User, AlertCircle, Loader2, ShieldCheck, Briefcase, Building2, Check, KeyRound, Eye, EyeOff, Zap, Crosshair, Wind } from 'lucide-react';
import { z } from 'zod';
import { isMockMode, enableMockMode, disableMockMode } from '@/integrations/supabase/client';
import { markInvitationAccepted } from '@/lib/invitations';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Falcon Background Video / Image State
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Local Mock State
  const [mockActive, setMockActive] = useState(isMockMode());

  const handleToggleMockMode = () => {
    if (mockActive) {
      disableMockMode();
    } else {
      enableMockMode();
    }
    setMockActive(!mockActive);
    window.location.reload();
  };

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupName, setSignupName] = useState('');

  useEffect(() => {
    if (!loading && user) {
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect);
    }
  }, [user, loading, navigate]);

  const handleAutofill = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setError(null);
    toast({
      title: `${email.includes('admin') ? 'Admin' : 'Recruiter'} credentials selected`,
      description: 'Email and password populated. Click Sign In to continue.',
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(error.message);
      }
    } else {
      markInvitationAccepted(loginEmail);
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setSuccess(null);
    
    if (!loginEmail) {
      setError('Please enter your email address above first to reset your password.');
      return;
    }
    
    try {
      emailSchema.parse(loginEmail);
    } catch (err) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: `${getAppBaseUrl()}/?reset=true`,
    });
    setIsSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password reset link sent! Please check your email.');
      toast({
        title: "Reset link sent",
        description: "Check your email for the password reset link.",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('already registered')) {
        setError('This email is already registered. Please login instead.');
      } else {
        setError(error.message);
      }
    } else {
      markInvitationAccepted(signupEmail);
      const msg = 'Account created successfully! Please check your email for a verification link to log in.';
      setSuccess(msg);
      toast({
        title: "Check your email",
        description: msg,
      });
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse">
          {user ? 'Redirecting to workspace...' : 'Authenticating...'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden select-none bg-slate-950 font-sans">
      {/* 1. Full-screen natural sky falcon background spanning 100% of viewport */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {!videoError && (
          <video 
            src="/videos/falcon-flying.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        <img 
          src="/images/falcon-hero.jpg" 
          alt="HireSort Falcon Soaring" 
          className={`absolute inset-0 w-full h-full object-cover object-center animate-falcon-glide scale-105 transition-opacity duration-1000 ${videoLoaded ? 'opacity-0' : 'opacity-95'}`}
        />

        {/* Ambient atmospheric lighting & wind streaks */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-[22%] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-falcon-streak-fast" />
          <div className="absolute top-[48%] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sky-200 to-transparent animate-falcon-streak-med" />
          <div className="absolute top-[72%] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-falcon-streak-slow" />
        </div>

        {/* Natural gradient vignette so sky feels deep and texts pop */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-slate-950/70 lg:to-slate-950/40" />
        <div className="absolute inset-0 bg-radial-at-t from-transparent via-transparent to-slate-950/40" />
      </div>

      {/* 2. Foreground Grid: Left Branding & Value Prop, Right Floating Frosted Glass Panel */}
      <div className="relative z-10 h-full w-full grid grid-cols-1 lg:grid-cols-12 p-4 sm:p-6 lg:p-8 xl:p-10 gap-6 lg:gap-8 items-center">
        {/* Left Hero Content: Floats directly over the sky */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 h-full flex-col justify-between py-4 select-none text-white">
          {/* Exclusive Top Branding on the Sky Hero */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20">
              <span className="text-white font-black text-lg tracking-tight">HS</span>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5 drop-shadow-md">
                HireSortAi
              </span>
              <span className="text-xs text-slate-300 block font-medium tracking-wide">
                Autonomous Talent Intelligence
              </span>
            </div>
          </div>

          {/* Hero Headline & Stats */}
          <div className="space-y-4 max-w-xl pb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-slate-100 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Built for fast-moving teams</span>
            </div>

            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-lg">
              Find Signal to Action Instantly
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-lg drop-shadow-sm font-normal">
              High-velocity multi-tenant candidate screening, AI resume synthesis, and deep talent ranking with aerodynamic precision.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
                <div className="text-[11px] text-slate-300 font-medium">Screening Speed</div>
                <div className="text-lg font-extrabold text-white mt-0.5">389 km/h</div>
                <div className="text-[10px] text-slate-300">Peak Velocity</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
                <div className="text-[11px] text-slate-300 font-medium">Signal Match</div>
                <div className="text-lg font-extrabold text-white mt-0.5">99.4%</div>
                <div className="text-[10px] text-slate-300">High-Relevance ATS</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
                <div className="text-[11px] text-slate-300 font-medium">Tenant Silos</div>
                <div className="text-lg font-extrabold text-white mt-0.5">Zero Leak</div>
                <div className="text-[10px] text-slate-300">Data Isolation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Floating Glass Panel (Linear / Apple style) */}
        <div className="col-span-1 lg:col-span-6 xl:col-span-5 h-full flex items-center justify-center lg:justify-end py-4">
          <div className="w-full max-w-md rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl shadow-black/30 p-6 sm:p-7 flex flex-col gap-3.5 overflow-hidden">
            {/* Mobile logo fallback */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                <span className="text-primary-foreground font-bold text-xs">HS</span>
              </div>
              <div>
                <h2 className="text-xs font-bold text-foreground leading-tight">HireSortAi</h2>
                <p className="text-[10px] text-muted-foreground">Enterprise ATS Platform</p>
              </div>
            </div>

            {/* Header: v1.0 Production badge cleanly above Welcome back */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold tracking-wide w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                v1.0 Production
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight pt-0.5">Welcome back</h2>
              <p className="text-xs text-muted-foreground">
                Sign in to your account to continue
              </p>
            </div>

              {error && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="py-2 text-xs border-success/50 bg-success/10">
                  <AlertDescription className="text-success">{success}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-3 h-9 bg-muted/60 backdrop-blur-sm">
                  <TabsTrigger value="login" className="text-xs font-medium">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="text-xs font-medium">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-3.5 mt-0">
                  {/* Sleek 1-click persona chips */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-primary" />
                        Demo Credentials
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">1-click autofill</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAutofill('admin@hiremate.ai', 'admin123')}
                        className={`p-2 rounded-xl border text-left transition-all relative ${
                          loginEmail === 'admin@hiremate.ai'
                            ? 'border-purple-500 bg-purple-500/10 shadow-xs ring-1 ring-purple-500'
                            : 'border-border/60 bg-background/50 hover:bg-background/80 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-purple-500" />
                            SuperAdmin
                          </span>
                          {loginEmail === 'admin@hiremate.ai' && <Check className="w-3 h-3 text-purple-500" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">admin@hiremate.ai</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAutofill('admin@commit.com', 'commit123')}
                        className={`p-2 rounded-xl border text-left transition-all relative ${
                          loginEmail === 'admin@commit.com'
                            ? 'border-blue-500 bg-blue-500/10 shadow-xs ring-1 ring-blue-500'
                            : 'border-border/60 bg-background/50 hover:bg-background/80 hover:border-blue-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-500" />
                            Commit Admin
                          </span>
                          {loginEmail === 'admin@commit.com' && <Check className="w-3 h-3 text-blue-500" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">admin@commit.com</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAutofill('admin@zool.in', 'zool123')}
                        className={`p-2 rounded-xl border text-left transition-all relative ${
                          loginEmail === 'admin@zool.in'
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500'
                            : 'border-border/60 bg-background/50 hover:bg-background/80 hover:border-emerald-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-emerald-500" />
                            Zool Admin
                          </span>
                          {loginEmail === 'admin@zool.in' && <Check className="w-3 h-3 text-emerald-500" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">admin@zool.in</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAutofill('recruiter@hiremate.ai', 'recruiter123')}
                        className={`p-2 rounded-xl border text-left transition-all relative ${
                          loginEmail === 'recruiter@hiremate.ai'
                            ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                            : 'border-border/60 bg-background/50 hover:bg-background/80 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1">
                            <User className="w-3 h-3 text-primary" />
                            Recruiter
                          </span>
                          {loginEmail === 'recruiter@hiremate.ai' && <Check className="w-3 h-3 text-primary" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">recruiter@hiremate.ai</div>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="login-email" className="text-xs font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="name@example.com"
                          className="pl-9 h-9 text-xs bg-background/70 backdrop-blur-xs border-border/70"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-xs font-medium">Password</Label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[11px] text-primary hover:underline focus:outline-none font-medium"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9 pr-9 h-9 text-xs font-mono bg-background/70 backdrop-blur-xs border-border/70"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        >
                          {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-9 text-xs font-semibold shadow-md shadow-primary/20" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-3 mt-0">
                  <form onSubmit={handleSignup} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="signup-name" className="text-xs font-medium">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Jane Doe"
                          className="pl-9 h-9 text-xs bg-background/70 backdrop-blur-xs border-border/70"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="signup-email" className="text-xs font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="name@company.com"
                          className="pl-9 h-9 text-xs bg-background/70 backdrop-blur-xs border-border/70"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="signup-password" className="text-xs font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9 pr-9 h-9 text-xs font-mono bg-background/70 backdrop-blur-xs border-border/70"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-9 text-xs font-semibold shadow-md shadow-primary/20" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

            {/* Bottom Status bar */}
            <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${mockActive ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span>{mockActive ? 'Offline Mock Mode' : 'Supabase Live Connected'}</span>
              </div>
              <button
                type="button"
                onClick={handleToggleMockMode}
                className="hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer"
              >
                Switch to {mockActive ? 'Supabase Live' : 'Offline Mock'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
