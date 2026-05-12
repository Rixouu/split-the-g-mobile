import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type PropsWithChildren } from 'react';

import { AuthProvider } from '@/lib/auth/auth-context';
import { initAnalyticsConsent } from '@/lib/analytics/consent';
import { LocaleProvider } from '@/lib/i18n/locale-context';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    void initAnalyticsConsent();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider>{children}</AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
