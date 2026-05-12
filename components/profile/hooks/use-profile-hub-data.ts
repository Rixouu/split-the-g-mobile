import type { User } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';

import { fetchProfileHubBundle } from '@/lib/api/profile-hub-data';
import { useAuth } from '@/lib/auth/auth-context';

export function useProfileHubData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profileHub', user?.id],
    queryFn: () => fetchProfileHubBundle(user as User),
    enabled: Boolean(user?.id && user.email?.trim()),
  });
}
