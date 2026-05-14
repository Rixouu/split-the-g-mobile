import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AchievementStickerGraphic } from '@/components/profile/achievement-sticker-graphic';
import { AppButton } from '@/components/split-the-g/button';
import { Screen, UNDER_STACK_HEADER_SAFE_AREA_EDGES } from '@/components/split-the-g/screen';
import { Body, Eyebrow, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import {
  fetchMyAchievementCodes,
  fetchMyScores,
  fetchUserStreakSnapshot,
} from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/auth-context';
import { appConfig } from '@/lib/config';
import { useLocale } from '@/lib/i18n/locale-context';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  computeProfileAchievements,
  profileAchievementTitleKey,
  type ComputedAchievement,
} from '@/lib/profile/profile-achievements';
import {
  pourStreakCalendarDays,
  weekendStreakFromScores,
  weeklyStreakFromScores,
} from '@/lib/profile/profile-leaderboard';

function achievementProgressCaption(
  row: ComputedAchievement,
  t: (key: TranslationKey) => string,
  tVars: (key: TranslationKey, vars: Record<string, string | number>) => string,
): string {
  const c = row;
  switch (c.progressKind) {
    case 'pours':
      return tVars('badgeProgressPours', {
        current: String(Math.min(c.progressTarget, Math.floor(c.progressCurrent))),
        target: String(c.progressTarget),
      });
    case 'pubs':
      return tVars('badgeProgressPubs', {
        current: String(Math.min(c.progressTarget, Math.floor(c.progressCurrent))),
        target: String(c.progressTarget),
      });
    case 'weekendStreak':
      return tVars('badgeProgressWeekends', {
        current: String(Math.min(c.progressTarget, Math.floor(c.progressCurrent))),
        target: String(c.progressTarget),
      });
    case 'weeklyStreak':
      return tVars('badgeProgressWeeks', {
        current: String(Math.min(c.progressTarget, Math.floor(c.progressCurrent))),
        target: String(c.progressTarget),
      });
    case 'dailyStreak':
      return tVars('badgeProgressDays', {
        current: String(Math.min(c.progressTarget, Math.floor(c.progressCurrent))),
        target: String(c.progressTarget),
      });
    case 'bestScore':
      return tVars('badgeProgressBest', {
        best: c.bestScore.toFixed(2),
        target: c.progressTarget.toFixed(2),
      });
    case 'binary':
      return t('badgeProgressEarly');
    case 'elite':
      return tVars('badgeProgressElite', {
        pours: String(c.progressCurrent),
        avg: c.averageScore.toFixed(2),
      });
    default:
      return '';
  }
}

