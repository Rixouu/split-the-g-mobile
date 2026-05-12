import { emailDisplayName, normalizeEmail } from '@/lib/utils/profile-email';

import type { MyScoreRow } from '@/lib/api/profile';

export type ProgressRange = '7d' | '30d' | '90d' | 'all';

export type ComparisonScoreRow = {
  email: string | null;
  username: string | null;
  split_score: number;
  created_at: string;
};

export type FriendLeaderboardEntry = {
  email: string;
  label: string;
  pours: number;
  avg: number;
  best: number;
  latestAt: string;
  isCurrentUser: boolean;
};

export function progressRangeStart(range: ProgressRange): number | null {
  const now = Date.now();
  switch (range) {
    case '7d':
      return now - 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return now - 30 * 24 * 60 * 60 * 1000;
    case '90d':
      return now - 90 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

/**
 * Consecutive calendar days (local) with at least one pour, anchored from the most
 * recent pour day backward (streak breaks on first gap).
 */
export function pourStreakCalendarDays(scores: Pick<MyScoreRow, 'created_at'>[]): number {
  if (scores.length === 0) return 0;
  const dayKeys = new Set(
    scores.map((s) => {
      const d = new Date(s.created_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  const probe = new Date();
  probe.setHours(12, 0, 0, 0);
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (!dayKeys.has(key(probe))) {
    probe.setDate(probe.getDate() - 1);
  }
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    if (dayKeys.has(key(probe))) {
      streak++;
      probe.setDate(probe.getDate() - 1);
    } else break;
  }
  return streak;
}

/**
 * Consecutive ISO weeks (Mon–Sun) with at least one pour, anchored from the current
 * week’s Monday backward (same logic as the web profile progress page).
 */
export function weeklyStreakFromScores(scores: Pick<MyScoreRow, 'created_at'>[]): number {
  if (scores.length === 0) return 0;
  const weekKeys = new Set(
    scores.map((s) => {
      const d = new Date(s.created_at);
      const day = d.getDay();
      const mondayShift = (day + 6) % 7;
      const monday = new Date(d);
      monday.setHours(12, 0, 0, 0);
      monday.setDate(monday.getDate() - mondayShift);
      return `${monday.getFullYear()}-${monday.getMonth()}-${monday.getDate()}`;
    }),
  );
  const probe = new Date();
  const day = probe.getDay();
  const mondayShift = (day + 6) % 7;
  probe.setHours(12, 0, 0, 0);
  probe.setDate(probe.getDate() - mondayShift);
  let streak = 0;
  for (let i = 0; i < 104; i++) {
    const wk = `${probe.getFullYear()}-${probe.getMonth()}-${probe.getDate()}`;
    if (weekKeys.has(wk)) {
      streak++;
      probe.setDate(probe.getDate() - 7);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Consecutive weeks with at least one pour on Sat/Sun (local), anchored from the
 * current week's Saturday backward (same logic as the web profile progress page).
 */
export function weekendStreakFromScores(scores: Pick<MyScoreRow, 'created_at'>[]): number {
  if (scores.length === 0) return 0;
  const weekendKeys = new Set(
    scores
      .filter((s) => {
        const dow = new Date(s.created_at).getDay();
        return dow === 0 || dow === 6;
      })
      .map((s) => {
        const d = new Date(s.created_at);
        const dow = d.getDay();
        const saturdayShift = dow === 0 ? 1 : dow - 6;
        const saturday = new Date(d);
        saturday.setHours(12, 0, 0, 0);
        saturday.setDate(saturday.getDate() - saturdayShift);
        return `${saturday.getFullYear()}-${saturday.getMonth()}-${saturday.getDate()}`;
      }),
  );
  const probe = new Date();
  const pDay = probe.getDay();
  const saturdayShift = pDay === 0 ? 1 : pDay - 6;
  probe.setHours(12, 0, 0, 0);
  probe.setDate(probe.getDate() - saturdayShift);
  let streak = 0;
  for (let i = 0; i < 104; i++) {
    const wk = `${probe.getFullYear()}-${probe.getMonth()}-${probe.getDate()}`;
    if (weekendKeys.has(wk)) {
      streak++;
      probe.setDate(probe.getDate() - 7);
    } else {
      break;
    }
  }
  return streak;
}

export function buildFriendLeaderboard(
  rows: ComparisonScoreRow[],
  labels: Record<string, string>,
  currentEmail: string | null,
): FriendLeaderboardEntry[] {
  const grouped = new Map<
    string,
    {
      total: number;
      count: number;
      best: number;
      latestAt: string;
      latestName: string | null;
    }
  >();

  for (const row of rows) {
    const rawEmail = row.email?.trim();
    if (!rawEmail) continue;
    const email = normalizeEmail(rawEmail);
    const current = grouped.get(email) ?? {
      total: 0,
      count: 0,
      best: 0,
      latestAt: '',
      latestName: null,
    };

    current.total += Number(row.split_score ?? 0);
    current.count += 1;
    current.best = Math.max(current.best, Number(row.split_score ?? 0));
    if (!current.latestAt || new Date(row.created_at) > new Date(current.latestAt)) {
      current.latestAt = row.created_at;
      current.latestName = row.username?.trim() || null;
    }
    grouped.set(email, current);
  }

  return [...grouped.entries()]
    .map(([email, entry]) => ({
      email,
      label: labels[email] || entry.latestName || emailDisplayName(email),
      pours: entry.count,
      avg: entry.total / entry.count,
      best: entry.best,
      latestAt: entry.latestAt,
      isCurrentUser: currentEmail != null && normalizeEmail(currentEmail) === email,
    }))
    .sort((a, b) => {
      if (b.avg !== a.avg) return b.avg - a.avg;
      if (b.best !== a.best) return b.best - a.best;
      if (b.pours !== a.pours) return b.pours - a.pours;
      return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
    });
}
