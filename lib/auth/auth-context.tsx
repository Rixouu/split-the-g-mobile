import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { getOAuthRedirectTo, oauthRedirectLikelyRejectedByGoTrue } from '@/lib/auth/oauth-redirect';
import { hasSupabaseConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase/client';

import type { Session, User } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  isConfigured: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  accessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!hasSupabaseConfig()) throw new Error('Supabase is not configured.');

    const redirectTo = getOAuthRedirectTo();
    if (__DEV__) {
      if (oauthRedirectLikelyRejectedByGoTrue(redirectTo)) {
        // eslint-disable-next-line no-console -- Dev-only: GoTrue rejects non-loopback IP hosts before the URL allowlist
        console.error(
          '[SplitTheG Auth] OAuth redirectTo uses a non-loopback IP as hostname — Supabase GoTrue rejects this before your Redirect URL allowlist, so sign-in opens the Site URL in the browser instead of returning here. Use `npx expo start --tunnel` and add that exp:// URL to Supabase, or run a development build (`splittheg://auth/callback`). On simulators we rewrite LAN IPs to 127.0.0.1 automatically.',
          redirectTo,
        );
      } else {
        // eslint-disable-next-line no-console -- Dev-only: confirm redirect URL for Supabase allowlist / custom schemes
        console.warn('[SplitTheG Auth] OAuth redirectTo:', redirectTo);
      }
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('Supabase did not return an OAuth URL.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    try {
      if (result.type !== 'success') return;

      const parsed = new URL(result.url);
      const code = parsed.searchParams.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        return;
      }

      const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
      const accessToken = fragment.get('access_token');
      const refreshToken = fragment.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      }
    } finally {
      await WebBrowser.dismissBrowser().catch(() => undefined);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: hasSupabaseConfig(),
      isLoading,
      session,
      user: session?.user ?? null,
      accessToken: session?.access_token ?? null,
      signInWithGoogle,
      signOut,
    }),
    [isLoading, session, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
