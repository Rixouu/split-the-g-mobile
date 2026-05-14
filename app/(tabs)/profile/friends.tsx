import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { FriendRequestRow, UserFriendRow } from '@/lib/api/profile';
import {
  loadFriendComparisonScores,
  loadSocial,
  removeFriendPair,
  respondFriendRequest,
  sendFriendInvite,
  withdrawFriendRequest,
} from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { buildFriendLeaderboard } from '@/lib/profile/profile-leaderboard';
import { normalizeEmail } from '@/lib/utils/profile-email';

/** Web `border-[#372C16]` on profile friends sections. */
const SECTION_STROKE = '#372C16';

export default function ProfileFriendsScreen() {
  const { user } = useAuth();
  const { t, tVars, locale } = useLocale();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [banner, setBanner] = useState<string | null>(null);

  const socialQuery = useQuery({
    queryKey: ['social', user?.id, user?.email],
    queryFn: () => loadSocial(user!.id, user!.email ?? null),
    enabled: Boolean(user?.id),
  });

  const acceptedFriends = useMemo(() => {
    if (!user?.id) return [];
    return (socialQuery.data?.friends ?? []).filter((f) => f.user_id === user.id);
  }, [socialQuery.data?.friends, user?.id]);

  const friendComparisonKey = useMemo(
    () => acceptedFriends.map((f) => `${f.friend_user_id}:${f.peer_email ?? ''}`).sort().join('|'),
    [acceptedFriends],
  );

  const comparisonQuery = useQuery({
    queryKey: ['friendComparison', user?.id, user?.email, friendComparisonKey],
    queryFn: () =>
      loadFriendComparisonScores(user!.id, user!.email ?? null, socialQuery.data!.friends),
    enabled: Boolean(user?.id && user?.email && socialQuery.isSuccess && socialQuery.data),
  });

  const statsByEmail = useMemo(() => {
    if (!user?.email || !comparisonQuery.data) return {};
    const board = buildFriendLeaderboard(
      comparisonQuery.data.scores,
      comparisonQuery.data.labels,
      normalizeEmail(user.email),
    );
    return board.reduce<Record<string, (typeof board)[0]>>((acc, e) => {
      acc[e.email] = e;
      return acc;
    }, {});
  }, [comparisonQuery.data, user?.email]);

  const invalidateSocial = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['social', user?.id, user?.email] }),
      qc.invalidateQueries({ queryKey: ['friendComparison', user?.id] }),
    ]);

  const inviteMut = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error(t('errorSignInRequired'));
      const to = normalizeEmail(email);
      if (to === normalizeEmail(user.email ?? '')) throw new Error(t('errorCannotAddSelf'));
      return sendFriendInvite({ fromUserId: user.id, fromEmail: user.email ?? null, toEmail: to });
    },
    onSuccess: async () => {
      setEmail('');
      setBanner(t('profileFriendsInviteSent'));
      await invalidateSocial();
    },
    onError: (e: Error) => setBanner(e.message),
  });

  const respondMut = useMutation({
    mutationFn: async (p: { row: FriendRequestRow; status: 'accepted' | 'declined' }) => {
      await respondFriendRequest(p.row, p.status, user!.id, user!.email ?? null);
    },
    onSuccess: () => void invalidateSocial(),
  });

  const withdrawMut = useMutation({
    mutationFn: (row: FriendRequestRow) => withdrawFriendRequest(row.id, user!.id),
    onSuccess: () => void invalidateSocial(),
  });

  const removeMut = useMutation({
    mutationFn: (f: UserFriendRow) => {
      if (!user?.id) throw new Error('no user');
      const other = f.user_id === user.id ? f.friend_user_id : f.user_id;
      return removeFriendPair(user.id, other);
    },
    onSuccess: () => void invalidateSocial(),
  });

  const outgoing = socialQuery.data?.outgoing ?? [];
  const incoming = socialQuery.data?.incoming ?? [];

  const dateSent = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'en' ? undefined : locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      {!user ? (
        <View style={styles.sectionPanel}>
          <Body>{t('signInPrompt')}</Body>
        </View>
      ) : null}

      {user ? (
        <View style={styles.sectionPanel}>
          <Text style={styles.sectionTitle}>{t('profileFriendsTitle')}</Text>
          <Muted style={styles.blurb}>{t('profileFriendsBlurb')}</Muted>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('profileFriendsPlaceholder')}
            placeholderTextColor={brandColors.tanMuted}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {banner ? <Muted>{banner}</Muted> : null}
          <AppButton
            label={t('profileFriendsSend')}
            shape="rounded"
            fullWidth
            disabled={inviteMut.isPending}
            onPress={() => {
              setBanner(null);
              inviteMut.mutate();
            }}
          />
          <View style={styles.statRow}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>{t('profileFriendsCountFriends')}</Text>
              <Text style={styles.statValue}>{acceptedFriends.length}</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>{t('profileFriendsCountIncoming')}</Text>
              <Text style={styles.statValue}>{incoming.length}</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>{t('profileFriendsCountPending')}</Text>
              <Text style={styles.statValue}>{outgoing.length}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {user && incoming.length > 0 ? (
        <View style={styles.sectionPanel}>
          <Text style={styles.sectionTitle}>{t('profileFriendsIncomingTitle')}</Text>
          {incoming.map((r) => (
            <View key={r.id} style={styles.incomingCard}>
              <View style={styles.incomingText}>
                <Body style={styles.incomingFrom}>
                  {r.from_email || t('profileFriendsUnknownRequester')}
                </Body>
                <Muted style={styles.sentOn}>
                  {tVars('profileFriendsSentOn', { date: dateSent(r.created_at) })}
                </Muted>
              </View>
              <View style={styles.incomingActions}>
                <AppButton
                  label={t('profileFriendsAccept')}
                  shape="rounded"
                  onPress={() => respondMut.mutate({ row: r, status: 'accepted' })}
                  disabled={respondMut.isPending}
                />
                <AppButton
                  label={t('profileFriendsDecline')}
                  variant="secondary"
                  shape="rounded"
                  onPress={() => respondMut.mutate({ row: r, status: 'declined' })}
                  disabled={respondMut.isPending}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {user ? (
        <View style={styles.sectionPanel}>
          <View style={styles.yourFriendsHeader}>
            <View style={styles.yourFriendsTitles}>
              <Text style={styles.sectionTitle}>{t('profileFriendsYourFriendsTitle')}</Text>
              <Muted style={styles.blurbTight}>{t('profileFriendsYourFriendsBlurb')}</Muted>
            </View>
            <Muted style={styles.acceptedCount}>
              {tVars('profileFriendsAcceptedCount', { count: String(acceptedFriends.length) })}
            </Muted>
          </View>
          {acceptedFriends.length > 0 ? (
            acceptedFriends.map((f) => {
              const peerEmailRaw = f.peer_email?.trim() ?? null;
              const emailKey = peerEmailRaw ? normalizeEmail(peerEmailRaw) : null;
              const stats = emailKey ? statsByEmail[emailKey] : null;
              const titleLine =
                stats?.label ||
                f.peer_email ||
                tVars('profileFriendsPlayerTruncated', { id: f.friend_user_id.slice(0, 8) });
              const emailLine = f.peer_email || t('profileFriendsNoEmailLinked');
              return (
                <View key={`${f.user_id}-${f.friend_user_id}`} style={styles.friendCard}>
                  <View style={styles.friendCardTop}>
                    <View style={styles.friendCardText}>
                      <Text numberOfLines={1} style={styles.friendName}>
                        {titleLine}
                      </Text>
                      <Muted numberOfLines={1} style={styles.friendEmail}>
                        {emailLine}
                      </Muted>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => removeMut.mutate(f)}
                      disabled={removeMut.isPending}
                      style={({ pressed }) => [
                        styles.removeBtn,
                        pressed && !removeMut.isPending ? styles.removeBtnPressed : null,
                      ]}>
                      <Text style={styles.removeLabel}>{t('profileFriendsRemove')}</Text>
                    </Pressable>
                  </View>
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Muted style={styles.statBoxLabel}>{t('profileProgressStatPours')}</Muted>
                      <Text style={styles.statBoxValue}>{stats?.pours ?? 0}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Muted style={styles.statBoxLabel}>{t('profileFriendsStatAvgShort')}</Muted>
                      <Text style={styles.statBoxValue}>
                        {stats ? stats.avg.toFixed(2) : '\u2014'}
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Muted style={styles.statBoxLabel}>{t('profileFriendsStatBestShort')}</Muted>
                      <Text style={styles.statBoxValue}>
                        {stats ? stats.best.toFixed(2) : '\u2014'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Muted style={styles.emptyBlurb}>{t('profileFriendsEmptyAccepted')}</Muted>
          )}
        </View>
      ) : null}

      {user ? (
        <View style={styles.sectionPanel}>
          <Text style={styles.sectionTitle}>{t('profileFriendsOutgoing')}</Text>
          {outgoing.length > 0 ? (
            outgoing.map((r) => (
              <View key={r.id} style={styles.pendingCard}>
                <View style={styles.pendingText}>
                  <Body style={styles.pendingEmail}>{String(r.to_email)}</Body>
                  <Muted style={styles.sentOn}>
                    {tVars('profileFriendsSentOn', { date: dateSent(r.created_at) })}
                  </Muted>
                </View>
                <AppButton
                  label={t('profileFriendsCancelInvite')}
                  variant="secondary"
                  shape="rounded"
                  onPress={() => withdrawMut.mutate(r)}
                  disabled={withdrawMut.isPending}
                />
              </View>
            ))
          ) : (
            <Muted style={styles.emptyBlurb}>{t('profileFriendsEmptyPending')}</Muted>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionPanel: {
    gap: 14,
    borderWidth: 1,
    borderColor: SECTION_STROKE,
    borderRadius: 14,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    padding: 18,
  },
  sectionTitle: {
    color: brandColors.gold,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  blurb: {
    marginTop: -4,
  },
  blurbTight: {
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: brandColors.cream,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: SECTION_STROKE,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 11, 11, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(212, 183, 143, 0.55)',
    textAlign: 'center',
  },
  statValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: brandColors.gold,
  },
  yourFriendsHeader: {
    gap: 8,
  },
  yourFriendsTitles: {
    gap: 0,
  },
  acceptedCount: {
    color: 'rgba(212, 183, 143, 0.55)',
    fontSize: 13,
  },
  friendCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.1)',
    backgroundColor: 'rgba(11, 11, 11, 0.3)',
    padding: 14,
    gap: 12,
  },
  friendCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  friendCardText: {
    flex: 1,
    minWidth: 0,
  },
  friendName: {
    color: brandColors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
  friendEmail: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(212, 183, 143, 0.6)',
  },
  removeBtn: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeBtnPressed: {
    backgroundColor: 'rgba(69, 10, 10, 0.25)',
  },
  removeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(248, 113, 113, 0.95)',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statBoxLabel: {
    fontSize: 12,
    color: 'rgba(212, 183, 143, 0.55)',
  },
  statBoxValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: brandColors.gold,
  },
  emptyBlurb: {
    marginTop: 2,
  },
  incomingCard: {
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.1)',
    backgroundColor: 'rgba(11, 11, 11, 0.3)',
    padding: 14,
  },
  incomingText: {
    gap: 4,
  },
  incomingFrom: {
    fontWeight: '600',
  },
  sentOn: {
    fontSize: 13,
  },
  incomingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pendingCard: {
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.1)',
    backgroundColor: 'rgba(11, 11, 11, 0.3)',
    padding: 14,
  },
  pendingText: {
    gap: 4,
  },
  pendingEmail: {
    fontWeight: '600',
  },
});
