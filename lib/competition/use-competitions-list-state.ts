import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { trackEvent } from '@/lib/analytics/client';
import {
  addUserToCompetitionAsParticipant,
  deleteCompetitionById,
  fetchCompetitionInvitesByCompetitionIds,
  fetchCompetitionScoresJoined,
  fetchInvitedCompetitionTitles,
  fetchUserFriendsForInvites,
  fetchUserJoinedOwnedCompetitions,
  fillParticipantCountsForCompetitionIds,
  joinCompetitionAsUser,
  leaveCompetitionAsUser,
  removeCompetitionInvite,
  submitCompetitionInviteRow,
  type CompetitionsCatalogPayload,
} from '@/lib/api/client';
import type { CompetitionDetail, CompetitionInviteRow, FriendPick } from '@/lib/api/types';
import { competitionDetailWebPath } from '@/lib/competition/competition-web-path';
import { buildLeaderboard } from '@/lib/competition/leaderboard';
import { postCompetitionInvitePush, postFriendInviteEmail } from '@/lib/competition/web-invite-bridge';
import type { TranslationKey } from '@/lib/i18n/translations';
import { supabase } from '@/lib/supabase/client';

type ToastState = { key: TranslationKey; vars?: Record<string, string> } | null;

function mergeCompetitions(
  catalog: CompetitionDetail[],
  userRows: CompetitionDetail[] | null,
  userId: string | undefined,
): CompetitionDetail[] {
  if (!userId || userRows === null) return catalog;
  const map = new Map<string, CompetitionDetail>();
  for (const c of catalog) map.set(c.id, c);
  for (const c of userRows) map.set(c.id, c);
  return [...map.values()].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
  );
}

export interface UseCompetitionsListStateArgs {
  catalog: CompetitionsCatalogPayload | undefined;
  user: User | null;
  catalogVersion: number;
  revalidate: () => void;
  tToast: (key: TranslationKey, vars?: Record<string, string>) => string;
}

