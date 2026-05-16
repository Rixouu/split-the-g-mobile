# Architecture (Expo client)

## Runtime stack

- **Expo SDK 54** + **Expo Router** (file-based routes under `app/`)
- **React 19** / **React Native**; **TanStack Query** for server state
- **Supabase** (`@supabase/supabase-js`) with session persisted via **SecureStore**
- Pour scoring and privileged operations call the **web** deployment (`EXPO_PUBLIC_API_BASE_URL`), not embedded secrets

## Directory roles

| Path | Role |
| --- | --- |
| `app/` | Screens, layouts, and route segments. Prefer thin screens: compose hooks + components. |
| `components/` | Reusable UI; `components/split-the-g/` holds brand primitives (`AppButton`, dock, links). |
| `constants/` | `theme.ts` (brand hex), `design-tokens.ts` (semantic tokens), `layout.ts` (gutters). |
| `lib/` | Config, Supabase client, auth, API clients, i18n, analytics, pour submission, domain helpers. |
| `supabase/migrations/` | SQL shipped with the repo for shared schema/docs; apply via your Supabase workflow. |
| `scripts/` | One-off Node tooling (assets, i18n sync, backfills). |

## Data flow (simplified)

1. **Auth:** `AuthProvider` + `lib/supabase/client.ts` and `secure-store-adapter.ts`; OAuth return URL from `lib/auth/oauth-redirect.ts`.
2. **Reads:** Mostly direct Supabase queries under RLS; leaderboard/profile helpers live under `lib/api/` and `lib/profile/`.
3. **Pour submit:** `lib/pour/submit-pour.ts` → `POST /api/pour-submission` on the web app (Roboflow and rate limits stay server-side).
4. **Analytics:** Optional PostHog via `lib/analytics/client.ts` (public key only).

## Design consistency

- UI should consume **`constants/design-tokens.ts`**, not ad-hoc colors. See [design-system.md](./design-system.md).

## Related repos

- **Web/PWA:** [split-the-g](https://github.com/Rixouu/split-the-g) — source of truth for pour pipeline, many modals, and full competition UX.
