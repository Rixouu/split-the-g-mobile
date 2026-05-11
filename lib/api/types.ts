export interface PourRankContext {
  allTimeRank: number;
  weeklyRank: number;
  totalSplits: number;
  weeklyTotalSplits: number;
}

export interface PourScore {
  id: string;
  slug: string | null;
  split_score: number | null;
  split_image_url: string | null;
  pint_image_url: string | null;
  g_closeup_image_url: string | null;
  username: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  country_code: string | null;
  created_at: string | null;
  bar_name?: string | null;
  bar_address?: string | null;
  google_place_id?: string | null;
  pour_rating?: number | null;
  pint_price?: number | null;
  session_id?: string | null;
  submitter_user_id?: string | null;
  email?: string | null;
  email_opted_out?: boolean | null;
}

export interface CompetitionSummary {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  visibility: string | null;
  win_rule: string;
  path_segment: string | null;
  created_at?: string;
}

/** Matches web `COMPETITION_ROW_SELECT` / RLS-visible row. */
export interface CompetitionDetail extends CompetitionSummary {
  created_by: string;
  max_participants: number;
  glasses_per_person: number;
  target_score?: number | null;
  location_name?: string | null;
  location_address?: string | null;
  linked_bar_key?: string | null;
}

export interface PubSummary {
  bar_key: string;
  display_name: string;
  sample_address: string | null;
  google_place_id: string | null;
  avg_pour_rating: number | null;
  rating_count: number;
  submission_count: number;
}

export interface PourSubmissionResponse {
  success: boolean;
  redirectTo?: string;
  scoreId?: string;
  error?: string;
  detail?: string;
  status?: number;
}
