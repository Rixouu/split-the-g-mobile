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

export interface FriendPick {
  friend_user_id: string;
  peer_email: string | null;
}

export interface CompetitionInviteRow {
  id: string;
  invited_email: string;
}

export interface BarLinkOption {
  bar_key: string;
  display_name: string;
}

export interface ParticipantProfilePick {
  nickname?: string | null;
  display_name?: string | null;
  country_code?: string | null;
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

/** Row shape from `pub_wall_scores` RPC — matches web `PubWallRow`. */
export interface PubWallScoreRow {
  id: string;
  slug?: string | null;
  username: string | null;
  pint_image_url: string | null;
  created_at: string;
  split_score: number;
  bar_name?: string | null;
  bar_address?: string | null;
  city?: string | null;
  region?: string | null;
  country_code?: string | null;
  pint_price?: number | null;
}

/** First row from `pub_extra_stats_for_bar` RPC. */
export interface PubExtraStatsRow {
  distinct_drinkers: number;
  total_pint_spend: number;
  my_pint_spend: number;
}

/** Public `pub_place_details` row (select-only on mobile). */
export interface PubPlaceDetailsRow {
  bar_key: string;
  opening_hours: string | null;
  guinness_info: string | null;
  alcohol_promotions: string | null;
  maps_place_url: string | null;
  google_place_id: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface PubLinkedCompetitionRow {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  path_segment: string | null;
}

/** Matches web `pubs.$barKey` loader bundle (minus deferred Google hours fetch). */
export interface PubDetailPageData {
  bar: PubSummary;
  wallPours: PubWallScoreRow[];
  wallError: string | null;
  extra: PubExtraStatsRow;
  extraError: string | null;
  placeDetails: PubPlaceDetailsRow | null;
  linkedCompetitions: PubLinkedCompetitionRow[];
  favId: string | null;
}

export interface PourSubmissionResponse {
  success: boolean;
  redirectTo?: string;
  scoreId?: string;
  error?: string;
  detail?: string;
  status?: number;
}
