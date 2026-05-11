# Data Parity Map

This mobile app is a full React Native client, not a WebView wrapper. It maps the web app's React Router loaders/actions to either direct Supabase reads or small HTTP calls where server-only secrets are required.

| Web route / behavior | Mobile implementation | Notes |
| --- | --- | --- |
| Home pour action (`app/routes/home.tsx` -> `handleHomePourAction`) | `submitPourImage()` -> `POST /api/pour-submission` | Keeps Roboflow private key and anti-cheat checks server-side. Sends Supabase bearer token and `X-Split-G-Session`. |
| Feed loader (`app/routes/feed.tsx`) | `fetchRecentScores()` | Direct `scores` reads under RLS. RSS/news can be added as a server wrapper later. |
| Pour detail (`app/routes/score/score.tsx`) | `fetchPourDetailData()`, venue/claim mutations in `lib/api/client.ts`, `components/pour-detail/*` | Ranks, pub page key, native venue editor (Places + geofence), claim/unclaim + `sync_scores_username_for_jwt`, competition attach when `?competition=` is present (after save or claim, signed-in). |
| Leaderboard loaders | `lib/api/leaderboard.ts` + `fetchLeaderboard()` | **Global** tab uses `leaderboard_scores_global` (7-day window) with table fallback; **My country** / **Friends** use country and email RPCs with fallbacks; `leaderboard/country-stats.tsx` calls `get_country_stats_all_time` / `get_country_stats_24h`. RPC absence → Muted empty/feature-unavailable behavior aligned with web intent. |
| Pubs loader (`app/routes/pubs.tsx`) | `fetchPubs()` | Reads `bar_pub_stats`, matching the web loader's primary source. |
| Auth state | `AuthProvider` + Supabase SecureStore adapter | OAuth `redirectTo` from [`lib/auth/oauth-redirect.ts`](lib/auth/oauth-redirect.ts): **`splittheg://auth/callback`** on dev client / standalone; **Expo Go** uses `exp://…/--/auth/callback` (must match Supabase allowlist or login falls back to Site URL in the browser). |
| PostHog browser client | `posthog-react-native` wrapper | Public key only. |
| Web Push service worker | `registerForPushNotifications()` | Stores Expo push token in `push_subscriptions`; server send path needs production review. |

Server secrets never belong in this repository. Add small server endpoints to the web app when mobile needs data that requires privileged keys or private third-party calls.

## Route-level coverage (web `split-the-g` vs this app)

| Area | Web (`app/routes.ts`) | Mobile | Gap summary |
| --- | --- | --- | --- |
| Home / pour | Full camera, competition query, offline queue, modals | Image picker + `POST /api/pour-submission` | No live camera pipeline, no competition deep link, no offline queue |
| Feed | Full feed | `fetchRecentScores` list | RSS/extras not ported |
| Wall | Collage | Vertical list (`app/(tabs)/wall.tsx`) | No collage layout |
| Competitions | CRUD, detail, joins, invites | List + **detail** (`competition/[competitionId]`) + **owner edit** (`competition/[competitionId]/edit`) + **create** via web (`competition/create`) | Join/invite/live leaderboard still largely web-only; create has no native form |
| Leaderboards | Global + country + 24h + friends | **Global / My country / Friends** (`leaderboard/index.tsx`) + **country stats** All-time vs 24h (`leaderboard/country-stats.tsx`) | Past-24h as separate top-level web route is folded into country-stats segment; deep links differ |
| Pubs | Directory + `pubs/:barKey` | Map + list + **detail** (`pub/[barKey]`) | Web pub page tabs, favorites, admin/import, hours, spend still missing |
| Profile | account, progress, achievements, expenses, scores, favorites, friends, faq | **Stack** under `(tabs)/profile/*` — hub, account, scores, progress, expenses, favorites, friends, achievements; **FAQ** at `app/faq.tsx` | Full achievement celebrations, calendar UX, and some web modals not ported; friends/request flows are MVP |
| Legacy score redirect | `/score/:splitId` → pour | `app/score/[splitId].tsx` → `/pour/:slug` | Matches web redirect-to-pour |
| i18n | Locale-prefixed routes | `language` modal + context | Not route-per-locale |
| Product API | email, push-notify, sponsors, PWA | Pour + client push hook | Email, web push, banners not in app |

## Feature audit (web vs Expo — explicit)

Route-by-route product truth. *Partial* means a screen or bridge exists but does not match web behavior.

