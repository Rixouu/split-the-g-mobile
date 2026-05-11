# Data Parity Map

This mobile app is a full React Native client, not a WebView wrapper. It maps the web app's React Router loaders/actions to either direct Supabase reads or small HTTP calls where server-only secrets are required.

| Web route / behavior | Mobile implementation | Notes |
| --- | --- | --- |
| Home pour action (`app/routes/home.tsx` -> `handleHomePourAction`) | `submitPourImage()` -> `POST /api/pour-submission` | Keeps Roboflow private key and anti-cheat checks server-side. Sends Supabase bearer token and `X-Split-G-Session`. |
| Feed loader (`app/routes/feed.tsx`) | `fetchRecentScores()` | Direct `scores` reads under RLS. RSS/news can be added as a server wrapper later. |
| Pour detail (`app/routes/score/score.tsx`) | `fetchScoreByRef()` | Supports UUID and slug refs. |
| Leaderboard loaders | `fetchLeaderboard()` | Uses score ordering directly for v1; country/time-window variants can be added as separate queries/RPCs. |
| Pubs loader (`app/routes/pubs.tsx`) | `fetchPubs()` | Reads `bar_pub_stats`, matching the web loader's primary source. |
| Auth state | `AuthProvider` + Supabase SecureStore adapter | Native OAuth redirect uses `splittheg://auth/callback`. |
| PostHog browser client | `posthog-react-native` wrapper | Public key only. |
| Web Push service worker | `registerForPushNotifications()` | Stores Expo push token in `push_subscriptions`; server send path needs production review. |

Server secrets never belong in this repository. Add small server endpoints to the web app when mobile needs data that requires privileged keys or private third-party calls.

## Route-level coverage (web `split-the-g` vs this app)

| Area | Web (`app/routes.ts`) | Mobile | Gap summary |
| --- | --- | --- | --- |
| Home / pour | Full camera, competition query, offline queue, modals | Image picker + `POST /api/pour-submission` | No live camera pipeline, no competition deep link, no offline queue |
| Feed | Full feed | `fetchRecentScores` list | RSS/extras not ported |
| Wall | Collage | Vertical list (`app/(tabs)/wall.tsx`) | No collage layout |
| Competitions | CRUD, detail, joins, invites | List + **detail** (`competition/[competitionId]`) + **create** via web (`competition/create`) | Join/invite/live leaderboard/edit still web-only; create has no native form |
| Leaderboards | Global + country + 24h | Global only (`leaderboard/index.tsx`) | Missing country / past-24h variants |
| Pubs | Directory + `pubs/:barKey` | Map + list + **detail** (`pub/[barKey]`) | Web pub page tabs, favorites, admin/import, hours, spend still missing |
| Profile | account, progress, achievements, expenses, scores, favorites, friends, faq | Single hub (`profile.tsx`) | Sub-screens not built |
| i18n | Locale-prefixed routes | `language` modal + context | Not route-per-locale |
| Product API | email, push-notify, sponsors, PWA | Pour + client push hook | Email, web push, banners not in app |

## Feature audit (web vs Expo — explicit)

Route-by-route product truth. *Partial* means a screen or bridge exists but does not match web behavior.

| Web route (main file) | Mobile | Status |
| --- | --- | --- |
| `/:lang` home `routes/home.tsx` | `(tabs)/index` | **Partial** — picker + server pour; no camera pipeline, competition deep link from home, offline queue. |
| `pour/:pourRef` `routes/score/score.tsx` | `pour/[pourRef].tsx`, `ScoreCard` | **Partial** — read-only: images, place, bar labels, optional rating/price, share, Google Maps. **Missing:** ranks, attach competition, edit venue/rating/price, full share UX (see web `score.tsx`). |
| `competitions` `routes/competitions.tsx` | `(tabs)/compete.tsx` | **Partial** — public list; tap → detail. |
| `competitions/new` `routes/competitions.new.tsx` | `competition/create.tsx` | **Bridged** — in-app browser to web; **no native builder**. |
| `competitions/:id` `routes/competitions.$competitionId.tsx` | `competition/[competitionId].tsx` | **Partial** — metadata + linked pub; **missing** join, invites, in-competition boards, edit. |
| `competitions/:id/edit` | — | **Missing** |
| `pubs` `routes/pubs.tsx` | `(tabs)/pubs.tsx` | **Partial** — no web filters/favorites/banner parity. |
| `pubs/:barKey` `routes/pubs.$barKey.tsx` | `pub/[barKey].tsx` | **Partial** — stats + Maps + open web; **missing** wall/promos/hours/spend/admin (web pub page). |
| **Add / claim pub** | — | **No `/pubs/new` on web** — flows live in directory + pub detail + mailto; use web from app. |
| `profile/*` | `profile.tsx` | **Partial** — rest web-only. |
| Leaderboard variants | `leaderboard/index.tsx` | **Partial** — global only. |

If `scores` queries fail, confirm columns (`bar_name`, `google_place_id`, `pour_rating`, `pint_price`, …) exist and RLS allows `anon`/`authenticated` reads used by the client.
