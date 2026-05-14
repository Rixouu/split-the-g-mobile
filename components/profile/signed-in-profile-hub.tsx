import type { User } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileTierAvatar } from '@/components/profile/profile-tier-avatar';
import { AppButton } from '@/components/split-the-g/button';
import { Eyebrow, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { ProfileHubBundle } from '@/lib/api/profile-hub-data';
import { achievementHubSummaryFromSnapshot } from '@/lib/profile/profile-achievements';
import {
  buildFriendLeaderboard,
  pourStreakCalendarDays,
  progressRangeStart,
} from '@/lib/profile/profile-leaderboard';
import type { TranslationKey } from '@/lib/i18n/translations';
import { emailDisplayName, normalizeEmail } from '@/lib/utils/profile-email';
import { flagEmojiFromIso2 } from '@/lib/utils/country-display';

const HUB_STROKE = brandColors.hubStroke;

function formatCompactNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1000) {
    return `${(n / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function friendsHubSubtitle(
  tVars: (key: TranslationKey, vars: Record<string, string | number>) => string,
  friendCount: number,
  incoming: number,
  outgoing: number,
): string {
  if (incoming > 0 && outgoing > 0) {
    return tVars('profileHubFriendsBoth', { count: friendCount, incoming, outgoing });
  }
  if (incoming > 0) {
    return tVars('profileHubFriendsIncoming', { count: friendCount, incoming });
  }
  if (outgoing > 0) {
    return tVars('profileHubFriendsOutgoing', { count: friendCount, outgoing });
  }
  return tVars('profileHubFriendsOnly', { count: friendCount });
}

interface SignedInProfileHubProps {
  user: User;
  hub: ProfileHubBundle;
  t: (key: TranslationKey) => string;
  tVars: (key: TranslationKey, vars: Record<string, string | number>) => string;
}

export function SignedInProfileHub({ user, hub, t, tVars }: SignedInProfileHubProps) {
  const router = useRouter();
  const email = user.email ?? '';
  const displayName =
    hub.publicProfile?.display_name?.trim() ||
    (email ? emailDisplayName(email) : t('profileDefaultName'));
  const nickname = hub.publicProfile?.nickname?.trim() ?? '';
  const handle = nickname !== '' ? `@${nickname}` : email ? `@${emailDisplayName(email)}` : '';
  const memberYear = user.created_at ? new Date(user.created_at).getFullYear() : null;
  const countryCode = hub.publicProfile?.country_code?.trim().toUpperCase() ?? '';
  const flagEmoji = countryCode && /^[A-Z]{2}$/.test(countryCode) ? flagEmojiFromIso2(countryCode) : '';

  const scores = hub.scores;
  const pourCount = scores.length;
  const totalPoints = scores.reduce((a, s) => a + Number(s.split_score ?? 0), 0);
  const friendCount = hub.acceptedFriends.length;
  const streak = pourStreakCalendarDays(scores);

  const achievementSummary = achievementHubSummaryFromSnapshot(
    hub.scores,
    hub.achievementCodes,
    hub.streakSnapshot,
  );

  const weekStart = progressRangeStart('7d');
  const weekComparisonRows =
    weekStart == null
      ? hub.comparisonScores
      : hub.comparisonScores.filter((row) => new Date(row.created_at).getTime() >= weekStart);
  const weekBoard = buildFriendLeaderboard(
    weekComparisonRows,
    hub.comparisonLabels,
    email ? normalizeEmail(email) : null,
  );
  const allTimeBoard = buildFriendLeaderboard(
    hub.comparisonScores,
    hub.comparisonLabels,
    email ? normalizeEmail(email) : null,
  );

  const selfWeek = weekBoard.find((e) => e.isCurrentUser);
  const weekRank = selfWeek ? weekBoard.indexOf(selfWeek) + 1 : null;
  const aheadEntry = weekRank != null && weekRank > 1 ? weekBoard[weekRank - 2] : null;

  const selfAll = allTimeBoard.find((e) => e.isCurrentUser);
  const allRank = selfAll ? allTimeBoard.indexOf(selfAll) + 1 : null;

  const sortedFavs = [...hub.favorites].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const lastFav = sortedFavs[0];
  const lastFavLabel = lastFav
    ? new Date(lastFav.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const priced = scores.filter((s) => s.pint_price != null && Number.isFinite(Number(s.pint_price)));
  const totalSpend = priced.reduce((a, s) => a + Number(s.pint_price), 0);

  const tierAvatarAria =
    achievementSummary.unlockedCount > 0 && achievementSummary.maxTierAmongUnlocked > 0
      ? tVars('profileAccountProfilePhotoTierAria', {
          tier: String(achievementSummary.maxTierAmongUnlocked),
          unlocked: String(achievementSummary.unlockedCount),
          total: String(achievementSummary.totalCount),
        })
      : t('profileAccountProfilePhotoSimpleAria');

  const weeklyBlurb =
    weekBoard.length < 2
      ? t('profileHubWeeklySolo')
      : selfWeek == null || selfWeek.pours === 0
        ? t('profileHubWeeklyNoScores')
        : weekRank === 1
          ? t('profileHubWeeklyTop')
          : aheadEntry
            ? tVars('profileHubWeeklyBehind', {
                rank: weekRank ?? 0,
                gap: (aheadEntry.avg - selfWeek.avg).toFixed(2),
                name: aheadEntry.label,
              })
            : tVars('profileHubWeeklyRankOnly', { rank: weekRank ?? 0 });

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <View style={styles.avatarBlock}>
          <ProfileTierAvatar
            user={user}
            summary={achievementSummary}
            variant="hub"
            accessibilityLabel={tierAvatarAria}
          />
        </View>

        <View style={styles.headerMain}>
          <Eyebrow>{t('profileHubProfileLabel')}</Eyebrow>
          <View style={styles.nameRow}>
            {flagEmoji ? (
              <Text style={styles.flag} accessibilityLabel={countryCode}>
                {flagEmoji}
              </Text>
            ) : null}
            <Text style={styles.displayName} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <Muted style={styles.handleLine} numberOfLines={1}>
            {handle ? `${handle}` : ''}
            {handle && memberYear != null ? ' · ' : ''}
            {memberYear != null ? tVars('profileHubMemberSinceYear', { year: memberYear }) : ''}
          </Muted>
        </View>

        <Pressable
          onPress={() => router.push('/profile/account')}
          style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('profileHubEdit')}>
          <Text style={styles.editBtnLabel}>{t('profileHubEdit')}</Text>
        </Pressable>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pourCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>{t('profileHubStatPours')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {totalPoints.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.statLabel}>{t('profileHubStatScore')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{friendCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>{t('profileHubStatFriends')}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/profile/progress')}
        style={({ pressed }) => [styles.weeklyCard, pressed && styles.pressed]}
        accessibilityRole="button">
        <View style={styles.weeklyGlow} />
        <View style={styles.weeklyInner}>
          <View style={styles.rankOrb}>
            <Text style={styles.rankOrbText}>{weekRank != null ? weekRank : '—'}</Text>
          </View>
          <View style={styles.weeklyCopy}>
            <Text style={styles.weeklyTitle}>{t('profileHubWeeklyBoardTitle')}</Text>
            <Muted style={styles.weeklySub}>{weeklyBlurb}</Muted>
          </View>
        </View>
      </Pressable>

      <AppButton label={t('profileHubPourCta')} variant="secondary" onPress={() => router.push('/')} />

      <View accessibilityRole="text">
        <Eyebrow style={styles.sectionEyebrow}>{t('profileHubActivitySection')}</Eyebrow>
        <HubRow
          icon={<Ionicons name="stats-chart" size={20} color={brandColors.gold} />}
          title={t('profileNavProgress')}
          subtitle={
            streak > 0
              ? tVars('profileHubProgressSubStreak', { count: pourCount, streak })
              : tVars('profileHubProgressSubPlain', { count: pourCount })
          }
          onPress={() => router.push('/profile/progress')}
        />
        <HubRow
          icon={<Ionicons name="trophy-outline" size={20} color={brandColors.gold} />}
          title={t('profileNavAchievements')}
          subtitle={tVars('profileHubAchievementsRatio', {
            unlocked: achievementSummary.unlockedCount,
            total: achievementSummary.totalCount,
          })}
          onPress={() => router.push('/profile/achievements')}
        />
        <HubRow
          icon={
            flagEmoji ? (
              <Text style={styles.rowFlag}>{flagEmoji}</Text>
            ) : (
              <Ionicons name="flag-outline" size={20} color={brandColors.gold} />
            )
          }
          title={t('profileNavScores')}
          subtitle={
            allRank != null && allTimeBoard.length > 1
              ? tVars('profileHubScoresRanked', {
                  total: totalPoints.toLocaleString(undefined, { maximumFractionDigits: 0 }),
                  rank: allRank,
                })
              : tVars('profileHubScoresSolo', {
                  total: totalPoints.toLocaleString(undefined, { maximumFractionDigits: 0 }),
                })
          }
          trailing={
            <Text style={styles.trailingGold}>
              {totalPoints.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          }
          onPress={() => router.push('/profile/scores')}
          accessibilityHint={!flagEmoji ? t('profileHubScoresFlagHint') : undefined}
        />
        <HubRow
          icon={<Ionicons name="star-outline" size={20} color={brandColors.gold} />}
          title={t('profileNavFavorites')}
          subtitle={
            hub.favorites.length > 0 && lastFavLabel
              ? tVars('profileHubFavoritesDated', { count: hub.favorites.length, date: lastFavLabel })
              : t('profileHubFavoritesEmpty')
          }
          onPress={() => router.push('/profile/favorites')}
        />
      </View>

      <View>
        <Eyebrow style={styles.sectionEyebrow}>{t('profileHubAccountSection')}</Eyebrow>
        <HubRow
          icon={<Ionicons name="wallet-outline" size={20} color={brandColors.gold} />}
          title={t('profileNavExpenses')}
          subtitle={
            priced.length > 0
              ? tVars('profileHubExpensesTracked', {
                  amount: totalSpend.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }),
                })
              : t('profileHubExpensesEmpty')
          }
          trailing={
            priced.length > 0 ? (
              <Text style={styles.trailingGold}>{formatCompactNumber(totalSpend)}</Text>
            ) : undefined
          }
          onPress={() => router.push('/profile/expenses')}
        />
        <HubRow
          icon={<Ionicons name="people-outline" size={20} color={brandColors.gold} />}
          title={t('profileNavFriends')}
          subtitle={friendsHubSubtitle(
            tVars,
            friendCount,
            hub.incomingFriendRequestCount,
            hub.outgoingFriendPendingCount,
          )}
          onPress={() => router.push('/profile/friends')}
        />
        <HubRow
          icon={<Ionicons name="help-circle-outline" size={20} color={brandColors.gold} />}
          title={t('profileNavFaq')}
          subtitle={t('profileHubFaqSub')}
          onPress={() => router.push('/faq')}
        />
      </View>
    </View>
  );
}

/** Shared hub menu row — used under Profile for Language and other shortcuts. */
export function HubRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
  accessibilityHint,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  trailing?: ReactNode;
  onPress: () => void;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.hubRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}>
      <View style={styles.iconWell}>{icon}</View>
      <View style={styles.hubRowBody}>
        <Text style={styles.hubRowTitle}>{title}</Text>
        <Muted style={styles.hubRowSub} numberOfLines={2}>
          {subtitle}
        </Muted>
      </View>
      {trailing}
      <Ionicons name="chevron-forward" size={18} color="rgba(179, 139, 45, 0.7)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarBlock: {
    alignItems: 'center',
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  flag: {
    fontSize: 20,
    lineHeight: 22,
  },
  rowFlag: {
    fontSize: 18,
    lineHeight: 22,
  },
  displayName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: brandColors.gold,
  },
  handleLine: {
    marginTop: 4,
    fontSize: 13,
  },
  editBtn: {
    borderWidth: 1,
    borderColor: HUB_STROKE,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: brandColors.gold,
  },
  pressed: {
    opacity: 0.88,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HUB_STROKE,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: brandColors.gold,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(212, 183, 143, 0.55)',
  },
  weeklyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HUB_STROKE,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    overflow: 'hidden',
  },
  weeklyGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: 'rgba(197, 160, 89, 0.45)',
  },
  weeklyInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  rankOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: HUB_STROKE,
    backgroundColor: 'rgba(11, 11, 11, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankOrbText: {
    fontSize: 14,
    fontWeight: '700',
    color: brandColors.gold,
  },
  weeklyCopy: {
    flex: 1,
    minWidth: 0,
  },
  weeklyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: brandColors.cream,
  },
  weeklySub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionEyebrow: {
    marginBottom: 10,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HUB_STROKE,
    backgroundColor: 'rgba(29, 24, 15, 0.3)',
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: HUB_STROKE,
    backgroundColor: 'rgba(11, 11, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubRowBody: {
    flex: 1,
    minWidth: 0,
  },
  hubRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: brandColors.cream,
  },
  hubRowSub: {
    marginTop: 2,
    fontSize: 13,
  },
  trailingGold: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: brandColors.gold,
  },
});
