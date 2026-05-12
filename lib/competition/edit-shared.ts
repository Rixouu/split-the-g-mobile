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

export type CompetitionValidationResult =
  | { ok: true; target: number | null }
  | {
      ok: false;
      key:
        | 'compFormErrNoName'
        | 'compFormErrTimes'
        | 'compFormErrEndAfterStart'
        | 'compFormErrMaxBelowParticipants'
        | 'compFormErrTargetRange';
      vars?: Record<string, string>;
    };

export function validateCompetitionFormInput(values: {
  title: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: number;
  winRule: WinRuleChoice;
  targetScore: string;
  participantCount: number;
}): CompetitionValidationResult {
  if (!values.title.trim()) {
    return { ok: false, key: 'compFormErrNoName' };
  }
  if (!values.startsAt || !values.endsAt) {
    return { ok: false, key: 'compFormErrTimes' };
  }
  const starts = new Date(values.startsAt);
  const ends = new Date(values.endsAt);
  if (ends <= starts) {
    return { ok: false, key: 'compFormErrEndAfterStart' };
  }
  if (values.maxParticipants < values.participantCount) {
    return {
      ok: false,
      key: 'compFormErrMaxBelowParticipants',
      vars: { count: String(values.participantCount) },
    };
  }
  let target: number | null = null;
  if (values.winRule === 'closest_to_target') {
    const parsedTarget = parseFloat(values.targetScore);
    if (!Number.isFinite(parsedTarget) || parsedTarget < 0 || parsedTarget > 5) {
      return { ok: false, key: 'compFormErrTargetRange' };
    }
    target = parsedTarget;
  }
  return { ok: true, target };
}

/** @deprecated Prefer validateCompetitionFormInput + t(key) */
export function validateCompetitionEdit(values: {
  title: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: number;
  winRule: WinRuleChoice;
  targetScore: string;
  participantCount: number;
}): { target: number | null } | { error: string } {
  const r = validateCompetitionFormInput(values);
  if (r.ok) return { target: r.target };
  const fallback: Record<string, string> = {
    compFormErrNoName: 'Please enter a competition name.',
    compFormErrTimes: 'Choose start and end times.',
    compFormErrEndAfterStart: 'End time must be after start time.',
    compFormErrMaxBelowParticipants: `Max participants must be at least ${values.participantCount} (already joined).`,
    compFormErrTargetRange: 'Target score must be between 0 and 5.',
  };
  return { error: fallback[r.key] ?? r.key };
}

export function updateGlassesPerPersonForWinRule(next: WinRuleChoice, previous: number): number {
  if (next === 'most_submissions') {
    return GLASSES_PER_PERSON_UNLIMITED_SENTINEL;
  }
  if (previous >= GLASSES_PER_PERSON_UNLIMITED_SENTINEL) return 1;
  return previous;
}

export function winRuleUsesUnlimitedGlasses(winRule: string): boolean {
  return winRule === 'most_submissions';
}

export function isStoredGlassesUnlimited(n: number): boolean {
  return n >= GLASSES_PER_PERSON_UNLIMITED_SENTINEL;
}
