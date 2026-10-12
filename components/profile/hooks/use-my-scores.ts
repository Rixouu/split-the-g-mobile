import { useQuery } from '@tanstack/react-query';

import { myScoresQueryOptions } from '@/lib/queries/profile';
import { useAuth } from '@/lib/auth/auth-context';

export function useMyScores() {
  const { user } = useAuth();
  return useQuery(myScoresQueryOptions(user?.id, user?.email));
}
