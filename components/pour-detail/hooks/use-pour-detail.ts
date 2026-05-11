import { useQuery } from '@tanstack/react-query';

import { fetchPourDetailData } from '@/lib/api/client';

export function usePourDetail(pourRef: string) {
  return useQuery({
    queryKey: ['pourDetail', pourRef],
    queryFn: () => fetchPourDetailData(pourRef),
    enabled: Boolean(pourRef),
  });
}
