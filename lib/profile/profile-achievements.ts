/**
 * Achievement definitions and progress math — parity with web
 * `app/routes/profile/profile-achievements.ts` (split-the-g).
 */
import type { MyScoreRow } from '@/lib/api/profile';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  pourStreakCalendarDays,
  weekendStreakFromScores,
  weeklyStreakFromScores,
} from '@/lib/profile/profile-leaderboard';

export type AchievementUiKey =
  | 'perfect'
  | 'pints5'
  | 'pints10'
  | 'pints25'
  | 'pints50'
  | 'pints75'
  | 'pints100'
  | 'crawler'
  | 'crawler10'
  | 'crawler15'
  | 'crawler20'
  | 'early'
  | 'weekend'
  | 'weekend6'
  | 'streak7'
  | 'streak14'
  | 'streak30'
  | 'weekly4'
  | 'highSplit45'
  | 'elite';

export interface ProfileAchievementDef {
  uiKey: AchievementUiKey;
  persistCode: string;
  tierRank: number;
  stickerNum: number;
}

export const PROFILE_ACHIEVEMENT_DEFS: readonly ProfileAchievementDef[] = [
  { uiKey: 'pints5', persistCode: 'pints-5', tierRank: 1, stickerNum: 9 },
  { uiKey: 'pints10', persistCode: 'pints-10', tierRank: 2, stickerNum: 2 },
  { uiKey: 'pints25', persistCode: 'pints-25', tierRank: 3, stickerNum: 3 },
  { uiKey: 'pints50', persistCode: 'pints-50', tierRank: 4, stickerNum: 10 },
  { uiKey: 'pints75', persistCode: 'pints-75', tierRank: 5, stickerNum: 11 },
  { uiKey: 'pints100', persistCode: 'pints-100', tierRank: 6, stickerNum: 12 },
  { uiKey: 'crawler', persistCode: 'pub-crawler-5', tierRank: 3, stickerNum: 4 },
  { uiKey: 'crawler10', persistCode: 'pub-crawler-10', tierRank: 4, stickerNum: 13 },
  { uiKey: 'crawler15', persistCode: 'pub-crawler-15', tierRank: 5, stickerNum: 14 },
  { uiKey: 'crawler20', persistCode: 'pub-crawler-20', tierRank: 6, stickerNum: 15 },
  { uiKey: 'early', persistCode: 'early-bird', tierRank: 2, stickerNum: 6 },
  { uiKey: 'highSplit45', persistCode: 'high-split-4-5', tierRank: 3, stickerNum: 20 },
  { uiKey: 'perfect', persistCode: 'perfect-score', tierRank: 8, stickerNum: 1 },
  { uiKey: 'elite', persistCode: 'elite-average', tierRank: 7, stickerNum: 5 },
  { uiKey: 'weekend', persistCode: 'weekend-warrior-3', tierRank: 5, stickerNum: 7 },
  { uiKey: 'weekend6', persistCode: 'weekend-warrior-6', tierRank: 6, stickerNum: 18 },
  { uiKey: 'weekly4', persistCode: 'weekly-streak-4', tierRank: 4, stickerNum: 19 },
  { uiKey: 'streak7', persistCode: 'daily-streak-7', tierRank: 6, stickerNum: 8 },
  { uiKey: 'streak14', persistCode: 'daily-streak-14', tierRank: 7, stickerNum: 16 },
  { uiKey: 'streak30', persistCode: 'daily-streak-30', tierRank: 8, stickerNum: 17 },
] as const;

export type AchievementProgressKind =
  | 'pours'
  | 'pubs'
  | 'weekendStreak'
  | 'weeklyStreak'
  | 'dailyStreak'
  | 'bestScore'
  | 'binary'
  | 'elite';

