import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getNeedsPasswordReset, enableMockMode } from '@/integrations/supabase/client';
import { getAppBaseUrl } from '@/lib/app-url';

import { ClientTenant } from '@/types/hiresort';

export type AppRole = 'super_admin' | 'admin' | 'client_admin' | 'recruiter';

export const HIRESORT_PLATFORM_CLIENT: ClientTenant = {
  id: 'hiresort-platform-hq',
  name: 'HireSort Platform HQ',
  slug: 'platform',
  themeColor: '#7c3aed',
  subscriptionTier: 'enterprise',
};

export const DEFAULT_ZOOL_CLIENT: ClientTenant = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Zool',
  slug: 'zool',
  logoUrl: '/logos/zool-logo.svg',
  themeColor: '#10b981',
  subscriptionTier: 'pro',
};

export const DEFAULT_COMMIT_CLIENT: ClientTenant = {
  id: '00000000-0000-0000-0000-000000000004',
  name: 'Commit',
  slug: 'commit',
  logoUrl: '/logos/commit-logo.svg',
  themeColor: '#2563eb',
  subscriptionTier: 'enterprise',
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  client: ClientTenant | null;
  clientId: string | null;
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isClientAdmin: boolean;
  setClient: (client: ClientTenant | null) => void;
  needsPasswordReset: boolean;
  setNeedsPasswordReset: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialStoredSession(): { user: User | null; session: Session | null } {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { user: null, session: null };
  }
  try {
    const mockSessionStr = localStorage.getItem('hiremate_mock_session');
    if (mockSessionStr) {
      const parsed = JSON.parse(mockSessionStr);
      if (parsed?.user) return { user: parsed.user, session: parsed };
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          const sess = parsed?.currentSession || parsed;
          if (sess?.user) {
            return { user: sess.user, session: sess };
          }
        }
      }
    }
  } catch (e) {}
  return { user: null, session: null };
}

function getInitialCachedRole(): AppRole | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    return (localStorage.getItem('hiresort_cached_role') as AppRole) || null;
  } catch (e) {
    return null;
  }
}

