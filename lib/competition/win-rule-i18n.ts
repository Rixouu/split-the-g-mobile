import type { TranslationKey } from '@/lib/i18n/translations';

const WIN_RULE_TO_KEY: Record<string, TranslationKey> = {
  highest_score: 'compEditWinHighest',
  lowest_score: 'compEditWinLowest',
  best_average: 'compEditWinAvg',
  closest_to_target: 'compEditWinClosest',
  most_submissions: 'compEditWinMost',
};

export function translationKeyForWinRule(rule: string): TranslationKey {
  return WIN_RULE_TO_KEY[rule] ?? 'compEditWinHighest';
}
