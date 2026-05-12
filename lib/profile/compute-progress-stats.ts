import type { MyScoreRow } from '@/lib/api/profile';

export function computeProgressStats(scores: MyScoreRow[]) {
  if (scores.length === 0) {
    return {
      count: 0,
      best: 0,
      avg: 0,
      last7: 0,
      dialPct: 0,
      totalSpend: 0,
    };
  }

  const best = Math.max(...scores.map((s) => s.split_score));
  const sum = scores.reduce((a, s) => a + s.split_score, 0);
  const avg = sum / scores.length;
  const dialPct = Math.min(100, Math.max(0, (avg / 5) * 100));
  const t7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7 = scores.filter((s) => new Date(s.created_at).getTime() >= t7).length;
  const totalSpend = scores.reduce((acc, s) => {
    const p = s.pint_price;
    if (p == null || !Number.isFinite(Number(p))) return acc;
    return acc + Number(p);
  }, 0);

  return {
    count: scores.length,
    best,
    avg,
    last7,
    dialPct,
    totalSpend,
  };
}
