import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted, Title } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { RankedRow } from '@/lib/competition/leaderboard';
import { translationKeyForWinRule } from '@/lib/competition/win-rule-i18n';
import type { CompetitionRosterRow } from '@/lib/competition/use-competition-detail-actions';
import { useCompetitionDetailActions } from '@/lib/competition/use-competition-detail-actions';
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

export default function CompetitionDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocale();
  const { competitionId } = useLocalSearchParams<{ competitionId: string }>();
  const ref = (typeof competitionId === 'string' ? competitionId : competitionId?.[0] ?? '').trim();
  const [tab, setTab] = useState<DetailTab>('leaderboard');

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

  return (
    <Screen>
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

      {compQuery.isLoading ? (
        <Card>
          <Body>{t('commonLoading')}</Body>
        </Card>
      ) : null}

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
          <Card>
            <Body style={styles.rule}>
              {t('competitionRulePrefix')} {t(translationKeyForWinRule(c.win_rule))}
              {c.target_score != null && c.win_rule === 'closest_to_target'
                ? t('competitionTargetSegment').replace('{score}', String(c.target_score))
                : ''}
            </Body>
            <Muted>
              {t('competitionMetaLine')
                .replace('{visibility}', c.visibility ?? '—')
                .replace('{max}', String(c.max_participants))
                .replace('{glasses}', String(c.glasses_per_person))}
            </Muted>
            <Muted style={styles.mt}>{t('competitionWebHintLess')}</Muted>
            {c.location_name || c.location_address ? (
              <Body style={styles.mt}>{[c.location_name, c.location_address].filter(Boolean).join(' · ')}</Body>
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
                  disabled={leavePending}
                  onPress={() => leave()}
                />
              ) : canJoin ? (
                <AppButton
                  label={joinPending ? t('commonLoading') : t('competitionJoin')}
                  disabled={joinPending}
                  onPress={() => join()}
                />
              ) : rosterFull ? (
                <Muted>{t('competitionRosterFull')}</Muted>
              ) : null
            ) : null}
            {user?.id === c.created_by ? (
              <AppButton
                label={t('competitionEditCTA')}
                variant="secondary"
                shape="rounded"
                onPress={() => router.push(`/competition/${encodeURIComponent(ref)}/edit`)}
              />
            ) : null}
          </View>

          <Card>
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
                <Muted style={styles.lbHint}>{t('competitionLbRowHint')}</Muted>
                {scoresLoading ? (
                  <Body>{t('commonLoading')}</Body>
                ) : ranked.length === 0 ? (
                  <Muted>{t('competitionLbEmpty')}</Muted>
                ) : (
                  ranked.map((row: RankedRow) => {
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
                  })
                )}
              </>
            ) : rosterLoading ? (
              <Body>{t('commonLoading')}</Body>
            ) : rosterRows.length === 0 ? (
              <Muted>{t('competitionParticipantsEmpty')}</Muted>
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
            <Card>
              <Body>{t('competitionLinkedPub')}</Body>
              <Pressable
                onPress={() => router.push(`/pub/${encodeURIComponent(c.linked_bar_key!)}`)}
                accessibilityRole="button">
                <Body style={styles.link}>{t('competitionOpenPub')}</Body>
              </Pressable>
            </Card>
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
  rule: {
    marginBottom: 8,
  },
  mt: {
    marginTop: 12,
  },
  link: {
    color: brandColors.gold,
    fontWeight: '700',
    marginTop: 8,
  },
  rowActions: { gap: 10, marginBottom: 8 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: brandColors.frame,
    marginBottom: 12,
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
  lbHint: { marginBottom: 12, fontSize: 12 },
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
});
