/** Mirrors web `GLASSES_PER_PERSON_UNLIMITED_SENTINEL`. */
export const GLASSES_PER_PERSON_UNLIMITED_SENTINEL = 9999;

export type WinRuleChoice =
  | 'highest_score'
  | 'lowest_score'
  | 'best_average'
  | 'closest_to_target'
  | 'most_submissions';

export function normalizeWinRuleChoice(raw: string | null | undefined): WinRuleChoice {
  switch (raw) {
    case 'highest_score':
    case 'lowest_score':
    case 'best_average':
    case 'closest_to_target':
    case 'most_submissions':
      return raw;
    default:
      return 'highest_score';
  }
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isPrivateCompetitionVisibility(visibility: string | null | undefined): boolean {
  return (visibility ?? 'public') === 'private';
}

export function validateCompetitionEdit(values: {
  title: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: number;
  winRule: WinRuleChoice;
  targetScore: string;
  participantCount: number;
}): { target: number | null } | { error: string } {
  if (!values.title.trim()) {
    return { error: 'Please enter a competition name.' };
  }
  if (!values.startsAt || !values.endsAt) {
    return { error: 'Choose start and end times.' };
  }
  const starts = new Date(values.startsAt);
  const ends = new Date(values.endsAt);
  if (ends <= starts) {
    return { error: 'End time must be after start time.' };
  }
  if (values.maxParticipants < values.participantCount) {
    return {
      error: `Max participants must be at least ${values.participantCount} (already joined).`,
    };
  }
  let target: number | null = null;
  if (values.winRule === 'closest_to_target') {
    const parsedTarget = parseFloat(values.targetScore);
    if (!Number.isFinite(parsedTarget) || parsedTarget < 0 || parsedTarget > 5) {
      return { error: 'Target score must be between 0 and 5.' };
    }
    target = parsedTarget;
  }
  return { target };
}