| Web route (main file) | Mobile | Status |
| --- | --- | --- |
| `/:lang` home `routes/home.tsx` | `(tabs)/index` | **Partial** — picker + server pour; no camera pipeline, competition deep link from home, offline queue. |
| `pour/:pourRef` `routes/score/score.tsx` | `pour/[pourRef].tsx`, `components/pour-detail/*` | **Near parity** — ranks/totals, celebration line, share message body, pub link, maps/BMC, leaderboard CTA, competition query param + banner + `competition_scores` attach after successful venue save or claim (requires sign-in for attach), owner venue edit with Google Places + `expo-location` geofence, claim/unclaim + username sync RPC. **Remaining:** web-specific OAuth redirect URLs and some modal/toast UX; no embedded web score shell. |
| `competitions` `routes/competitions.tsx` | `(tabs)/compete.tsx` | **Partial** — public list; tap → detail. |
| `competitions/new` `routes/competitions.new.tsx` | `competition/create.tsx` | **Bridged** — in-app browser to web; **no native builder**. |
| `competitions/:id` `routes/competitions.$competitionId.tsx` | `competition/[competitionId].tsx` | **Near parity (MVP)** — metadata + linked pub + **Edit** for owner → native editor. **Not ported:** join, invites, in-competition boards, live leaderboard. |
| `competitions/:id/edit` | `competition/[competitionId]/edit.tsx` | **Near parity (MVP)** — owner-gated fields + `competitions` update + validation shared with web patterns. |
| `pubs` `routes/pubs.tsx` | `(tabs)/pubs.tsx` | **Partial** — no web filters/favorites/banner parity. |
| `pubs/:barKey` `routes/pubs.$barKey.tsx` | `pub/[barKey].tsx` | **Partial** — stats + Maps + open web; **missing** wall/promos/hours/spend/admin (web pub page). |
| **Add / claim pub** | — | **No `/pubs/new` on web** — flows live in directory + pub detail + mailto; use web from app. |
| `profile/*` | `(tabs)/profile/*` | **Near parity (MVP)** — sub-screens + `useMyScores` / profile APIs. **Not ported:** full achievement UX, full calendar/progress UI, every web modal. |
| `score/:splitId` (redirect) | `app/score/[splitId].tsx` | **Near parity** — resolves slug, replaces to pour. |
| `faq` | `app/faq.tsx` | **Near parity (MVP)** — i18n Q&A subset + in-app routes. |
| Leaderboard variants | `leaderboard/index.tsx`, `leaderboard/country-stats.tsx` | **Near parity (MVP)** — Global / country / friends + country aggregate stats; URL shape differs from web’s separate past-24h route. |

If `scores` queries fail, confirm columns (`bar_name`, `google_place_id`, `pour_rating`, `pint_price`, …) exist and RLS allows `anon`/`authenticated` reads used by the client.

## i18n (mobile)

- User-visible strings for **tabs, pour detail, profile hub, leaderboard, FAQ, competition flows, score redirect, and most profile sub-screens** are centralized in [`lib/i18n/translations.ts`](lib/i18n/translations.ts). Keys are typed as `TranslationKey`; screens call `useLocale().t('key')`.
- **`en`** is the only fully populated locale today. `th`, `fr`, `es`, `de`, `it`, and `ja` are stubbed (`{}`); `translate()` falls back to English so the app stays usable while copy is translated incrementally.
- **Navigation headers** set in [`app/_layout.tsx`](app/_layout.tsx) (`Stack.Screen` `title`s) remain English for now; in-screen titles and body copy follow the selected locale where keys exist.
- **Validation / server errors** (e.g. competition edit `validateCompetitionEdit`, Supabase `error.message`) may still surface in English until wrapped or mapped to keys.

## Web URL → Expo route (MVP parity)

Handy when matching marketing links or support docs to the app.

| Web (React Router) | Expo route |
| --- | --- |
| `/pour/:ref` | `/pour/[pourRef]` |
| `/score/:uuid` (legacy) | `/score/[splitId]` → redirects to pour |
| `/leaderboard` (global / country / friends variants on web) | `/leaderboard/index` (tabs); country aggregates: `/leaderboard/country-stats` |
| `/faq` (locale-prefixed on web) | `/faq` |
| `/competitions/:id` | `/competition/[competitionId]` |
| `/competitions/:id/edit` | `/competition/[competitionId]/edit` |
| `/pubs/:barKey` | `/pub/[barKey]` |
| `/profile/...` (many subpaths on web) | `/(tabs)/profile/...` (`account`, `scores`, `progress`, …) |

Universal links / `app.json` scheme configuration must expose these paths if you want OS-level opening without custom mapping.
