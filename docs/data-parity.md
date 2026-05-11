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
