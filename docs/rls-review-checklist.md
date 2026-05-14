# Supabase RLS review checklist (manual)

Mobile uses the **anon** key only ([`lib/supabase/client.ts`](../lib/supabase/client.ts)). Every query below assumes **RLS** allows the intended role and forbids privilege escalation.

Check in the Supabase project: **Policies** per table/view and **SECURITY DEFINER** behavior for RPCs.

## Tables & views touched from mobile

| Artifact | Typical source files |
|---------|---------------------|
| `scores` | `lib/api/client.ts`, `lib/api/profile*.ts`, `lib/api/profile-hub-data.ts`, `lib/api/leaderboard.ts` |
| `public_profiles` | `lib/api/client.ts`, `lib/api/profile.ts`, `lib/api/profile-hub-data.ts`, `lib/auth/leaderboard-display-name.ts`, `lib/api/leaderboard.ts` |
| `bar_pub_stats` / `bar_pub_stats_mv` | `lib/api/client.ts` |
| `competitions` | `lib/api/client.ts` |
| `competition_participants` | `lib/api/client.ts`, `lib/competition/use-competitions-list-state.ts` |
| `competition_scores` | `lib/api/client.ts` |
| `competition_invites` | `lib/api/client.ts` |
| `user_friends` | `lib/api/client.ts`, `lib/api/profile.ts`, `lib/api/leaderboard.ts` |
| `friend_requests` | `lib/api/profile.ts`, `lib/api/client.ts` |
| `user_favorite_bars` | `lib/api/profile.ts`, `lib/api/client.ts` |
| `user_achievements` | `lib/api/profile.ts` |
| `user_streak_snapshots` | `lib/api/profile.ts` |
| `pub_place_details` | `lib/api/client.ts` |
| `push_subscriptions` | `lib/notifications/register.ts` |

## RPCs

- `leaderboard_scores_global`
- `leaderboard_scores_for_country`
- `leaderboard_scores_for_emails`
- `get_country_stats_all_time`
- `get_country_stats_24h`
- `sync_scores_username_for_jwt`
- `pub_wall_scores`
- `pub_extra_stats_for_bar`

For each RPC: confirm `GRANT`/role access and that validation (e.g. bar key format, JWT claims) matches product rules.