export default function ProfileAchievementsScreen() {
  const { user } = useAuth();
  const { t, tVars } = useLocale();
  const router = useRouter();

  const bundle = useQuery({
    queryKey: ['profile-achievements-screen', user?.id],
    queryFn: async () => {
      if (!user?.id || !user.email?.trim()) {
        throw new Error('missing user');
      }
      const email = user.email.trim();
      const [scores, codes, snap] = await Promise.all([
        fetchMyScores(email),
        fetchMyAchievementCodes(user.id),
        fetchUserStreakSnapshot(user.id),
      ]);
      return { scores, codes, snap };
    },
    enabled: Boolean(user?.id && user.email?.trim()),
  });

  const rows = useMemo(() => {
    if (!bundle.data) return [];
    const { scores, codes, snap } = bundle.data;
    const daily = snap?.daily ?? pourStreakCalendarDays(scores);
    const weekend = snap?.weekend ?? weekendStreakFromScores(scores);
    const weekly = snap?.weekly ?? weeklyStreakFromScores(scores);
    return computeProfileAchievements(scores, codes, daily, weekend, weekly);
  }, [bundle.data]);

  const unlockedCount = useMemo(() => rows.filter((r) => r.unlocked).length, [rows]);
  const totalCount = rows.length || 20;

  const shareUnlocked = useCallback(
    async (label: string) => {
      const shareUrl = `${appConfig.siteUrl}/profile/achievements`;
      const line = tVars('achievementShareText', { name: label });
      const message = `${line}\n\n${shareUrl}`;
      try {
        await Share.share({ message, url: shareUrl, title: label });
      } catch {
        try {
          await Clipboard.setStringAsync(message);
          Alert.alert('', t('achievementShareCopied'));
        } catch {
          Alert.alert('', t('achievementShareFailed'));
        }
      }
    },
    [t, tVars],
  );

  if (!user) {
    return (
      <Screen contentContainerStyle={styles.screenContent} edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
        <View style={styles.card}>
          <Body>{t('signInPrompt')}</Body>
        </View>
      </Screen>
    );
  }

  if (bundle.isLoading) {
    return (
      <Screen contentContainerStyle={styles.screenContent} edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator color={brandColors.gold} />
          <Muted style={styles.loadingText}>{t('commonLoading')}</Muted>
        </View>
      </Screen>
    );
  }

  if (bundle.isError) {
    return (
      <Screen contentContainerStyle={styles.screenContent} edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
        <View style={styles.card}>
          <Body>{t('profileProgressLoadError')}</Body>
          <AppButton label={t('profileHubRetry')} variant="outlineGold" shape="rounded" onPress={() => void bundle.refetch()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.screenContent} edges={UNDER_STACK_HEADER_SAFE_AREA_EDGES}>
      <View style={styles.hero}>
        <Eyebrow style={styles.heroKicker}>{t('profileAchievementsHeroKicker')}</Eyebrow>
        <Text style={styles.heroCount}>
          <Text style={styles.heroCountMain}>{unlockedCount}</Text>
          <Text style={styles.heroCountSlash}> / {totalCount}</Text>
        </Text>
        <Text style={styles.heroCaption}>{t('profileAchievementsHeroCaption')}</Text>
        <Muted style={styles.heroBlurb}>{t('profileAchievementsPageBlurb')}</Muted>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profileAchievementsTitle')}</Text>
        <Muted style={styles.sectionBlurb}>{t('profileAchievementsSectionBlurb')}</Muted>

        <View style={styles.grid}>
          {rows.map((row) => {
            const titleKey = profileAchievementTitleKey(row.def.uiKey);
            const label = t(titleKey);
            const barWidth = row.unlocked ? 100 : row.progressPercent;

            const cardInner = (
              <>
                <View style={styles.cardTop}>
                  <View style={styles.tierPill}>
                    <MaterialCommunityIcons name="crown" size={12} color={brandColors.goldBright} />
                    <Text style={styles.tierNum}>{row.def.tierRank}</Text>
                  </View>
                  <AchievementStickerGraphic stickerNum={row.def.stickerNum} locked={!row.unlocked} size={56} />
                </View>
                <Text style={styles.badgeTitle} numberOfLines={3}>
                  {label}
                </Text>
                <Text style={row.unlocked ? styles.badgeStateOn : styles.badgeStateOff}>
                  {row.unlocked ? t('badgeUnlocked') : t('badgeLocked')}
                </Text>
                {!row.unlocked ? (
                  <Muted style={styles.progressCaption} numberOfLines={3}>
                    {achievementProgressCaption(row, t, tVars)}
                  </Muted>
                ) : (
                  <View style={styles.shareRow}>
                    <MaterialCommunityIcons name="share-variant" size={12} color="rgba(197, 160, 89, 0.85)" />
                    <Text style={styles.shareHint}>{t('badgeTapToShare')}</Text>
                  </View>
                )}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(4, Math.min(100, barWidth))}%` },
                      !row.unlocked && styles.progressFillMuted,
                    ]}
                  />
                </View>
              </>
            );

            if (row.unlocked) {
              return (
                <Pressable
                  key={row.def.persistCode}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('badgeTapToShare')}: ${label}`}
                  onPress={() => void shareUnlocked(label)}
                  style={({ pressed }) => [
                    styles.badgeCard,
                    styles.badgeCardUnlocked,
                    styles.badgeCell,
                    pressed && styles.badgeCardPressed,
                  ]}>
                  {cardInner}
                </Pressable>
              );
            }

            return (
              <View key={row.def.persistCode} style={[styles.badgeCard, styles.badgeCardLocked, styles.badgeCell]}>
                {cardInner}
              </View>
            );
          })}
        </View>
      </View>

      <AppButton label={t('actionBack')} variant="outlineGold" shape="rounded" fullWidth onPress={() => router.back()} />
    </Screen>
  );
}

const HERO_BORDER = 'rgba(179, 139, 45, 0.25)';
const CARD_BORDER_LOCKED = '#322914';
const CARD_BORDER_UNLOCKED = 'rgba(179, 139, 45, 0.4)';

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 160,
  },
  loadingCard: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 14,
    backgroundColor: 'rgba(29, 24, 15, 0.35)',
    padding: 18,
    gap: 14,
  },
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HERO_BORDER,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: 'rgba(29, 24, 15, 0.55)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroKicker: {
    textAlign: 'center',
    color: 'rgba(197, 160, 89, 0.6)',
  },
  heroCount: {
    marginTop: 10,
    textAlign: 'center',
  },
  heroCountMain: {
    fontSize: 36,
    fontWeight: '800',
    color: brandColors.goldBright,
    fontVariant: ['tabular-nums'],
  },
  heroCountSlash: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(212, 183, 143, 0.5)',
  },
  heroCaption: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.cream,
  },
  heroBlurb: {
    marginTop: 10,
    textAlign: 'center',
    maxWidth: 320,
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    marginTop: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brandColors.frame,
    backgroundColor: 'rgba(29, 24, 15, 0.3)',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: brandColors.cream,
    letterSpacing: -0.3,
  },
  sectionBlurb: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
  grid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  badgeCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 0,
  },
  badgeCell: {
    width: '48.5%',
  },
  badgeCardUnlocked: {
    borderColor: CARD_BORDER_UNLOCKED,
    backgroundColor: 'rgba(179, 139, 45, 0.1)',
  },
  badgeCardLocked: {
    borderColor: CARD_BORDER_LOCKED,
    backgroundColor: 'rgba(11, 11, 11, 0.35)',
  },
  badgeCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(179, 139, 45, 0.3)',
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  tierNum: {
    fontSize: 11,
    fontWeight: '800',
    color: brandColors.goldBright,
    fontVariant: ['tabular-nums'],
  },
  badgeTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: brandColors.cream,
    lineHeight: 18,
  },
  badgeStateOn: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(197, 160, 89, 0.88)',
  },
  badgeStateOff: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(212, 183, 143, 0.7)',
  },
  progressCaption: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(212, 183, 143, 0.55)',
  },
  shareRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareHint: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(197, 160, 89, 0.8)',
  },
  progressTrack: {
    marginTop: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(50, 41, 20, 0.8)',
    backgroundColor: 'rgba(11, 11, 11, 0.6)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: brandColors.goldBright,
  },
  progressFillMuted: {
    backgroundColor: 'rgba(197, 160, 89, 0.7)',
  },
});
