# Local development

This complements the root [README](../README.md) with a single place for day-to-day setup. Prefer updating **this file** when adding env vars or scripts so the README stays high-level.

## Prerequisites

- Node.js **20+** (see README for engine notes)
- **pnpm 11+** (`corepack enable` once)
- iOS Simulator (Xcode) and/or Android emulator (Android Studio) for device testing

## Install and run

```bash
pnpm install
pnpm start
```

Use `pnpm run ios`, `pnpm run android`, or `pnpm run web` as shortcuts. For a clean Metro cache: `pnpm run start:clean`.

Dependency installs honor **`minimumReleaseAge: 1440`** (24 hours after publish) in **`pnpm-workspace.yaml`** to reduce freshly-published compromise risk.

## Environment variables

Create **`.env`** at the repo root (gitignored). Only **`EXPO_PUBLIC_*`** keys are bundled into the client.

**Minimal:**

```env
EXPO_PUBLIC_SITE_URL=https://www.split-the-g.app
EXPO_PUBLIC_API_BASE_URL=https://www.split-the-g.app
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

**Common optional:** `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`, `EXPO_PUBLIC_AUTH_REDIRECT_URL` (debug).

See root README for Firebase Android / `google-services.json` and EAS file secrets — do not commit those files.

## OAuth redirect URLs

Supabase must allow the exact `redirectTo` the app sends, or users land on the web **Site URL** instead of returning to the app.

- **Dev builds / standalone:** allowlist **`splittheg://auth/callback`**.
- **Expo Go:** LAN IP `exp://` hosts are rejected by GoTrue before allowlist — use **tunnel**, **simulator** (this repo rewrites some LAN cases to loopback), or a **dev build**.

Implementation: `lib/auth/oauth-redirect.ts`.

## Maps

Use a **Maps SDK** key restricted to the iOS bundle and Android package (`com.rixouu.splittheg`), not a browser-only key.

## Lint and tests

```bash
pnpm run lint
pnpm test
```

See [testing.md](./testing.md) for Jest layout and conventions.