export interface ComputedAchievement {
  def: ProfileAchievementDef;
  unlocked: boolean;
  progressPercent: number;
  progressKind: AchievementProgressKind;
  progressCurrent: number;
  progressTarget: number;
  bestScore: number;
  averageScore: number;
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function computeProfileAchievements(
  scores: MyScoreRow[],
  persistedCodes: readonly string[],
  streakDaily: number,
  weekendStreak: number,
  weeklyStreak: number,
): ComputedAchievement[] {
  const persisted = new Set(persistedCodes);
  const totalPints = scores.length;
  const uniquePubs = new Set(scores.map((s) => s.bar_name?.trim()).filter(Boolean)).size;
  const bestScore =
    scores.length === 0 ? 0 : scores.reduce((m, s) => Math.max(m, s.split_score), 0);
  const averageScore =
    scores.length === 0 ? 0 : scores.reduce((a, s) => a + s.split_score, 0) / scores.length;
  const calendarStreak = pourStreakCalendarDays(scores);
  const hasEarlyPour = scores.some((s) => new Date(s.created_at).getHours() < 17);

  const out: ComputedAchievement[] = [];

  for (const def of PROFILE_ACHIEVEMENT_DEFS) {
    let unlocked = persisted.has(def.persistCode);
    let progressPercent = 0;
    let progressKind: AchievementProgressKind = 'binary';
    let progressCurrent = 0;
    let progressTarget = 1;

    switch (def.uiKey) {
      case 'perfect': {
        const met = bestScore >= 4.95;
        unlocked = unlocked || met;
        progressKind = 'bestScore';
        progressCurrent = bestScore;
        progressTarget = 4.95;
        progressPercent = unlocked ? 100 : clampPct((bestScore / 4.95) * 100);
        break;
      }
      case 'highSplit45': {
        const met = bestScore >= 4.5;
        unlocked = unlocked || met;
        progressKind = 'bestScore';
        progressCurrent = bestScore;
        progressTarget = 4.5;
        progressPercent = unlocked ? 100 : clampPct((bestScore / 4.5) * 100);
        break;
      }
      case 'pints5': {
        const met = totalPints >= 5;
        unlocked = unlocked || met;
        progressKind = 'pours';
        progressCurrent = Math.min(5, totalPints);
        progressTarget = 5;
        progressPercent = unlocked ? 100 : clampPct((totalPints / 5) * 100);
        break;
      }
      case 'pints10': {
        const met = totalPints >= 10;
        unlocked = unlocked || met;
        progressKind = 'pours';
        progressCurrent = Math.min(10, totalPints);
        progressTarget = 10;
        progressPercent = unlocked ? 100 : clampPct((totalPints / 10) * 100);
        break;
      }
      case 'pints25': {
        const met = totalPints >= 25;
        unlocked = unlocked || met;
        progressKind = 'pours';
        progressCurrent = Math.min(25, totalPints);
        progressTarget = 25;
        progressPercent = unlocked ? 100 : clampPct((totalPints / 25) * 100);
        break;
      }
      case 'pints50': {
        const met = totalPints >= 50;
        unlocked = unlocked || met;
        progressKind = 'pours';
        progressCurrent = Math.min(50, totalPints);
        progressTarget = 50;
        progressPercent = unlocked ? 100 : clampPct((totalPints / 50) * 100);
        break;
      }
      case 'pints75': {
        const met = totalPints >= 75;
        unlocked = unlocked || met;
        progressKind = 'pours';
        progressCurrent = Math.min(75, totalPints);
        progressTarget = 75;
        progressPercent = unlocked ? 100 : clampPct((totalPints / 75) * 100);
        break;
      }
      case 'pints100': {
        const met = totalPints >= 100;
        unlocked = unlocked || met;
        progressKind = 'pours';
        progressCurrent = Math.min(100, totalPints);
        progressTarget = 100;
        progressPercent = unlocked ? 100 : clampPct((totalPints / 100) * 100);
        break;
      }
      case 'crawler': {
        const met = uniquePubs >= 5;
        unlocked = unlocked || met;
        progressKind = 'pubs';
        progressCurrent = Math.min(5, uniquePubs);
        progressTarget = 5;
        progressPercent = unlocked ? 100 : clampPct((uniquePubs / 5) * 100);
        break;
      }
      case 'crawler10': {
        const met = uniquePubs >= 10;
        unlocked = unlocked || met;
        progressKind = 'pubs';
        progressCurrent = Math.min(10, uniquePubs);
        progressTarget = 10;
        progressPercent = unlocked ? 100 : clampPct((uniquePubs / 10) * 100);
        break;
      }
      case 'crawler15': {
        const met = uniquePubs >= 15;
        unlocked = unlocked || met;
        progressKind = 'pubs';
        progressCurrent = Math.min(15, uniquePubs);
        progressTarget = 15;
        progressPercent = unlocked ? 100 : clampPct((uniquePubs / 15) * 100);
        break;
      }
      case 'crawler20': {
        const met = uniquePubs >= 20;
        unlocked = unlocked || met;
        progressKind = 'pubs';
        progressCurrent = Math.min(20, uniquePubs);
        progressTarget = 20;
        progressPercent = unlocked ? 100 : clampPct((uniquePubs / 20) * 100);
        break;
      }
      case 'early': {
        const met = hasEarlyPour;
        unlocked = unlocked || met;
        progressKind = 'binary';
        progressCurrent = met ? 1 : 0;
        progressTarget = 1;
        progressPercent = unlocked ? 100 : 0;
        break;
      }
      case 'weekend': {
        const met = weekendStreak >= 3;
        unlocked = unlocked || met;
        progressKind = 'weekendStreak';
        progressCurrent = Math.min(3, weekendStreak);
        progressTarget = 3;
        progressPercent = unlocked ? 100 : clampPct((weekendStreak / 3) * 100);
        break;
      }
      case 'weekend6': {
        const met = weekendStreak >= 6;
        unlocked = unlocked || met;
        progressKind = 'weekendStreak';
        progressCurrent = Math.min(6, weekendStreak);
        progressTarget = 6;
        progressPercent = unlocked ? 100 : clampPct((weekendStreak / 6) * 100);
        break;
      }
      case 'weekly4': {
        const met = weeklyStreak >= 4;
        unlocked = unlocked || met;
        progressKind = 'weeklyStreak';
        progressCurrent = Math.min(4, weeklyStreak);
        progressTarget = 4;
        progressPercent = unlocked ? 100 : clampPct((weeklyStreak / 4) * 100);
        break;
      }
      case 'streak7': {
        const met = calendarStreak >= 7;
        unlocked = unlocked || met;
        progressKind = 'dailyStreak';
        progressCurrent = Math.min(7, streakDaily);
        progressTarget = 7;
        progressPercent = unlocked ? 100 : clampPct((streakDaily / 7) * 100);
        break;
      }
      case 'streak14': {
        const met = streakDaily >= 14;
        unlocked = unlocked || met;
        progressKind = 'dailyStreak';
        progressCurrent = Math.min(14, streakDaily);
        progressTarget = 14;
        progressPercent = unlocked ? 100 : clampPct((streakDaily / 14) * 100);
        break;
      }
      case 'streak30': {
        const met = streakDaily >= 30;
        unlocked = unlocked || met;
        progressKind = 'dailyStreak';
        progressCurrent = Math.min(30, streakDaily);
        progressTarget = 30;
        progressPercent = unlocked ? 100 : clampPct((streakDaily / 30) * 100);
        break;
      }
      case 'elite': {
        const met = totalPints >= 10 && averageScore >= 4.3;
        unlocked = unlocked || met;
        progressKind = 'elite';
        progressCurrent = totalPints;
        progressTarget = 10;
        const pourPart = Math.min(1, totalPints / 10);
        const avgPart = Math.min(1, averageScore / 4.3);
        progressPercent = unlocked ? 100 : clampPct(((pourPart + avgPart) / 2) * 100);
        break;
      }
      default:
        break;
    }

    out.push({
      def,
      unlocked,
      progressPercent,
      progressKind,
      progressCurrent,
      progressTarget,
      bestScore,
      averageScore,
    });
  }

  return out;
}

export interface AchievementHubSummary {
  maxTierAmongUnlocked: number;
  unlockedCount: number;
  totalCount: number;
}

export function achievementHubSummary(
  scores: MyScoreRow[],
  persistedCodes: readonly string[],
  streakDaily: number,
  weekendStreak: number,
  weeklyStreak: number,
): AchievementHubSummary {
  const rows = computeProfileAchievements(scores, persistedCodes, streakDaily, weekendStreak, weeklyStreak);
  const unlocked = rows.filter((r) => r.unlocked);
  const maxTierAmongUnlocked =
    unlocked.length === 0 ? 0 : Math.max(...unlocked.map((r) => r.def.tierRank));
  return {
    maxTierAmongUnlocked,
    unlockedCount: unlocked.length,
    totalCount: rows.length,
  };
}

export function achievementHubSummaryFromSnapshot(
  scores: MyScoreRow[],
  persistedCodes: readonly string[],
  snapshot: { daily: number; weekend: number; weekly: number } | null,
): AchievementHubSummary {
  const daily = snapshot?.daily ?? pourStreakCalendarDays(scores);
  const weekend = snapshot?.weekend ?? weekendStreakFromScores(scores);
  const weekly = snapshot?.weekly ?? weeklyStreakFromScores(scores);
  return achievementHubSummary(scores, persistedCodes, daily, weekend, weekly);
}

const ACHIEVEMENT_TITLE_KEYS: Record<AchievementUiKey, TranslationKey> = {
  perfect: 'badgePerfect',
  pints5: 'badgePints5',
  pints10: 'badgePints10',
  pints25: 'badgePints25',
  pints50: 'badgePints50',
  pints75: 'badgePints75',
  pints100: 'badgePints100',
  crawler: 'badgePubCrawler',
  crawler10: 'badgePubCrawler10',
  crawler15: 'badgePubCrawler15',
  crawler20: 'badgePubCrawler20',
  early: 'badgeEarlyBird',
  weekend: 'badgeWeekendStreak',
  weekend6: 'badgeWeekendStreak6',
  streak7: 'badgeDailyStreak7',
  streak14: 'badgeDailyStreak14',
  streak30: 'badgeDailyStreak30',
  weekly4: 'badgeWeeklyStreak4',
  highSplit45: 'badgeHighSplit45',
  elite: 'badgeEliteAverage',
};

export function profileAchievementTitleKey(uiKey: AchievementUiKey): TranslationKey {
  return ACHIEVEMENT_TITLE_KEYS[uiKey];
}
