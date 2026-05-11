# Split The G Mobile

Expo iOS/Android app for Split The G. This repository is intentionally separate from the existing web/PWA repo so mobile release tooling, EAS builds, signing, and store metadata stay isolated.

## Related Repositories

- Web/PWA: https://github.com/Rixouu/split-the-g
- Mobile: https://github.com/Rixouu/split-the-g-mobile

## Stack

- Expo SDK 54 + Expo Router
- React 19 / React Native 0.81
- Supabase Auth + Postgres/Storage
- TanStack Query for client data fetching
- Expo Image Picker, SecureStore, Notifications, Sharing
- React Native Maps for pub discovery

## Environment

Copy `.env.example` to `.env.local` and fill only public mobile-safe values:

```bash
EXPO_PUBLIC_SITE_URL=https://split-the-g.vercel.app
EXPO_PUBLIC_API_BASE_URL=https://split-the-g.vercel.app
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Do not add Roboflow private keys, Resend keys, Supabase service role keys, or other server secrets to this app. Pour scoring calls the web/backend API.

## Development

```bash
npm install
npx expo start
```

Open on iOS Simulator, Android Emulator, Expo Go, or a development build.

## Auth And Deep Links

The app scheme is `splittheg://`. Add the native callback URL to Supabase Auth redirect URLs:

```text
splittheg://auth/callback
```

If universal links are added later, keep the custom scheme as a fallback.

## Maps

The app uses `react-native-maps`. Use a mobile-safe Google Maps key with app restrictions for the iOS bundle ID and Android package:

- iOS bundle ID: `com.rixouu.splittheg`
- Android package: `com.rixouu.splittheg`

Do not reuse a browser-only HTTP referrer-restricted key for native SDKs.

## EAS

```bash
npx eas init
npx eas build --profile preview --platform ios
npx eas build --profile preview --platform android
```

After `eas init`, copy the generated project ID into `app.json` under `expo.extra.eas.projectId`.

## Current Parity

- Home: camera/library image selection and submission to `/api/pour-submission`.
- Auth: Supabase Google OAuth with SecureStore session persistence.
- Feed, pour detail, leaderboard, pubs: direct Supabase reads intended to run under RLS.
- Push: Expo push token registration hook; server-side send path still needs production hardening.
