import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/split-the-g/button';
import { Card } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import { fetchCompetitionsCatalog } from '@/lib/api/client';
import type { CompetitionDetail } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import {
  isPrivateCompetitionVisibility,
  isStoredGlassesUnlimited,
  winRuleUsesUnlimitedGlasses,
} from '@/lib/competition/edit-shared';
import { useCompetitionsListState } from '@/lib/competition/use-competitions-list-state';
import { translationKeyForWinRule } from '@/lib/competition/win-rule-i18n';
import { useLocale } from '@/lib/i18n/locale-context';
import type { TranslationKey } from '@/lib/i18n/translations';

const AD_MAILTO =
  'mailto:contact@split-the-g.app?subject=Split%20the%20G%20%E2%80%94%20competitions%20advertising';

function nativeCompetitionRef(c: CompetitionDetail): string {
  const seg = c.path_segment?.trim();
  return encodeURIComponent(seg || c.id);
}

function formatRange(starts: string, ends: string) {
  try {
    const s = new Date(starts);
    const e = new Date(ends);
    return `${s.toLocaleString()} → ${e.toLocaleString()}`;
  } catch {
    return `${starts} – ${ends}`;
  }
}

export default function CompetitionHomeScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { t, tVars } = useLocale();
  const { user } = useAuth();
  const [expandedInvitesId, setExpandedInvitesId] = useState<string | null>(null);

  const catalogQuery = useQuery({
    queryKey: ['competitions', 'catalog'],
    queryFn: () => fetchCompetitionsCatalog(40),
  });

  const tToast = useCallback(
    (key: TranslationKey, vars?: Record<string, string>) =>
      vars ? tVars(key, vars as Record<string, string | number>) : t(key),
    [t, tVars],
  );

  const listState = useCompetitionsListState({
    catalog: catalogQuery.data,
    user: user ?? null,
    catalogVersion: catalogQuery.dataUpdatedAt,
    revalidate: () => {
      void qc.invalidateQueries({ queryKey: ['competitions', 'catalog'] });
      void catalogQuery.refetch();
    },
    tToast,
  });

  const {
    listError,
    formError,
    toastMessage,
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
    closeDeleteNotice,
  } = listState;

  const bannerMessage = toastMessage ?? formError;

  useEffect(() => {
    if (!deleteTarget) return;
    Alert.alert(
      t('competeDeleteTitle'),
      t('competeDeleteMessage'),
      [
        {
          text: t('competeDeleteKeep'),
          style: 'cancel',
          onPress: () => closeDeleteNotice(),
        },
        {
          text: t('competeDeleteConfirm'),
          style: 'destructive',
          onPress: () => {
            void confirmDeleteCompetition();
          },
        },
      ],
      { cancelable: true, onDismiss: () => closeDeleteNotice() },
    );
  }, [deleteTarget, t, confirmDeleteCompetition, closeDeleteNotice]);

  const header = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <View style={styles.hero}>
          <Eyebrow>{t('competeEyebrow')}</Eyebrow>
          <Title>{t('competeTitle')}</Title>
          <Muted>{t('competeSubtitle')}</Muted>
          <AppButton label={t('competeCreateCta')} onPress={() => router.push('/competition/create')} />
        </View>

        {invitedTitles.length > 0 ? (
          <View style={styles.invitedWrap}>
            <Card>
              <Body style={styles.invitedTitle}>{t('competeInvitedTitle')}</Body>
              {invitedTitles.map((row) => (
                <Muted key={row.competition_id}>• {row.title}</Muted>
              ))}
              <Muted style={styles.invitedHint}>{t('competeInvitedHint')}</Muted>
            </Card>
          </View>
        ) : null}

        <Pressable
          onPress={() => void Linking.openURL(AD_MAILTO)}
          style={({ pressed }) => [styles.adCard, pressed && styles.pressed]}>
          <Text style={styles.adEyebrow}>{t('competeAdTitle')}</Text>
          <Muted>{t('competeAdBody')}</Muted>
          <Body style={styles.adCta}>{t('competeAdCta')}</Body>
        </Pressable>

        <View style={styles.mineHeader}>
          <Title style={styles.mineTitle}>{t('competeMineHeading')}</Title>
          <Muted>{t('competeMineDescription')}</Muted>
          <Muted style={styles.countsMeta}>
            {tVars('competeOpenPastCounts', {
              open: String(openCompetitions.length),
              past: String(pastCompetitions.length),
            })}
          </Muted>
        </View>

        <View style={styles.segment} accessibilityRole="tablist">
          {(['open', 'past'] as const).map((k) => {
            const active = listingsTab === k;
            const label = k === 'open' ? t('competeTabOpen') : t('competeTabPast');
            return (
              <Pressable
                key={k}
                onPress={() => setListingsTab(k)}
                style={[styles.segmentTab, active && styles.segmentTabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}>
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {listError ? (
          <Card>
            <Body>{tVars('competeListError', { detail: listError })}</Body>
          </Card>
        ) : null}

        {bannerMessage ? (
          <Pressable onPress={dismissToast} style={styles.feedbackBanner}>
            <Body style={styles.feedbackText}>{bannerMessage}</Body>
            <Muted style={styles.dismissHint}>Tap to dismiss</Muted>
          </Pressable>
        ) : null}
      </View>
    ),
    [
      t,
      tVars,
      router,
      invitedTitles,
      openCompetitions.length,
      pastCompetitions.length,
      listingsTab,
      setListingsTab,
      listError,
      bannerMessage,
      dismissToast,
    ],
  );

  const renderItem: ListRenderItem<CompetitionDetail> = ({ item: c }) => {
    const count = counts[c.id] ?? 0;
    const isOwner = userId === c.created_by;
    const isJoined = joinedIds.has(c.id);
    const isPastTab = listingsTab === 'past';
    const full = count >= c.max_participants;
    const priv = isPrivateCompetitionVisibility(c.visibility);
    const invites = invitesByComp[c.id] ?? [];
    const rawWinner = pastWinnerByCompId[c.id];
    const winnerLine =
      rawWinner === undefined
        ? t('competeWinnerDash')
        : rawWinner === null
          ? t('competeNoPoursLogged')
          : rawWinner;

    const ref = nativeCompetitionRef(c);

    return (
      <Card>
        <View style={styles.cardInner}>
          <View style={styles.cardTop}>
            <View style={styles.titleRow}>
              <Title style={styles.cardTitle}>{c.title}</Title>
              {isPastTab ? (
                <Text style={styles.badgeEnded}>{t('competeBadgeEnded')}</Text>
              ) : null}
              {isJoined ? (
                <Text style={isPastTab ? styles.badgeGhost : styles.badgeIn}>
                  {isPastTab ? t('competeBadgeParticipated') : t('competeBadgeIn')}
                </Text>
              ) : null}
              <Text style={priv ? styles.badgePriv : styles.badgePub}>
                {priv ? t('competeBadgePrivate') : t('competeBadgePublic')}
              </Text>
            </View>
            <Muted style={styles.dateLine}>{formatRange(c.starts_at, c.ends_at)}</Muted>
            {isPastTab ? (
              <Body style={styles.winnerLine}>
                {t('competeWinner')}: {winnerLine}
              </Body>
            ) : null}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Muted style={styles.statLabel}>{t('competeStatJoined')}</Muted>
              <Body>
                {count} / {c.max_participants}
              </Body>
            </View>
            <View style={styles.stat}>
              <Muted style={styles.statLabel}>{t('competeStatGlasses')}</Muted>
              <Body>
                {winRuleUsesUnlimitedGlasses(c.win_rule) || isStoredGlassesUnlimited(c.glasses_per_person)
                  ? t('competeGlassesUnlimited')
                  : c.glasses_per_person}
              </Body>
            </View>
            <View style={styles.stat}>
              <Muted style={styles.statLabel}>{t('competeStatRule')}</Muted>
              <Body style={styles.ruleText}>
                {t(translationKeyForWinRule(c.win_rule))}
                {c.win_rule === 'closest_to_target' && c.target_score != null
                  ? ` · ${Number(c.target_score).toFixed(2)}`
                  : ''}
              </Body>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <AppButton
              label={t('competeView')}
              variant="secondary"
              onPress={() => router.push(`/competition/${ref}`)}
            />
            {isOwner ? (
              <>
                <AppButton
                  label={t('competeEdit')}
                  variant="secondary"
                  onPress={() => router.push(`/competition/${ref}/edit`)}
                />
                <AppButton
                  label={t('competeDelete')}
                  variant="secondary"
                  onPress={() => void requestDeleteCompetition(c)}
                />
              </>
            ) : userId ? (
              isJoined ? (
                <AppButton
                  label={t('competeLeave')}
                  variant="secondary"
                  onPress={() => void handleLeave(c.id)}
                />
              ) : isPastTab ? (
                <Muted>{t('competeClosed')}</Muted>
              ) : (
                <AppButton
                  label={full ? t('competeFull') : t('competeJoin')}
                  disabled={full}
                  onPress={() => void handleJoin(c.id)}
                />
              )
            ) : isPastTab ? null : (
              <Muted>{t('competeSignInJoin')}</Muted>
            )}
          </View>

          {isOwner && !isPastTab ? (
            <View style={styles.invitesWrap}>
              <Pressable
                onPress={() => setExpandedInvitesId((id) => (id === c.id ? null : c.id))}
                style={styles.invitesToggle}>
                <Body style={styles.invitesToggleText}>{t('competeInvitesSection')}</Body>
                <Muted>{expandedInvitesId === c.id ? '▲' : '▼'}</Muted>
              </Pressable>
              {expandedInvitesId === c.id ? (
                <View style={styles.invitesBody}>
                  <Muted>{t('competeInviteEmail')}</Muted>
                  <Muted style={styles.hint}>{t('competeInviteEmailHint')}</Muted>
                  <TextInput
                    value={inviteInputs[c.id] ?? ''}
                    onChangeText={(v) => setInviteInputs((prev) => ({ ...prev, [c.id]: v }))}
                    placeholder={t('competeInvitePlaceholder')}
                    placeholderTextColor={brandColors.tanMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.inviteInput}
                  />
                  <AppButton
                    label={t('competeSendInvite')}
                    disabled={inviteBusy === c.id}
                    onPress={() => void addEmailInvite(c.id)}
                  />
                  {invites.length > 0 ? (
                    <View style={styles.inviteList}>
                      {invites.map((inv) => (
                        <View key={inv.id} style={styles.inviteLine}>
                          <Body style={styles.inviteEmail}>{inv.invited_email}</Body>
                          <Pressable onPress={() => void removeInvite(c.id, inv.id)}>
                            <Body style={styles.removeLink}>{t('competeRemoveInvite')}</Body>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {myFriends.length > 0 ? (
                    <View style={styles.friendsBlock}>
                      <Muted>{t('competeAddFriendsTitle')}</Muted>
                      <Muted style={styles.hint}>{t('competeAddFriendsHint')}</Muted>
                      {myFriends.map((f) => (
                        <View key={f.friend_user_id} style={styles.friendRow}>
                          <Body style={styles.flex1}>
                            {f.peer_email ?? `${f.friend_user_id.slice(0, 8)}…`}
                          </Body>
                          <AppButton
                            label={t('competeAddToComp')}
                            variant="secondary"
                            onPress={() => void addFriendParticipant(c.id, f.friend_user_id)}
                          />
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  const emptyCopy = (() => {
    if (mergedCompetitions.length === 0) return t('competeNoCompsYet');
    if (listingsTab === 'open') return t('competeNoOpenComps');
    return t('competeNoPastComps');
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={visibleCompetitions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={
          catalogQuery.isLoading && !catalogQuery.data ? (
            <Card>
              <Body>{t('competeLoadingCatalog')}</Body>
            </Card>
          ) : catalogQuery.error ? (
            <Card>
              <Body>{t('competitionLoadError')}</Body>
              <Muted>{(catalogQuery.error as Error).message}</Muted>
            </Card>
          ) : (
            <Card>
              <Body>{emptyCopy}</Body>
            </Card>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={catalogQuery.isRefetching}
            onRefresh={() => catalogQuery.refetch()}
            tintColor={brandColors.gold}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  list: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 132,
    gap: 12,
  },
  headerBlock: { gap: 14, marginBottom: 8 },
  hero: { gap: 10 },
  invitedWrap: {},
  invitedTitle: { fontWeight: '800', color: brandColors.goldBright },
  invitedHint: { marginTop: 4 },
  adCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.border,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
  },
  adEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: brandColors.gold,
  },
  adCta: { color: brandColors.goldBright, fontWeight: '700', marginTop: 4 },
  mineHeader: { gap: 8 },
  mineTitle: { fontSize: 22 },
  countsMeta: { opacity: 0.75 },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandColors.border,
    overflow: 'hidden',
  },
  segmentTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  segmentTabActive: { backgroundColor: 'rgba(212, 183, 143, 0.15)' },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: 'rgba(212, 183, 143, 0.45)',
  },
  segmentLabelActive: { color: brandColors.goldBright },
  feedbackBanner: {
    borderWidth: 1,
    borderColor: brandColors.gold,
    backgroundColor: 'rgba(212, 183, 143, 0.12)',
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  feedbackText: { color: brandColors.cream },
  dismissHint: { fontSize: 11, opacity: 0.7 },
  cardInner: { gap: 12 },
  cardTop: { gap: 6 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  cardTitle: { flexShrink: 1, fontSize: 18 },
  badgeEnded: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#fcd34d',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeIn: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#6ee7b7',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeGhost: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: brandColors.tanMuted,
    borderWidth: 1,
    borderColor: brandColors.frame,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgePub: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    backgroundColor: brandColors.gold,
    color: brandColors.black,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgePriv: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: brandColors.cream,
    borderWidth: 1,
    borderColor: brandColors.frame,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  dateLine: { fontSize: 12 },
  winnerLine: { marginTop: 4, color: brandColors.gold },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { minWidth: '28%', gap: 2 },
  statLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  ruleText: { flexShrink: 1 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  invitesWrap: { borderTopWidth: 1, borderTopColor: brandColors.frame, paddingTop: 10 },
  invitesToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invitesToggleText: { color: brandColors.gold, fontWeight: '700' },
  invitesBody: { gap: 10, marginTop: 10 },
  hint: { fontSize: 12 },
  inviteInput: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    color: brandColors.cream,
  },
  inviteList: { gap: 6 },
  inviteLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inviteEmail: { flex: 1, marginRight: 8 },
  removeLink: { color: '#f87171', fontWeight: '600' },
  friendsBlock: { gap: 8, marginTop: 8 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex1: { flex: 1 },
  pressed: { opacity: 0.88 },
});
