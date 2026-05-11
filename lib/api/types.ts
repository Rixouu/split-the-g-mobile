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
