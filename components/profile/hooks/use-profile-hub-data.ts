import type { User } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchProfileHubBundle } from '@/lib/api/profile-hub-data';
import { useAuth } from '@/lib/auth/auth-context';

export function useProfileHubData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profileHub', user?.id],
    queryFn: () => fetchProfileHubBundle(user as User, queryClient),
    enabled: Boolean(user?.id && user.email?.trim()),
    staleTime: 120_000,
  });
}
