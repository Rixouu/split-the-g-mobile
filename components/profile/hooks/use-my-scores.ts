import { useQuery } from '@tanstack/react-query';

import { fetchMyScores } from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/auth-context';

export function useMyScores() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['myScores', user?.id],
    queryFn: () => fetchMyScores(user!.email!),
    enabled: Boolean(user?.email?.trim()),
  });
}
