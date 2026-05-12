import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { trackEvent } from '@/lib/analytics/client';
import {
  fetchCompetitionByRef,
  fetchCompetitionParticipantCount,
  fetchCompetitionParticipantUserIds,
  fetchCompetitionScoresJoined,
  fetchFriendRowsBidirectional,
  fetchParticipantEmailsFromCompetitionScores,
  fetchPendingFriendRequestEmails,
  fetchPublicProfilesMap,
  joinCompetitionAsUser,
  leaveCompetitionAsUser,
  sendFriendInviteToPeer,
} from '@/lib/api/client';
import type { ParticipantProfilePick } from '@/lib/api/types';
import { buildLeaderboard } from '@/lib/competition/leaderboard';
import { normalizeEmail } from '@/lib/competition/detail-helpers';

type TimePhase = 'before' | 'live' | 'after';

function peerIdsFromFriendRows(
  rows: { user_id: string; friend_user_id: string }[],
  me: string,
): Set<string> {
  const s = new Set<string>();
  for (const r of rows) {
    if (r.user_id === me) s.add(r.friend_user_id);
    else if (r.friend_user_id === me) s.add(r.user_id);
  }
  return s;
}

export interface CompetitionRosterRow {
  uid: string;
  name: string;
  countryCode: string | null;
  email: string | null;
  isSelf: boolean;
  isFriend: boolean;
  pendingOut: boolean;
}

