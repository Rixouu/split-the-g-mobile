# 🥃 Split The G (Mobile)

**Split The G** is a social app for scoring how cleanly a pint’s foam line crosses the Guinness “G”: capture a pour, get a split score, share a card, and compare with friends, pubs, and live competitions.

This repository is the **Expo iOS/Android** client. The **web/PWA** (React Router, SSR, full surface area) lives at **[github.com/Rixouu/split-the-g](https://github.com/Rixouu/split-the-g)**.

The current product was substantially revamped by [Jonathan Rycx](https://github.com/Rixouu), who leads product direction, design, and full-stack implementation.

[![Expo SDK 54](https://img.shields.io/badge/Expo_SDK-54-000020?style=flat&logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61dafb?style=flat&logo=react)](https://reactnative.dev/)
[![React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-22c55e)](https://supabase.com/)
[![EAS](https://img.shields.io/badge/EAS-Build-9ca3af?style=flat)](https://docs.expo.dev/eas/)

## ✨ Key Features

### 🥃 Pour & Score

- Capture a pour via camera or library upload (**native**); submission goes to the web **`POST /api/pour-submission`** pipeline (Roboflow/scoring stays server-side on the web deployment).
- On the web app: scoring uses **Roboflow** workflows / **Inference.js** (env-configured); countdown + “in-window” pouring for competitions via `/?competition=...`

### 📣 Social Surfaces

- **Feed** and **Pubs** in-app; shareable pour experience via **`/pour/:pourRef`** on the web and native pour detail routes.
- On the web: **Wall collage** (`/wall`, `/collage`), full pub pages with map/embed, sponsor/contact slots — see the [web README](https://github.com/Rixouu/split-the-g/blob/main/README.md).

### 🏆 Profiles & Leaderboards

- Google sign-in via **Supabase** (native OAuth + deep link).
- **Feed**, **leaderboard**, **profile** flows; data reads use Supabase under **RLS** where applicable.

### 🧑‍🤝‍🧑 Competitions & Friends

- Full competition, invites, and friends UX is documented on the web stack; native **parity** is tracked in **`docs/data-parity.md`**.

### 🎯 Profile gamification

- Achievements, streaks, and progress surfaces are fully implemented on **web** (see [split-the-g README](https://github.com/Rixouu/split-the-g/blob/main/README.md)). Mobile alignment is described in **`docs/data-parity.md`**.

### 📬 Sponsorship & contact slots

- **`AdSlotBanner`** and sponsor placements are **web** components (`app/components/ad-slot-banner.tsx` in `split-the-g`).

### 🖥️ Desktop footer

- Web-only layout (`AppDesktopFooter`, `lang-layout`); not applicable to native shell.

### 🛡️ Pour trust & safety

- Server guards on the web (`app/utils/pour-submission-guards.server.ts`): per-user **rate limits**, **duplicate image** detection (hash), optional **EXIF** freshness (`POUR_RATE_LIMIT_MAX_PER_HOUR`, `POUR_EXIF_MAX_AGE_MINUTES`). Native clients hit the same API; do not embed private Roboflow or service keys.

## 🛠 Tech Stack (this repo)

### App

- **Expo SDK 54** + **Expo Router** (file-based routes)
- **React 19** / **React Native**
- **Supabase** (Auth session in **SecureStore**, Postgres reads under RLS)
- **TanStack Query** for client fetching
- **expo-image-picker**, **expo-secure-store**, **expo-notifications**, **expo-sharing**
- **react-native-maps** (mobile Google Maps SDK key)
- **PostHog** via `lib/analytics/client.ts` (optional)

### Web / backend (sibling repo)

- **React Router 7**, **Vite**, **Tailwind**, Supabase, Roboflow, Resend, etc. — see **[split-the-g](https://github.com/Rixouu/split-the-g)**.

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **npm**
- **Xcode** (iOS Simulator) and/or **Android Studio** emulators for local device testing
- A **Supabase** project (URL + anon key — public to the client)
- Optional: **Google Maps** SDK key (iOS bundle + Android package restrictions)
- Optional: **PostHog** key + host

### Installation

```bash
npm install
npx expo start
```

Use **Expo Go** for quick UI checks, or a **development build** if a library is not supported in Go. In an **interactive** terminal you can press **`i`** / **`a`** or run:

```bash
npm run ios       # expo start --ios
npm run android   # expo start --android
```

If Expo prompts to upgrade **Expo Go** on the emulator to match your SDK, accept it (non-interactive CI shells cannot answer that prompt).

### Environment Variables

Create a **`.env`** in the project root (do not commit; it is gitignored). Only **`EXPO_PUBLIC_*`** values are bundled — treat them as public.

#### Required (minimal)

```env
EXPO_PUBLIC_SITE_URL=https://split-the-g.vercel.app
EXPO_PUBLIC_API_BASE_URL=https://split-the-g.vercel.app
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Common optional

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-mobile-restricted-maps-sdk-key
EXPO_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Do not** add Roboflow private keys, Resend keys, Supabase **service role**, OAuth **client secrets**, or other server secrets — pour scoring and privileged work stay on the **web** deployment.

Full web **`VITE_*`** / server env documentation: [split-the-g README — Environment Variables](https://github.com/Rixouu/split-the-g/blob/main/README.md#environment-variables).

## 📈 Analytics & Tracking

- Mobile uses a thin PostHog wrapper (`lib/analytics/client.ts`); event taxonomy can mirror the web layer described in **`split-the-g`** (`app/utils/analytics/`).
- Web-specific docs (GA4, consent, dashboard specs): **`split-the-g`** repo (`docs/analytics-tracking.md`, `docs/posthog-insights.spec.json`).

## 📁 Project Structure

```txt
split-the-g-mobile/
├── app/                    # Expo Router screens (tabs, pour detail, auth callback, …)
├── components/             # UI (including split-the-g primitives)
├── lib/                    # config, Supabase, API client, auth, i18n, analytics, pour submit
├── docs/                   # data parity, release checklist, planning exports
├── assets/                 # icons, splash
├── app.json                # Expo config + extra (EAS project id)
└── eas.json                # EAS build profiles
```

## 🔧 Available Scripts

```bash
npm start            # expo start
npm run ios          # expo start --ios
npm run android      # expo start --android
npm run web          # expo start --web
npm run lint         # expo lint
npm run generate-assets  # re-gen app icon / splash / favicon from assets/images/icon.png
```

## 🌟 Implementation Notes (native)

- **Pour submission:** image → `EXPO_PUBLIC_API_BASE_URL` **`/api/pour-submission`** (same trust/rate limits as web when enforced server-side).
- **Auth:** scheme **`splittheg://`** — add **`splittheg://auth/callback`** to Supabase Auth redirect URLs.
- **Maps:** iOS bundle **`com.rixouu.splittheg`**, Android package **`com.rixouu.splittheg`** — use an app-restricted Maps SDK key (not a browser-only HTTP referrer key).
- **EAS:** project id lives in **`app.json`** (`expo.extra.eas.projectId`) and **`.eas/project.json`**. Build with `npx eas build --profile preview --platform ios|android`.

### Supabase redirect URLs (return to app after Google)

If **`redirectTo`** is not allowlisted **exactly**, Supabase sends users to the **Site URL** (e.g. `https://split-the-g.app/`) — you stay **in the browser**, signed in on the website, not the app.

The app builds `redirectTo` in **`lib/auth/oauth-redirect.ts`**:

- **`npx expo run:android` / `run:ios` (dev client), EAS builds, standalone:** `splittheg://auth/callback` — add this **once** under **Authentication → URL Configuration → Redirect URLs**.
- **Expo Go only:** Supabase **GoTrue rejects** `redirectTo` URLs whose hostname is a **non-loopback IP** (e.g. `192.168.*`, `10.0.2.2`) **before** the dashboard allowlist runs — adding those `exp://` URLs does not fix OAuth. Use **`npx expo start --tunnel`** and allowlist the logged `exp://…` URL (hostname is a domain), use a **simulator** (this app rewrites LAN IPs to `127.0.0.1` in dev), or use a **development build** with **`splittheg://auth/callback`**.

Optional: set **`EXPO_PUBLIC_AUTH_REDIRECT_URL`** (see **`.env.example`**) to force a single redirect during debugging.

In **`__DEV__`**, sign-in logs the resolved `redirectTo` (see **`lib/auth/auth-context.tsx`**).

**Google Cloud:** keep the OAuth client’s redirect URI as Supabase’s `https://<project-ref>.supabase.co/auth/v1/callback`. You usually do **not** add `splittheg://` there when using Supabase-hosted Google sign-in.

## 📱 Native vs Web

- **Web:** PWA install banner, full competitions/wall/sponsor/ad-slot flows, SSR, Roboflow server-side — see [split-the-g](https://github.com/Rixouu/split-the-g).
- **Native:** focused client for capture, feed, pubs, profile, leaderboard, push registration hook — details in **`docs/data-parity.md`** and **`docs/release-checklist.md`**.

## 🔐 Security & Compliance

- **RLS** on Supabase for user-scoped reads.
- Secrets belong on the **server** / web env — not in the mobile binary beyond public anon keys.

## 🚀 Deployment (stores)

Use **EAS Build** / **Submit** (`eas.json` profiles). Production configuration and env for the **web** API remain on your Vercel/hosting setup for **split-the-g**.

## 🤝 Contributing

Contributions are welcome.

1. Run **`npm run lint`**
2. Keep mobile-only secrets out of git; use **EAS Secrets** for `EXPO_PUBLIC_*` in CI if needed
3. Open a PR; note any **Supabase** or **web API** dependency

## 📄 License

No `LICENSE` file was found in this repository. If usage terms exist, they are expected to be defined by the project owner.

## 👥 Team

- **Jonathan** — Lead Developer — [Rixouu](https://github.com/Rixouu)

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for tooling and EAS
- **Supabase** for RLS-powered security
- **React Native** community
- **[split-the-g](https://github.com/Rixouu/split-the-g)** web stack (Roboflow, scoring API, product surface)

---

**Built with ❤️ for clean pours and friendly competition.**
