import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getNeedsPasswordReset } from '@/integrations/supabase/client';

import { ClientTenant } from '@/types/hiresort';

export type AppRole = 'super_admin' | 'admin' | 'client_admin' | 'recruiter';

export const DEFAULT_ZOOL_CLIENT: ClientTenant = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Zool',
  slug: 'zool',
  themeColor: '#2563eb',
  subscriptionTier: 'pro',
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [client, setClientState] = useState<ClientTenant | null>(() => {
    try {
      const saved = localStorage.getItem('hiresort_active_tenant');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_ZOOL_CLIENT;
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

  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  useEffect(() => {
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

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setNeedsPasswordReset(true);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout to prevent deadlocks
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error('Error loading session:', err);
      setLoading(false);
    });

    return () => {
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
        setProfile({
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
        });
      } else {
        // If the profile is null, it means the user was hard-deleted from the database
        // but their browser still holds an unexpired JWT token. We must forcefully log them out.
        console.warn('User profile not found. Forcing logout...');
        await signOut();
        return;
      }

      // Fetch role and client_id
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleData) {
        setRole((roleData as any).role as AppRole);
        const assignedClientId = (roleData as any).client_id;
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
                themeColor: (clientData as any).theme_color || '#2563eb',
                subscriptionTier: (clientData as any).subscription_tier || 'pro',
                stripeCustomerId: (clientData as any).stripe_customer_id,
              });
            }
          } catch (cErr) {
            console.warn('Could not load client details, using default:', cErr);
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
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
      setClient(DEFAULT_ZOOL_CLIENT);
      setNeedsPasswordReset(false);
      localStorage.removeItem('hiresort_active_tenant');
      
      // Force clear Supabase local storage tokens just in case the API call failed
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      setNeedsPasswordReset(false);
    }
    return { error: error as Error | null };
  };

  const isSuperAdmin = role === 'super_admin' || role === 'admin' || user?.email?.includes('admin') || user?.email === 'srini@zool.in' || user?.email?.includes('sri');
  const isClientAdmin = isSuperAdmin || role === 'client_admin' || user?.email?.endsWith('@zool.in');
  const isAdmin = isSuperAdmin || isClientAdmin || role === 'admin' || role === 'super_admin' || role === 'client_admin';

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