export function useCompetitionDetailActions(ref: string, user: User | null) {
  const qc = useQueryClient();
  const userId = user?.id;
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const compQuery = useQuery({
    queryKey: ['competition', ref],
    queryFn: () => fetchCompetitionByRef(ref),
    enabled: Boolean(ref),
  });

  const c = compQuery.data;

  const scoresQuery = useQuery({
    queryKey: ['competitionScores', c?.id],
    queryFn: () => fetchCompetitionScoresJoined(c!.id),
    enabled: Boolean(c?.id),
  });

  const participantsQuery = useQuery({
    queryKey: ['competitionParticipantIds', c?.id],
    queryFn: () => fetchCompetitionParticipantUserIds(c!.id),
    enabled: Boolean(c?.id),
  });

  const participantCountQuery = useQuery({
    queryKey: ['competitionParticipants', c?.id],
    queryFn: () => fetchCompetitionParticipantCount(c!.id),
    enabled: Boolean(c?.id),
  });

  const rosterQuery = useQuery({
    queryKey: ['competitionRoster', c?.id, userId],
    queryFn: async () => {
      if (!c?.id) throw new Error('no comp');
      const ids = participantsQuery.data ?? [];
      if (ids.length === 0) {
        return {
          ids: [] as string[],
          profiles: {} as Record<string, ParticipantProfilePick>,
          emails: {} as Record<string, string>,
          friendIds: new Set<string>(),
          pendingToEmails: new Set<string>(),
        };
      }
      const [profiles, emails] = await Promise.all([
        fetchPublicProfilesMap(ids),
        fetchParticipantEmailsFromCompetitionScores(c.id),
      ]);
      let friendIds = new Set<string>();
      let pendingToEmails = new Set<string>();
      if (userId) {
        const [friendRows, pendingList] = await Promise.all([
          fetchFriendRowsBidirectional(userId),
          fetchPendingFriendRequestEmails(userId),
        ]);
        friendIds = peerIdsFromFriendRows(friendRows, userId);
        pendingToEmails = new Set(pendingList.map((e) => normalizeEmail(e)));
      }
      return { ids, profiles, emails, friendIds, pendingToEmails };
    },
    enabled: Boolean(c?.id) && participantsQuery.isSuccess,
  });

  const rosterRows = useMemo((): CompetitionRosterRow[] => {
    const pack = rosterQuery.data;
    if (!pack) return [];
    const { ids, profiles, emails, friendIds, pendingToEmails } = pack;
    const decorated = ids.map((uid) => {
      const profile = profiles[uid];
      const name =
        profile?.nickname?.trim() || profile?.display_name?.trim() || 'Player';
      const cc = profile?.country_code?.trim().toUpperCase() ?? null;
      const countryCode = cc && /^[A-Z]{2}$/.test(cc) ? cc : null;
      const email = emails[uid] ?? null;
      const isSelf = userId === uid;
      const isFriend = userId ? friendIds.has(uid) : false;
      const pendingOut = Boolean(
        email && userId && pendingToEmails.has(normalizeEmail(email)) && !isFriend && !isSelf,
      );
      return { uid, name, countryCode, email, isSelf, isFriend, pendingOut };
    });
    decorated.sort((a, b) => {
      if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return decorated;
  }, [rosterQuery.data, userId]);

  const ranked = useMemo(() => {
    if (!c) return [];
    const target = c.target_score != null ? Number(c.target_score) : null;
    return buildLeaderboard(scoresQuery.data ?? [], c.win_rule, target);
  }, [c, scoresQuery.data]);

  const timePhase = useMemo((): TimePhase | null => {
    if (!c) return null;
    const start = new Date(c.starts_at).getTime();
    const end = new Date(c.ends_at).getTime();
    if (nowMs < start) return 'before';
    if (nowMs > end) return 'after';
    return 'live';
  }, [c, nowMs]);

  const joined = Boolean(userId && participantsQuery.data?.includes(userId));

  const rosterFull = (participantCountQuery.data ?? 0) >= (c?.max_participants ?? 0);

  const canJoin = Boolean(
    userId && !joined && timePhase !== 'after' && c && !rosterFull,
  );

  const invalidateRoster = useCallback(() => {
    if (!c?.id) return;
    void qc.invalidateQueries({ queryKey: ['competitionRoster', c.id, userId] });
  }, [qc, c?.id, userId]);

  const invalidate = useCallback(() => {
    if (!c?.id) return;
    void qc.invalidateQueries({ queryKey: ['competition', ref] });
    void qc.invalidateQueries({ queryKey: ['competitionScores', c.id] });
    void qc.invalidateQueries({ queryKey: ['competitionParticipantIds', c.id] });
    void qc.invalidateQueries({ queryKey: ['competitionParticipants', c.id] });
    void qc.invalidateQueries({ queryKey: ['competitions', 'catalog'] });
    invalidateRoster();
  }, [qc, ref, c?.id, invalidateRoster]);

  const joinMut = useMutation({
    mutationFn: async () => {
      if (!userId || !c) throw new Error('auth');
      await joinCompetitionAsUser(c.id, userId);
      trackEvent('competition_joined', { competitionId: c.id });
    },
    onSuccess: invalidate,
  });

  const leaveMut = useMutation({
    mutationFn: async () => {
      if (!userId || !c) throw new Error('auth');
      await leaveCompetitionAsUser(c.id, userId);
      trackEvent('competition_left', { competitionId: c.id });
    },
    onSuccess: invalidate,
  });

  const inviteMut = useMutation({
    mutationFn: async ({ peerEmail }: { peerEmail: string }) => {
      if (!userId || !user || !c) throw new Error('auth');
      const inviterName =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        (user.user_metadata?.name as string | undefined)?.trim() ||
        null;
      await sendFriendInviteToPeer({
        fromUserId: userId,
        fromEmail: user.email ?? null,
        inviterName,
        peerEmail,
        competition: { id: c.id, path_segment: c.path_segment ?? null, title: c.title },
      });
    },
    onSuccess: invalidateRoster,
  });

  return {
    compQuery,
    c,
    ranked,
    timePhase,
    joined,
    canJoin,
    joinPending: joinMut.isPending,
    leavePending: leaveMut.isPending,
    actionError: joinMut.error ?? leaveMut.error,
    join: () => joinMut.mutate(),
    leave: () => leaveMut.mutate(),
    participantCount: participantCountQuery.data ?? 0,
    scoresLoading: scoresQuery.isLoading,
    rosterRows,
    rosterLoading: rosterQuery.isLoading,
    inviteFriend: (peerEmail: string) => inviteMut.mutate({ peerEmail }),
    invitePending: inviteMut.isPending,
  };
}