export function useCompetitionsListState({
  catalog,
  user,
  catalogVersion,
  revalidate,
  tToast,
}: UseCompetitionsListStateArgs) {
  const userId = user?.id;
  const userEmail = user?.email ?? null;

  const [formErrorKey, setFormErrorKey] = useState<TranslationKey | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompetitionDetail | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [clientComps, setClientComps] = useState<CompetitionDetail[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myFriends, setMyFriends] = useState<FriendPick[]>([]);
  const [invitesByComp, setInvitesByComp] = useState<Record<string, CompetitionInviteRow[]>>({});
  const [inviteInputs, setInviteInputs] = useState<Record<string, string>>({});
  const [inviteBusy, setInviteBusy] = useState<string | null>(null);
  const [invitedTitles, setInvitedTitles] = useState<{ competition_id: string; title: string }[]>(
    [],
  );
  const [listingsTab, setListingsTab] = useState<'open' | 'past'>('open');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [pastWinnerByCompId, setPastWinnerByCompId] = useState<Record<string, string | null>>({});

  const loaderCounts = catalog?.participantCounts ?? {};
  const competitions = catalog?.competitions ?? [];
  const listError = catalog?.listError ?? null;

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setCounts(loaderCounts);
  }, [loaderCounts]);

  const mergedCompetitions = useMemo(
    () => mergeCompetitions(competitions, clientComps, userId),
    [competitions, clientComps, userId],
  );

  const { openCompetitions, pastCompetitions } = useMemo(() => {
    const open: CompetitionDetail[] = [];
    const past: CompetitionDetail[] = [];
    for (const c of mergedCompetitions) {
      if (new Date(c.ends_at).getTime() > nowMs) open.push(c);
      else past.push(c);
    }
    return { openCompetitions: open, pastCompetitions: past };
  }, [mergedCompetitions, nowMs]);

  const visibleCompetitions = listingsTab === 'open' ? openCompetitions : pastCompetitions;

  useEffect(() => {
    let cancelled = false;
    if (pastCompetitions.length === 0) {
      setPastWinnerByCompId({});
      return;
    }
    void (async () => {
      const entries = await Promise.all(
        pastCompetitions.map(async (competition) => {
          try {
            const rows = await fetchCompetitionScoresJoined(competition.id);
            const target =
              competition.target_score != null ? Number(competition.target_score) : null;
            const ranked = buildLeaderboard(rows, competition.win_rule, target);
            const winner = ranked[0]?.username ?? null;
            return [competition.id, winner] as const;
          } catch {
            return [competition.id, null] as const;
          }
        }),
      );
      if (!cancelled) setPastWinnerByCompId(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [pastCompetitions]);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (!userId) {
        setJoinedIds(new Set());
        setClientComps(null);
        return;
      }

      const { data: partRows } = await supabase
        .from('competition_participants')
        .select('competition_id')
        .eq('user_id', userId);
      if (cancelled) return;
      setJoinedIds(new Set((partRows ?? []).map((r) => r.competition_id as string)));

      const ownedJoinedRows = await fetchUserJoinedOwnedCompetitions(userId);
      if (cancelled) return;
      setClientComps(ownedJoinedRows);
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [userId, catalogVersion]);

  useEffect(() => {
    const ids = mergedCompetitions
      .map((c) => c.id)
      .filter((id) => loaderCounts[id] == null);
    if (ids.length === 0) return;
    void (async () => {
      const filled = await fillParticipantCountsForCompetitionIds(ids);
      setCounts((prev) => ({ ...prev, ...filled }));
    })();
  }, [mergedCompetitions, loaderCounts]);

  useEffect(() => {
    if (!userId) {
      setMyFriends([]);
      return;
    }
    void (async () => {
      const f = await fetchUserFriendsForInvites(userId);
      setMyFriends(f);
    })();
  }, [userId, catalogVersion]);

  useEffect(() => {
    if (!userId) {
      setInvitesByComp({});
      return;
    }
    const ownedIds = mergedCompetitions
      .filter((c) => c.created_by === userId)
      .map((c) => c.id);
    if (ownedIds.length === 0) {
      setInvitesByComp({});
      return;
    }
    void (async () => {
      const inv = await fetchCompetitionInvitesByCompetitionIds(ownedIds);
      setInvitesByComp(inv);
    })();
  }, [userId, mergedCompetitions, catalogVersion]);

  useEffect(() => {
    if (!userId || !userEmail) {
      setInvitedTitles([]);
      return;
    }
    void (async () => {
      const titles = await fetchInvitedCompetitionTitles(userEmail);
      setInvitedTitles(titles);
    })();
  }, [userId, userEmail, catalogVersion]);

  const requestDeleteCompetition = useCallback(
    (c: CompetitionDetail) => {
      setFormErrorKey(null);
      if (!user || user.id !== c.created_by) {
        setFormErrorKey('competeErrDeleteOwn');
        return;
      }
      setDeleteTarget(c);
    },
    [user],
  );

  const confirmDeleteCompetition = useCallback(async () => {
    if (!deleteTarget) return;
    const c = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteCompetitionById(c.id);
      revalidate();
      setToast({ key: 'competeToastDeleted' });
    } catch {
      setFormErrorKey('competeErrDeleteFailed');
    }
  }, [deleteTarget, revalidate]);

  const handleJoin = useCallback(
    async (compId: string) => {
      setFormErrorKey(null);
      if (!user) {
        setFormErrorKey('competeErrSignInJoin');
        return;
      }
      const competition = mergedCompetitions.find((x) => x.id === compId);
      const count = counts[compId] ?? 0;
      if (!competition || count >= competition.max_participants) {
        setFormErrorKey('competeErrFull');
        return;
      }
      if (joinedIds.has(compId)) return;
      try {
        await joinCompetitionAsUser(compId, user.id);
        setJoinedIds((prev) => new Set(prev).add(compId));
        trackEvent('competition_joined', { competitionId: compId });
        revalidate();
        setToast({ key: 'competeToastJoined' });
      } catch {
        setFormErrorKey('competeErrFull');
      }
    },
    [user, mergedCompetitions, counts, joinedIds, revalidate],
  );

  const handleLeave = useCallback(
    async (compId: string) => {
      if (!user) return;
      try {
        await leaveCompetitionAsUser(compId, user.id);
        setJoinedIds((prev) => {
          const next = new Set(prev);
          next.delete(compId);
          return next;
        });
        trackEvent('competition_left', { competitionId: compId });
        revalidate();
        setToast({ key: 'competeToastLeft' });
      } catch {
        setFormErrorKey('competeErrGeneric');
      }
    },
    [user, revalidate],
  );

  const addEmailInvite = useCallback(
    async (compId: string) => {
      const raw = (inviteInputs[compId] ?? '').trim().toLowerCase();
      if (!raw || !raw.includes('@')) {
        setFormErrorKey('competeErrEmailInvite');
        return;
      }
      setInviteBusy(compId);
      setFormErrorKey(null);
      if (!user?.email) {
        setInviteBusy(null);
        setFormErrorKey('competeErrSignInInvite');
        return;
      }
      try {
        await submitCompetitionInviteRow({
          competition_id: compId,
          invited_email: raw,
          invited_by: user.id,
        });
        setInviteInputs((prev) => ({ ...prev, [compId]: '' }));
        revalidate();

        const competition = mergedCompetitions.find((x) => x.id === compId);
        const path = competitionDetailWebPath(competition ?? { id: compId, path_segment: null });
        const inviterName =
          (user.user_metadata?.full_name as string | undefined)?.trim() ||
          (user.user_metadata?.name as string | undefined)?.trim() ||
          null;
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session?.access_token) {
          await postCompetitionInvitePush({
            type: 'competition_invite_received',
            toEmail: raw,
            actorName: inviterName,
            competitionTitle: competition?.title ?? null,
            path,
          });
        }

        let emailOk = false;
        try {
          const emailResponse = await postFriendInviteEmail({
            inviterEmail: user.email,
            inviterName,
            toEmail: raw,
            invitePath: path,
            competitionTitle: competition?.title ?? null,
          });
          emailOk = emailResponse.ok;
        } catch {
          emailOk = false;
        }

        setInviteBusy(null);
        setToast({ key: emailOk ? 'competeToastInviteSent' : 'competeToastInviteSavedNoEmail' });
      } catch {
        setInviteBusy(null);
        setFormErrorKey('competeErrGeneric');
      }
    },
    [inviteInputs, user, mergedCompetitions, revalidate],
  );

  const removeInvite = useCallback(
    async (_compId: string, inviteId: string) => {
      try {
        await removeCompetitionInvite(inviteId);
        revalidate();
        setToast({ key: 'competeToastInviteRemoved' });
      } catch {
        setFormErrorKey('competeErrGeneric');
      }
    },
    [revalidate],
  );

  const addFriendParticipant = useCallback(
    async (compId: string, friendUserId: string) => {
      setFormErrorKey(null);
      try {
        await addUserToCompetitionAsParticipant(compId, friendUserId);
        revalidate();
        setToast({ key: 'competeToastFriendAdded' });
      } catch {
        setFormErrorKey('competeErrGeneric');
      }
    },
    [revalidate],
  );

  const dismissToast = useCallback(() => {
    setFormErrorKey(null);
    setToast(null);
  }, []);

  const formError = formErrorKey ? tToast(formErrorKey) : null;
  const toastMessage = toast ? tToast(toast.key, toast.vars) : null;

  return {
    listError,
    formError,
    formErrorKey,
    toastMessage,
    toastKey: toast?.key ?? null,
    deleteTarget,
    counts,
    myFriends,
    invitesByComp,
    inviteInputs,
    inviteBusy,
    invitedTitles,
    listingsTab,
    setListingsTab,
    userId,
    joinedIds,
    pastWinnerByCompId,
    openCompetitions,
    pastCompetitions,
    mergedCompetitions,
    visibleCompetitions,
    setInviteInputs,
    requestDeleteCompetition,
    confirmDeleteCompetition,
    handleJoin,
    handleLeave,
    addEmailInvite,
    removeInvite,
    addFriendParticipant,
    dismissToast,
    closeDeleteNotice: () => setDeleteTarget(null),
  };
}
