/** Matches `user_achievements.code` from web `PROFILE_ACHIEVEMENT_DEFS`. */
export const achievementLabelEn: Record<string, string> = {
  'pints-5': '5 pints logged',
  'pints-10': '10 pints logged',
  'pints-25': '25 pints logged',
  'pints-50': '50 pints logged',
  'pints-75': '75 pints logged',
  'pints-100': '100 pints logged',
  'pub-crawler-5': 'Pub crawler (5 venues)',
  'pub-crawler-10': 'Pub crawler (10 venues)',
  'pub-crawler-15': 'Pub crawler (15 venues)',
  'pub-crawler-20': 'Pub crawler (20 venues)',
  'early-bird': 'Early bird',
  'high-split-4-5': 'High split (4.5+)',
  'perfect-score': 'Perfect score',
  'elite-average': 'Elite average',
  'weekend-warrior-3': 'Weekend warrior (3)',
  'weekend-warrior-6': 'Weekend warrior (6)',
  'weekly-streak-4': 'Weekly streak (4)',
  'daily-streak-7': 'Daily streak (7)',
  'daily-streak-14': 'Daily streak (14)',
  'daily-streak-30': 'Daily streak (30)',
};

export function labelForAchievementCode(code: string): string {
  return achievementLabelEn[code] ?? code;
}
