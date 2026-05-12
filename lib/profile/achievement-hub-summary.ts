import type { AchievementHubSummary } from '@/lib/profile/profile-achievements';
import { achievementHubSummaryFromSnapshot } from '@/lib/profile/profile-achievements';

/**
 * @deprecated Import from `@/lib/profile/profile-achievements` instead.
 * Kept for a stable barrel path used by older imports.
 */
export type { AchievementHubSummary };
export { achievementHubSummaryFromSnapshot };

/** When scores are unavailable, only persisted DB unlocks count (tiers may under-report). */
export function achievementHubSummaryFromPersistedCodes(
  persistedCodes: readonly string[],
): AchievementHubSummary {
  return achievementHubSummaryFromSnapshot([], persistedCodes, null);
}
