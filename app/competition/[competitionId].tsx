import { useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { ScreenLoadingBlock } from '@/components/split-the-g/screen-loading';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { colors, radii, spacing } from '@/constants/design-tokens';
import { brandColors } from '@/constants/theme';
import { deleteCompetitionById } from '@/lib/api/client';
import type { RankedRow } from '@/lib/competition/leaderboard';
import type { CompetitionRosterRow } from '@/lib/competition/use-competition-detail-actions';
import { useCompetitionDetailActions } from '@/lib/competition/use-competition-detail-actions';
import { translationKeyForWinRule } from '@/lib/competition/win-rule-i18n';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { flagEmojiFromIso2 } from '@/lib/utils/country-display';

function formatDetailRange(starts: string, ends: string) {
  try {
    const s = new Date(starts);
    const e = new Date(ends);
    return `${s.toLocaleString()} → ${e.toLocaleString()}`;
  } catch {
    return `${starts} – ${ends}`;
  }
}

type DetailTab = 'leaderboard' | 'participants';

interface TabEmptyProps {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
}

function TabEmptyState({ iconName, title, body }: TabEmptyProps) {
  return (
    <View style={styles.emptyTabBody}>
      <View style={styles.emptyIconRing}>
        <MaterialCommunityIcons name={iconName} size={28} color={brandColors.goldBright} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Muted style={styles.emptyBody}>{body}</Muted>
    </View>
  );
}

export default function CompetitionDetailScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { t } = useLocale();
  const { competitionId } = useLocalSearchParams<{ competitionId: string }>();
  const ref = (typeof competitionId === 'string' ? competitionId : competitionId?.[0] ?? '').trim();
  const [tab, setTab] = useState<DetailTab>('leaderboard');
  const [deleteBusy, setDeleteBusy] = useState(false);

  const {
    compQuery,
    c,
    ranked,
    timePhase,
    joined,
    canJoin,
    joinPending,
    leavePending,
    join,
    leave,
    participantCount,
    scoresLoading,
    rosterRows,
    rosterLoading,
    inviteFriend,
    invitePending,
  } = useCompetitionDetailActions(ref, user);

  const rosterFull = c != null && participantCount >= c.max_participants;

  function phaseWord() {
    if (timePhase === 'before') return t('competitionPhaseBefore');
    if (timePhase === 'live') return t('competitionPhaseLive');
    if (timePhase === 'after') return t('competitionPhaseAfter');
    return '';
  }

  const venueLine =
    c?.location_name || c?.location_address
      ? [c.location_name, c.location_address].filter(Boolean).join(' · ')
      : null;

  const onRequestDeleteCompetition = useCallback(() => {
    if (!c || user?.id !== c.created_by) return;
    Alert.alert(
      t('competeDeleteTitle'),
      t('competeDeleteMessage'),
      [
        { text: t('competeDeleteKeep'), style: 'cancel' },
        {
          text: t('competeDeleteConfirm'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeleteBusy(true);
              try {
                await deleteCompetitionById(c.id);
                await qc.invalidateQueries({ queryKey: ['competitions', 'catalog'] });
                router.replace('/compete');
              } catch {
                setDeleteBusy(false);
                Alert.alert(t('competitionLoadError'), t('competeErrDeleteFailed'));
              }
            })();
          },
        },
      ],
      { cancelable: true },
    );
  }, [c, qc, router, t, user?.id]);

  return (
    <Screen edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      <View style={styles.header}>
        <Eyebrow>{t('competitionEyebrow')}</Eyebrow>
        {c ? <Title>{c.title}</Title> : <Title>…</Title>}
        {c ? <Muted>{formatDetailRange(c.starts_at, c.ends_at)}</Muted> : null}
        {c && timePhase ? (
          <Body style={styles.phase}>
            {phaseWord()} · {participantCount}/{c.max_participants} {t('competeStatJoined').toLowerCase()}
          </Body>
        ) : null}
      </View>

      {compQuery.isLoading ? <ScreenLoadingBlock /> : null}

      {compQuery.error ? (
        <Card>
          <Body>{t('competitionLoadError')}</Body>
          <Muted>{compQuery.error.message}</Muted>
        </Card>
      ) : null}

      {!compQuery.isLoading && !compQuery.error && !c ? (
        <Card>
          <Body>{t('competitionNotFound')}</Body>
        </Card>
      ) : null}

      {c ? (
        <>
          <Card style={styles.infoCard}>
            <View style={styles.infoHeadRow}>
              <View style={styles.infoHeadMain}>
                <Text style={styles.sectionEyebrow}>{t('competitionDetailRuleEyebrow')}</Text>
                <Body style={styles.rulePrimary}>
                  {t(translationKeyForWinRule(c.win_rule))}
                  {c.target_score != null && c.win_rule === 'closest_to_target'
                    ? t('competitionTargetSegment').replace('{score}', String(c.target_score))
                    : ''}
                </Body>
              </View>
              {user?.id === c.created_by ? (
                <AppButton
                  label={t('competitionEditCTA')}
                  variant="outlineGold"
                  shape="rounded"
                  compact
                  onPress={() => router.push(`/competition/${encodeURIComponent(ref)}/edit`)}
                  style={styles.editBtn}
                />
              ) : null}
            </View>

            <View style={styles.metaWell}>
              <Muted style={styles.metaWellText}>
                {t('competitionMetaLine')
                  .replace('{visibility}', c.visibility ?? '—')
                  .replace('{max}', String(c.max_participants))
                  .replace('{glasses}', String(c.glasses_per_person))}
              </Muted>
            </View>

            <View style={styles.webHintRow}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={colors.text.mutedMedium}
                style={styles.webHintIcon}
              />
              <Muted style={styles.webHintText}>{t('competitionWebHintLess')}</Muted>
            </View>

            {venueLine ? (
              <>
                <View style={styles.venueDivider} />
                <Text style={styles.sectionEyebrow}>{t('competitionDetailVenueEyebrow')}</Text>
                <View style={styles.venueWell}>
                  <Body style={styles.venueText}>{venueLine}</Body>
                </View>
              </>
            ) : null}
          </Card>

          <View style={styles.rowActions}>
            {timePhase !== 'after' ? (
              !user ? (
                <Muted>{t('competitionSignInToJoin')}</Muted>
              ) : joined ? (
                <AppButton
                  label={leavePending ? t('commonLoading') : t('competitionLeave')}
                  variant="secondary"
                  shape="rounded"
                  compact
                  disabled={leavePending}
                  onPress={() => leave()}
                />
              ) : canJoin ? (
                <AppButton
                  label={joinPending ? t('commonLoading') : t('competitionJoin')}
                  disabled={joinPending}
                  shape="rounded"
                  compact
                  onPress={() => join()}
                />
              ) : rosterFull ? (
                <Muted>{t('competitionRosterFull')}</Muted>
              ) : null
            ) : null}
          </View>

          <Card style={styles.tabCard}>
            <View style={styles.tabs}>
              <Pressable
                onPress={() => setTab('leaderboard')}
                style={[styles.tab, tab === 'leaderboard' && styles.tabOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === 'leaderboard' }}>
                <Body style={[styles.tabLabel, tab === 'leaderboard' && styles.tabLabelOn]}>
                  {t('competitionTabLeaderboard')}
                </Body>
              </Pressable>
              <Pressable
                onPress={() => setTab('participants')}
                style={[styles.tab, tab === 'participants' && styles.tabOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === 'participants' }}>
                <Body style={[styles.tabLabel, tab === 'participants' && styles.tabLabelOn]}>
                  {t('competitionTabParticipants')}
                </Body>
              </Pressable>
            </View>

            {tab === 'leaderboard' ? (
              <>
                {scoresLoading ? (
                  <ScreenLoadingBlock
                    layout="row"
                    indicatorSize="small"
                    dense
                    style={styles.tabPanePad}
                  />
                ) : ranked.length === 0 ? (
                  <View style={styles.tabPanePad}>
                    <TabEmptyState
                      iconName="trophy-outline"
                      title={t('competitionLbEmptyTitle')}
                      body={t('competitionLbEmptySubtitle')}
                    />
                  </View>
                ) : (
                  <>
                    <Muted style={styles.lbHint}>{t('competitionLbRowHint')}</Muted>
                    {ranked.map((row: RankedRow) => {
                      const winner = row.rank === 1;
                      const flag = flagEmojiFromIso2(row.countryCode);
                      return (
                        <Pressable
                          key={`${row.userId}-${row.rank}`}
                          style={[styles.lbRow, winner && styles.lbRowWinner]}
                          onPress={() => router.push(row.pourPath as never)}
                          accessibilityRole="button">
                          {row.splitImageUrl ? (
                            <Image
                              source={{ uri: row.splitImageUrl }}
                              style={styles.lbThumb}
                              contentFit="cover"
                            />
                          ) : (
                            <View style={styles.lbThumbPlaceholder}>
                              <Muted style={styles.lbThumbHint}>#{row.rank}</Muted>
                            </View>
                          )}
                          <Body style={styles.lbRank}>#{row.rank}</Body>
                          <View style={styles.lbMain}>
                            <Body style={styles.lbName}>
                              {flag ? `${flag} ` : ''}
                              {row.username}
                            </Body>
                            <Muted>
                              {row.metric} · {row.detail}
                            </Muted>
                            {winner ? <Body style={styles.winnerBadgeText}>{t('competeWinner')}</Body> : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </>
                )}
              </>
            ) : rosterLoading ? (
              <ScreenLoadingBlock
                layout="row"
                indicatorSize="small"
                dense
                style={styles.tabPanePad}
              />
            ) : rosterRows.length === 0 ? (
              <View style={styles.tabPanePad}>
                <TabEmptyState
                  iconName="account-group-outline"
                  title={t('competitionParticipantsEmptyTitle')}
                  body={t('competitionParticipantsEmptySubtitle')}
                />
              </View>
            ) : (
              rosterRows.map((row: CompetitionRosterRow) => {
                const flag = flagEmojiFromIso2(row.countryCode);
                return (
                  <View key={row.uid} style={styles.rosterRow}>
                    <View style={styles.rosterMain}>
                      <Body style={styles.lbName}>
                        {flag ? `${flag} ` : ''}
                        {row.name}
                        {row.isSelf ? ` · ${t('competitionParticipantYou')}` : ''}
                      </Body>
                      {row.email ? <Muted style={styles.monoHint}>{row.email}</Muted> : null}
                    </View>
                    {row.isSelf ? null : !user ? (
                      <Muted style={styles.rosterHint}>{t('competitionFriendSignIn')}</Muted>
                    ) : row.isFriend ? (
                      <Muted style={styles.rosterHint}>{t('competitionFriendStatusFriends')}</Muted>
                    ) : row.pendingOut ? (
                      <Muted style={styles.rosterHint}>{t('competitionFriendPending')}</Muted>
                    ) : row.email ? (
                      <AppButton
                        label={invitePending ? t('commonLoading') : t('competitionFriendInvite')}
                        variant="secondary"
                        shape="rounded"
                        compact
                        disabled={invitePending}
                        onPress={() => inviteFriend(row.email!)}
                      />
                    ) : (
                      <Muted style={styles.rosterHint}>{t('competitionFriendNoEmail')}</Muted>
                    )}
                  </View>
                );
              })
            )}
          </Card>

          {c.linked_bar_key ? (
            <Pressable
              onPress={() => router.push(`/pub/${encodeURIComponent(c.linked_bar_key!)}`)}
              accessibilityRole="button"
              accessibilityLabel={`${t('competitionOpenPub')}: ${c.linked_bar_key}`}
              style={({ pressed }) => [styles.linkedPubOuter, pressed && styles.linkedPubPressed]}>
              <View style={styles.linkedPubIconWell}>
                <MaterialCommunityIcons name="glass-mug-variant" size={22} color={brandColors.goldBright} />
              </View>
              <View style={styles.linkedPubTexts}>
                <Text style={styles.linkedPubTitle}>{t('competitionLinkedPub')}</Text>
                <Muted style={styles.linkedPubCue}>{t('competitionLinkedPubCue')}</Muted>
                <Text style={styles.linkedPubKey} numberOfLines={1}>
                  {c.linked_bar_key}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text.mutedMedium} />
            </Pressable>
          ) : null}

          {user?.id === c.created_by ? (
            <View style={styles.organizerDanger}>
              <AppButton
                label={deleteBusy ? t('commonLoading') : t('competeDelete')}
                variant="secondary"
                shape="rounded"
                compact
                fullWidth
                disabled={deleteBusy}
                onPress={onRequestDeleteCompetition}
                style={styles.deleteCompetitionBtn}
              />
            </View>
          ) : null}
        </>
      ) : null}

      <AppButton label={t('competitionBackToList')} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingTop: 16,
  },
  phase: { color: brandColors.gold, fontWeight: '600', marginTop: 4 },
  infoCard: {
    gap: spacing.sm,
  },
  infoHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoHeadMain: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: brandColors.goldBright,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  rulePrimary: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: brandColors.cream,
  },
  editBtn: {
    marginTop: 2,
    flexShrink: 0,
  },
  metaWell: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    backgroundColor: colors.surface.inkTranslucent,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  metaWellText: {
    fontSize: 13,
    lineHeight: 19,
  },
  webHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  webHintIcon: {
    marginTop: 2,
  },
  webHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.88,
  },
  venueDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.stroke.subtle,
    marginTop: spacing.sm,
    marginBottom: 4,
    alignSelf: 'stretch',
  },
  venueWell: {
    marginTop: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.22)',
    backgroundColor: 'rgba(179, 139, 45, 0.06)',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  venueText: {
    fontWeight: '600',
    color: brandColors.cream,
  },
  rowActions: { gap: 10, marginBottom: 4 },
  tabCard: {
    paddingTop: 0,
    gap: 0,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: brandColors.frame,
    marginHorizontal: -spacing.cardPadding,
    paddingHorizontal: spacing.cardPadding,
    marginBottom: 0,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabOn: {
    borderBottomColor: brandColors.gold,
  },
  tabLabel: { color: brandColors.muted, fontWeight: '600' },
  tabLabelOn: { color: brandColors.goldBright },
  tabPanePad: {
    paddingTop: spacing.cardInnerGap,
    paddingBottom: spacing.cardPadding,
  },
  lbHint: {
    marginTop: spacing.cardInnerGap,
    marginBottom: 12,
    fontSize: 12,
    paddingHorizontal: 0,
  },
  emptyTabBody: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
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
  },
  emptyTitle: {
    color: brandColors.cream,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  emptyBody: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 4,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.frame,
  },
  lbRowWinner: {
    backgroundColor: 'rgba(179, 139, 45, 0.12)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomWidth: 0,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.35)',
  },
  lbThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  lbThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brandColors.frame,
  },
  lbThumbHint: { fontSize: 11 },
  lbRank: { fontWeight: '800', color: brandColors.gold, minWidth: 30 },
  lbMain: { flex: 1, gap: 2 },
  lbName: { fontWeight: '700' },
  winnerBadgeText: {
    marginTop: 2,
    color: brandColors.gold,
    fontWeight: '700',
    fontSize: 12,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.frame,
  },
  rosterMain: { flex: 1, gap: 2 },
  rosterHint: { fontSize: 12, maxWidth: 120, textAlign: 'right' },
  monoHint: { fontSize: 11 },
  organizerDanger: {
    marginTop: 2,
  },
  deleteCompetitionBtn: {
    borderColor: 'rgba(216, 74, 58, 0.5)',
    backgroundColor: 'rgba(216, 74, 58, 0.12)',
  },
  linkedPubOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.stroke.frame,
    borderRadius: radii.card,
    backgroundColor: colors.surface.card,
    paddingVertical: 14,
    paddingHorizontal: spacing.cardPadding,
  },
  linkedPubPressed: {
    opacity: 0.92,
    backgroundColor: colors.surface.panelTranslucent,
  },
  linkedPubIconWell: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface.hubIconWell,
    borderWidth: 1,
    borderColor: colors.stroke.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedPubTexts: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  linkedPubTitle: {
    color: brandColors.goldBright,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  linkedPubCue: {
    fontSize: 13,
    lineHeight: 18,
  },
  linkedPubKey: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: colors.text.mutedStrong,
  },
});