function getInitialCachedProfile(): AuthContextType['profile'] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    const saved = localStorage.getItem('hiresort_cached_profile');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialAuth = getInitialStoredSession();
  const [user, setUser] = useState<User | null>(initialAuth.user);
  const [session, setSession] = useState<Session | null>(initialAuth.session);
  const [role, setRole] = useState<AppRole | null>(getInitialCachedRole());
  const [client, setClientState] = useState<ClientTenant | null>(() => {
    try {
      const saved = localStorage.getItem('hiresort_active_tenant');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return HIRESORT_PLATFORM_CLIENT;
  });

  const setClient = (newClient: ClientTenant | null) => {
    setClientState(newClient);
    try {
      if (newClient) {
        localStorage.setItem('hiresort_active_tenant', JSON.stringify(newClient));
      } else {
        localStorage.removeItem('hiresort_active_tenant');
      }
    } catch (e) {}
  };

  const [profile, setProfile] = useState<AuthContextType['profile']>(getInitialCachedProfile());
  const [loading, setLoading] = useState<boolean>(() => !initialAuth.user);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Check for PKCE token_hash from server-side emails (like invites or server-initiated resets)
    const searchParams = new URLSearchParams(window.location.search);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as any;
    
    if (tokenHash && type) {
      setLoading(true);
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
        if (!error && (type === 'recovery' || type === 'invite' || searchParams.has('reset'))) {
          setNeedsPasswordReset(true);
        }
        // Safely remove token_hash and type
        searchParams.delete('token_hash');
        searchParams.delete('type');
        const newSearch = searchParams.toString();
        window.history.replaceState({}, '', window.location.pathname + (newSearch ? '?' + newSearch : ''));
      }).catch(err => {
        console.error("Error verifying OTP token_hash", err);
      });
    } else {
      // Check initial state from the client for normal hash fragments or ?reset=true flags
      if (getNeedsPasswordReset() || window.location.search.includes('reset=true')) {
        setNeedsPasswordReset(true);
        
        // Defer URL cleanup to allow Supabase JS to process ?code= PKCE flows first
        setTimeout(() => {
          if (window.location.search.includes('reset=true')) {
            const params = new URLSearchParams(window.location.search);
            params.delete('reset');
            // Do NOT delete 'code', let Supabase handle it if needed
            const newSearch = params.toString();
            window.history.replaceState({}, '', window.location.pathname + (newSearch ? '?' + newSearch : ''));
          }
        }, 2000);
      }
    }

    // Listen to custom event to avoid race conditions
    const handleRecoveryEvent = () => setNeedsPasswordReset(true);
    window.addEventListener('password_recovery_event', handleRecoveryEvent);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;
        if (event === 'PASSWORD_RECOVERY') {
          setNeedsPasswordReset(true);
        }
        
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          setTimeout(() => {
            if (isMounted) fetchUserData(newSession.user.id);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setRole(null);
          setProfile(null);
          try {
            localStorage.removeItem('hiresort_cached_profile');
            localStorage.removeItem('hiresort_cached_role');
          } catch (e) {}
          setLoading(false);
        }
      }
    );

    // Authoritative initial session load
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      if (!isMounted) return;
      if (activeSession?.user) {
        setSession(activeSession);
        setUser(activeSession.user);
        fetchUserData(activeSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setRole(null);
        setProfile(null);
        try {
          localStorage.removeItem('hiresort_cached_profile');
          localStorage.removeItem('hiresort_cached_role');
        } catch (e) {}
        setLoading(false);
      }
    }).catch(err => {
      console.error('Error loading session:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('password_recovery_event', handleRecoveryEvent);
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        const loadedProfile = {
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
        };
        setProfile(loadedProfile);
        try {
          localStorage.setItem('hiresort_cached_profile', JSON.stringify(loadedProfile));
        } catch (e) {}
      } else {
        // Fallback to active user metadata instead of forcefully signing out
        const fallbackName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
        const fallbackProfile = {
          id: userId,
          email: user?.email || '',
          full_name: fallbackName,
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fallbackName)}`,
        };
        setProfile(fallbackProfile);
        try {
          localStorage.setItem('hiresort_cached_profile', JSON.stringify(fallbackProfile));
        } catch (e) {}
      }

      // Fetch role and client_id
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleData) {
        const currentRole = (roleData as any).role as AppRole;
        setRole(currentRole);
        try {
          localStorage.setItem('hiresort_cached_role', currentRole);
        } catch (e) {}
        let assignedClientId = (roleData as any).client_id;

        const emailLower = (profileData?.email || user?.email || '').toLowerCase();
        const isCommitUser = emailLower.includes('commit') || emailLower.includes('comm-it');
        const isZoolUser = emailLower.includes('zool');

        // Self-heal: If user has a comm-it email and was mistakenly assigned to Zool or null, reassign to Commit
        if (isCommitUser && assignedClientId !== DEFAULT_COMMIT_CLIENT.id) {
          assignedClientId = DEFAULT_COMMIT_CLIENT.id;
          supabase
            .from('user_roles')
            .update({ client_id: DEFAULT_COMMIT_CLIENT.id } as any)
            .eq('user_id', userId)
            .then(({ error }: any) => {
              if (error) console.warn('Could not heal user_role client_id to Commit:', error);
            });
        } else if (isZoolUser && !assignedClientId) {
          assignedClientId = DEFAULT_ZOOL_CLIENT.id;
        }

        if (assignedClientId) {
          try {
            const { data: clientData } = await supabase
              .from('clients')
              .select('*')
              .eq('id', assignedClientId)
              .maybeSingle();

            if (clientData) {
              setClient({
                id: (clientData as any).id,
                name: (clientData as any).name,
                slug: (clientData as any).slug,
                logoUrl: (clientData as any).logo_url,
                themeColor: (clientData as any).theme_color || (assignedClientId === DEFAULT_COMMIT_CLIENT.id ? '#10b981' : '#2563eb'),
                subscriptionTier: (clientData as any).subscription_tier || 'pro',
                stripeCustomerId: (clientData as any).stripe_customer_id,
              });
            } else if (assignedClientId === DEFAULT_COMMIT_CLIENT.id || isCommitUser) {
              setClient(DEFAULT_COMMIT_CLIENT);
            } else {
              setClient(DEFAULT_ZOOL_CLIENT);
            }
          } catch (cErr) {
            console.warn('Could not load client details, using default:', cErr);
            if (isCommitUser || assignedClientId === DEFAULT_COMMIT_CLIENT.id) {
              setClient(DEFAULT_COMMIT_CLIENT);
            } else {
              setClient(DEFAULT_ZOOL_CLIENT);
            }
          }
        } else {
          // Super Admin / Platform level account without a locked tenant
          const saved = localStorage.getItem('hiresort_active_tenant');
          if (saved) {
            try {
              setClientState(JSON.parse(saved));
            } catch (e) {
              setClientState(HIRESORT_PLATFORM_CLIENT);
            }
          } else {
            setClientState(HIRESORT_PLATFORM_CLIENT);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const isDemoPersona = ['admin@hiremate.ai', 'admin@commit.com', 'admin@zool.in', 'recruiter@hiremate.ai'].includes(cleanEmail);

    let authRes = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authRes.error && isDemoPersona) {
      console.info('Live Supabase auth rejected demo persona, falling back to local mock session:', authRes.error.message);
      enableMockMode();
      authRes = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    if (!authRes.error && authRes.data?.session) {
      const activeSession = authRes.data.session;
      setSession(activeSession);
      setUser(activeSession.user);
      if (activeSession.user) {
        await fetchUserData(activeSession.user.id);
      }
    }

    return { error: authRes.error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${getAppBaseUrl()}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
      setClient(HIRESORT_PLATFORM_CLIENT);
      setNeedsPasswordReset(false);
      try {
        localStorage.removeItem('hiresort_active_tenant');
        localStorage.removeItem('hiresort_cached_profile');
        localStorage.removeItem('hiresort_cached_role');
      } catch (e) {}
      
      // Force clear Supabase local storage tokens just in case the API call failed
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {}
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      setNeedsPasswordReset(false);
    }
    return { error: error as Error | null };
  };

  const isSuperAdmin = role === 'super_admin' || user?.email === 'admin@hiremate.ai' || user?.email === 'srini@zool.in';
  const isClientAdmin = isSuperAdmin || role === 'client_admin' || role === 'admin';
  const isAdmin = isSuperAdmin || isClientAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role: (role || (isAdmin ? 'admin' : 'recruiter')) as AppRole,
        client,
        clientId: client?.id || DEFAULT_ZOOL_CLIENT.id,
        profile,
        loading,
        signIn,
        signUp,
        updatePassword,
        signOut,
        isAdmin,
        isSuperAdmin,
        isClientAdmin,
        setClient,
        needsPasswordReset,
        setNeedsPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
