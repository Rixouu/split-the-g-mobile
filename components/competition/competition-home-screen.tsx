import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Platform,
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
import { UnderlineTabRow } from '@/components/split-the-g/underline-tab-row';
import { SCREEN_EDGE_GUTTER } from '@/constants/layout';
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
    staleTime: 180_000,
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
    handleJoin,
    handleLeave,
    addEmailInvite,
    removeInvite,
    addFriendParticipant,
    dismissToast,
  } = listState;

  const bannerMessage = toastMessage ?? formError;

  const header = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <View style={styles.hero}>
          <Eyebrow style={styles.heroEyebrow}>{t('navCompete')}</Eyebrow>
          <View style={styles.heroTitleRow}>
            <View style={styles.heroTitleWrap}>
              <Title style={styles.heroTitle}>{t('competeTitle')}</Title>
            </View>
            <AppButton
              label={t('competeCreateToolbar')}
              variant="secondary"
              shape="pill"
              accessibilityLabel={t('competeCreateCta')}
              onPress={() => router.push('/competition/create')}
              style={styles.heroCreateBtn}
            />
          </View>
          <Muted>{t('competeSubtitle')}</Muted>
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

        <View style={styles.mineHeader}>
          <Eyebrow style={styles.mineEyebrow}>{t('competeMineHeading')}</Eyebrow>
          <Muted style={styles.countsMeta}>
            {tVars('competeOpenPastCounts', {
              open: String(openCompetitions.length),
              past: String(pastCompetitions.length),
            })}
          </Muted>
        </View>

        <View style={styles.listingsTabChrome} accessibilityRole="tablist">
          <UnderlineTabRow<'open' | 'past'>
            tabs={[
              { key: 'open', label: t('competeTabOpen') },
              { key: 'past', label: t('competeTabPast') },
            ]}
            active={listingsTab}
            onChange={setListingsTab}
          />
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

  const renderItem = useCallback<ListRenderItem<CompetitionDetail>>(({ item: c }) => {
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

    const glassesDisplay =
      winRuleUsesUnlimitedGlasses(c.win_rule) || isStoredGlassesUnlimited(c.glasses_per_person)
        ? t('competeGlassesUnlimited')
        : String(c.glasses_per_person);

    const ruleDisplay =
      `${t(translationKeyForWinRule(c.win_rule))}${c.win_rule === 'closest_to_target' && c.target_score != null ? ` · ${Number(c.target_score).toFixed(2)}` : ''}`;

    return (
      <View style={styles.competeCard}>
        <View style={styles.cardHeaderBlock}>
          <Text style={styles.cardTitleText} numberOfLines={2}>
            {c.title}
          </Text>
          <View style={styles.badgeRow}>
            {isPastTab ? <Text style={styles.badgeEnded}>{t('competeBadgeEnded')}</Text> : null}
            {isJoined ? (
              <Text style={isPastTab ? styles.badgeGhost : styles.badgeIn}>
                {isPastTab ? t('competeBadgeParticipated') : t('competeBadgeIn')}
              </Text>
            ) : null}
            <Text style={priv ? styles.badgePriv : styles.badgePub}>
              {priv ? t('competeBadgePrivate') : t('competeBadgePublic')}
            </Text>
          </View>
        </View>

        <Muted style={styles.cardDate}>{formatRange(c.starts_at, c.ends_at)}</Muted>

        {isPastTab ? (
          <View style={styles.winnerBanner}>
            <Text style={styles.winnerLabel}>{t('competeWinner')}</Text>
            <Text style={styles.winnerValue} numberOfLines={2}>
              {winnerLine}
            </Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>{t('competeStatJoined')}</Text>
            <Text style={styles.statValue}>
              {count} / {c.max_participants}
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>{t('competeStatGlasses')}</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {glassesDisplay}
            </Text>
          </View>
          <View style={[styles.statCell, styles.statCellWide]}>
            <Text style={styles.statLabel}>{t('competeStatRule')}</Text>
            <Text style={styles.statValueSmall} numberOfLines={2}>
              {ruleDisplay}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.actionsBlock}>
          {isOwner ? (
            <AppButton
              label={t('competeView')}
              variant="outlineGold"
              shape="pill"
              compact
              fullWidth
              onPress={() => router.push(`/competition/${ref}`)}
            />
          ) : userId ? (
            isJoined ? (
              <View style={styles.actionsUnifiedRow}>
                <AppButton
                  label={t('competeView')}
                  variant="outlineGold"
                  shape="pill"
                  compact
                  onPress={() => router.push(`/competition/${ref}`)}
                  style={styles.cardActionGrow}
                />
                <AppButton
                  label={t('competeLeave')}
                  variant="secondary"
                  shape="pill"
                  compact
                  onPress={() => void handleLeave(c.id)}
                  style={styles.cardActionFixed}
                />
              </View>
            ) : isPastTab ? (
              <View style={styles.actionsClosedRow}>
                <AppButton
                  label={t('competeView')}
                  variant="outlineGold"
                  shape="pill"
                  compact
                  onPress={() => router.push(`/competition/${ref}`)}
                  style={styles.cardActionGrow}
                />
                <Muted style={styles.closedHint}>{t('competeClosed')}</Muted>
              </View>
            ) : (
              <View style={styles.actionsUnifiedRow}>
                <AppButton
                  label={t('competeView')}
                  variant="outlineGold"
                  shape="pill"
                  compact
                  onPress={() => router.push(`/competition/${ref}`)}
                  style={styles.cardActionGrow}
                />
                <AppButton
                  label={full ? t('competeFull') : t('competeJoin')}
                  variant={full ? 'secondary' : 'primary'}
                  shape="pill"
                  compact
                  disabled={full}
                  onPress={() => void handleJoin(c.id)}
                  style={styles.cardActionFixedWide}
                />
              </View>
            )
          ) : isPastTab ? (
            <View style={styles.actionsUnifiedRow}>
              <AppButton
                label={t('competeView')}
                variant="outlineGold"
                shape="pill"
                compact
                onPress={() => router.push(`/competition/${ref}`)}
                style={styles.cardActionGrow}
              />
            </View>
          ) : (
            <View style={styles.actionsSignInRow}>
              <AppButton
                label={t('competeView')}
                variant="outlineGold"
                shape="pill"
                compact
                onPress={() => router.push(`/competition/${ref}`)}
                style={styles.cardActionGrow}
              />
              <Muted style={styles.signInHint}>{t('competeSignInJoin')}</Muted>
            </View>
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
    );
  }, [
    counts,
    expandedInvitesId,
    invitesByComp,
    inviteBusy,
    inviteInputs,
    joinedIds,
    listingsTab,
    myFriends,
    pastWinnerByCompId,
    router,
    t,
    addEmailInvite,
    addFriendParticipant,
    handleJoin,
    handleLeave,
    removeInvite,
    setExpandedInvitesId,
    setInviteInputs,
    userId,
  ]);

  const keyExtractorRow = useCallback((item: CompetitionDetail) => item.id, []);

  const listEmpty = useMemo(() => {
    if (catalogQuery.isLoading && !catalogQuery.data) {
      return (
        <View style={styles.emptyStateCard}>
          <ActivityIndicator color={brandColors.goldBright} size="large" />
          <Muted style={styles.emptyBody}>{t('competeLoadingCatalog')}</Muted>
        </View>
      );
    }
    if (catalogQuery.error) {
      const errMsg = (catalogQuery.error as Error).message?.trim();
      return (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyIconRing}>
            <MaterialCommunityIcons name="alert-circle-outline" size={28} color={brandColors.goldBright} />
          </View>
          <Text style={styles.emptyTitle}>{t('competeCatalogFetchFailed')}</Text>
          {errMsg ? <Muted style={styles.emptyBody}>{errMsg}</Muted> : null}
        </View>
      );
    }
    if (mergedCompetitions.length === 0) {
      return (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyIconRing}>
            <MaterialCommunityIcons name="trophy-variant-outline" size={28} color={brandColors.goldBright} />
          </View>
          <Text style={styles.emptyTitle}>{t('competeCatalogEmptyTitle')}</Text>
          <Muted style={styles.emptyBody}>{t('competeCatalogEmptyBody')}</Muted>
          <AppButton
            label={t('competeCreateCta')}
            variant="primary"
            shape="pill"
            onPress={() => router.push('/competition/create')}
            style={styles.emptyPrimaryCta}
          />
        </View>
      );
    }
    if (listingsTab === 'open') {
      return (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyIconRing}>
            <MaterialCommunityIcons name="calendar-clock-outline" size={28} color={brandColors.goldBright} />
          </View>
          <Text style={styles.emptyTitle}>{t('competeOpenEmptyTitle')}</Text>
          <Muted style={styles.emptyBody}>{t('competeOpenEmptyBody')}</Muted>
          <AppButton
            label={t('competeCreateCta')}
            variant="primary"
            shape="pill"
            onPress={() => router.push('/competition/create')}
            style={styles.emptyPrimaryCta}
          />
          <Pressable onPress={() => setListingsTab('past')} style={styles.emptyLinkHit} accessibilityRole="button">
            <Text style={styles.emptyLink}>{t('competeEmptyOpenGoPast')}</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.emptyStateCard}>
        <View style={styles.emptyIconRing}>
          <MaterialCommunityIcons name="archive-outline" size={28} color={brandColors.goldBright} />
        </View>
        <Text style={styles.emptyTitle}>{t('competePastEmptyTitle')}</Text>
        <Muted style={styles.emptyBody}>{t('competePastEmptyBody')}</Muted>
      </View>
    );
  }, [
    catalogQuery.isLoading,
    catalogQuery.data,
    catalogQuery.error,
    mergedCompetitions.length,
    listingsTab,
    t,
    router,
    setListingsTab,
  ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          visibleCompetitions.length === 0 ? styles.contentWhenEmpty : null,
        ]}
        data={visibleCompetitions}
        keyExtractor={keyExtractorRow}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={listEmpty}
        removeClippedSubviews={Platform.OS === 'android'}
        windowSize={7}
        maxToRenderPerBatch={4}
        initialNumToRender={4}
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
    paddingHorizontal: SCREEN_EDGE_GUTTER,
    paddingTop: 16,
    paddingBottom: 132,
    gap: 14,
  },
  contentWhenEmpty: {
    flexGrow: 1,
  },
  headerBlock: { gap: 22, paddingBottom: 4 },
  hero: { gap: 8, paddingTop: 12 },
  heroEyebrow: {
    alignSelf: 'flex-start',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 2,
  },
  heroTitleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  heroTitle: {
    flexShrink: 1,
  },
  heroCreateBtn: {
    flexShrink: 0,
    alignSelf: 'center',
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  invitedWrap: { marginTop: -2 },
  invitedTitle: { fontWeight: '800', color: brandColors.goldBright },
  invitedHint: { marginTop: 4 },
  mineHeader: { gap: 8, marginTop: 10 },
  mineEyebrow: { letterSpacing: 1.8 },
  listingsTabChrome: {
    marginTop: 6,
    marginBottom: 6,
  },
  countsMeta: { opacity: 0.82 },
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

  emptyStateCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brandColors.frame,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 14,
    alignSelf: 'stretch',
  },
  emptyIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(179, 139, 45, 0.12)',
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    color: brandColors.cream,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 24,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  emptyBody: {
    textAlign: 'center',
    paddingHorizontal: 4,
    lineHeight: 22,
  },
  emptyPrimaryCta: {
    marginTop: 4,
    minHeight: 48,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  emptyLinkHit: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: -4,
  },
  emptyLink: {
    fontSize: 14,
    fontWeight: '800',
    color: brandColors.gold,
    letterSpacing: 0.2,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(179, 139, 45, 0.55)',
  },

  competeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brandColors.frame,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 0,
  },
  cardHeaderBlock: { gap: 10 },
  cardTitleText: {
    color: brandColors.cream,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.35,
    lineHeight: 25,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  badgeEnded: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: brandColors.goldBright,
    borderWidth: 1,
    borderColor: brandColors.border,
    backgroundColor: 'rgba(179, 139, 45, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeIn: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: brandColors.green,
    borderWidth: 1,
    borderColor: 'rgba(11, 91, 55, 0.45)',
    backgroundColor: 'rgba(11, 91, 55, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeGhost: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: brandColors.tanMuted,
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgePub: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: brandColors.gold,
    color: brandColors.black,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgePriv: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: brandColors.cream,
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    backgroundColor: 'rgba(253, 251, 243, 0.06)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cardDate: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(253, 251, 243, 0.55)',
  },
  winnerBanner: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
    gap: 4,
  },
  winnerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.85,
    textTransform: 'uppercase',
    color: brandColors.goldBright,
  },
  winnerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.cream,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  statCell: {
    flexGrow: 1,
    flexBasis: '28%',
    minWidth: '28%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 5,
  },
  statCellWide: {
    flexBasis: '100%',
    minWidth: '100%',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.95,
    textTransform: 'uppercase',
    color: 'rgba(212, 183, 143, 0.55)',
  },
  statValue: {
    color: brandColors.cream,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statValueSmall: {
    color: brandColors.cream,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: -0.15,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: brandColors.borderSubtle,
    marginTop: 16,
    marginBottom: 14,
    alignSelf: 'stretch',
  },
  actionsBlock: { alignSelf: 'stretch' },
  actionsUnifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  /** Past competition, signed in but not participating */
  actionsClosedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
  },
  closedHint: {
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
    opacity: 0.85,
  },
  /** Signed out, open tab */
  actionsSignInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 8,
    alignSelf: 'stretch',
  },
  signInHint: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 140,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.85,
  },
  cardActionGrow: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
  },
  cardActionFixed: {
    flexShrink: 0,
    alignSelf: 'stretch',
    minWidth: 76,
    paddingHorizontal: 12,
  },
  cardActionFixedWide: {
    flexShrink: 0,
    alignSelf: 'stretch',
    minWidth: 86,
    maxWidth: '42%',
    paddingHorizontal: 12,
  },
  invitesWrap: { borderTopWidth: 1, borderTopColor: brandColors.borderSubtle, paddingTop: 14, marginTop: 14 },
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
});
