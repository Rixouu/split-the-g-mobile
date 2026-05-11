import type { PourScore } from '@/lib/api/types';

/**
 * Parity with web `score.tsx` loader: session cookie match OR signed-in submitter match.
 */
export function getIsPourOwner(
  score: PourScore,
  pourSessionId: string | null | undefined,
  authUserId: string | null | undefined,
): boolean {
  const sid = pourSessionId?.trim();
  const rowSession = score.session_id?.trim();
  const sessionMatch = Boolean(sid && rowSession && sid === rowSession);

  const uid = authUserId?.trim();
  const sub = score.submitter_user_id?.trim();
  const submitterMatch = Boolean(uid && sub && uid === sub);

  return sessionMatch || submitterMatch;
}
