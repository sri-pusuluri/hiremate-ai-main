import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Mail, Lock, User, AlertCircle, Loader2, ShieldCheck, Briefcase, Check, KeyRound } from 'lucide-react';
import { z } from 'zod';
import { isMockMode, enableMockMode, disableMockMode } from '@/integrations/supabase/client';

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

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
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
    let { error } = await signIn(loginEmail, loginPassword);

    // If Supabase returns invalid login credentials for demo accounts, auto-register them or provide mock fallback
    if (error && error.message.includes('Invalid login credentials') && (loginEmail === 'admin@hiremate.ai' || loginEmail === 'recruiter@hiremate.ai')) {
      const isAdm = loginEmail.includes('admin');
      const signupRes = await signUp(loginEmail, loginPassword, isAdm ? 'Administrator' : 'Jane Recruiter');
      if (!signupRes.error) {
        const retry = await signIn(loginEmail, loginPassword);
        error = retry.error;
      }
    }

    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(error.message);
      }
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
      redirectTo: `${window.location.origin}/?reset=true`,
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
      const msg = 'Account created successfully! Please check your email for a verification link to log in.';
      setSuccess(msg);
      toast({
        title: "Check your email",
        description: msg,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">TS</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">HireSortAi</h1>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-ai-accent" />
              <span>AI-Powered Hiring Platform</span>
            </div>
          </div>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-success/50 bg-success/10">
                <AlertDescription className="text-success">{success}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {/* One-Click Demo Credentials */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <KeyRound className="w-3.5 h-3.5 text-primary" />
                      <span>Demo Credentials</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">1-click autofill</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Admin Credential Card */}
                    <button
                      type="button"
                      onClick={() => handleAutofill('admin@hiremate.ai', 'admin123')}
                      className={`p-2.5 rounded-lg border text-left transition-all relative ${
                        loginEmail === 'admin@hiremate.ai'
                          ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                          : 'border-border/70 bg-background hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-bold text-foreground">Admin</span>
                        </div>
                        {loginEmail === 'admin@hiremate.ai' && (
                          <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">admin@hiremate.ai</p>
                      <p className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">pass: <span className="text-foreground/90 font-semibold">admin123</span></p>
                    </button>

                    {/* Recruiter Credential Card */}
                    <button
                      type="button"
                      onClick={() => handleAutofill('recruiter@hiremate.ai', 'recruiter123')}
                      className={`p-2.5 rounded-lg border text-left transition-all relative ${
                        loginEmail === 'recruiter@hiremate.ai'
                          ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                          : 'border-border/70 bg-background hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                          <span className="text-xs font-bold text-foreground">Recruiter</span>
                        </div>
                        {loginEmail === 'recruiter@hiremate.ai' && (
                          <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">recruiter@hiremate.ai</p>
                      <p className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">pass: <span className="text-foreground/90 font-semibold">recruiter123</span></p>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@company.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-primary hover:underline"
                      disabled={isSubmitting}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@company.com"
                        className="pl-10"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    First user to sign up becomes admin. All others become recruiters.
                  </p>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Database Mode Switcher */}
        <div className="mt-6 p-4 rounded-lg border border-border bg-card shadow-sm text-center">
          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">Database Connectivity</p>
              <p className="text-[11px] text-muted-foreground">
                {mockActive ? 'Offline (Local Mock Mode)' : 'Online (Supabase Connection)'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8" 
              onClick={handleToggleMockMode}
            >
              Switch to {mockActive ? 'Supabase' : 'Offline Mock'}
            </Button>
          </div>
          {mockActive && (
            <div className="mt-3 pt-3 border-t border-border text-left">
              <p className="text-[11px] text-muted-foreground font-semibold">Offline Demo Accounts:</p>
              <ul className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                <li>• Admin: <code className="bg-muted px-1 py-0.5 rounded font-mono">admin@hiremate.ai</code> / <code className="bg-muted px-1 py-0.5 rounded font-mono">admin123</code></li>
                <li>• Recruiter: <code className="bg-muted px-1 py-0.5 rounded font-mono">recruiter@hiremate.ai</code> / <code className="bg-muted px-1 py-0.5 rounded font-mono">recruiter123</code></li>
              </ul>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
