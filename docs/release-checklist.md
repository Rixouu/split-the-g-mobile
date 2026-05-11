# Mobile Release Checklist

## Store Metadata

- App name: Split The G
- Bundle ID / package: `com.rixouu.splittheg`
- Privacy policy URL: use the current Split The G web policy URL or add one before submission.
- Support URL: use the production web app or a dedicated support page.

## Privacy Labels

Declare usage for:

- Camera and media library access for pour scoring.
- Account identifiers and email from Supabase Auth.
- Analytics events if `EXPO_PUBLIC_POSTHOG_KEY` is configured.
- Push notification token if notifications are enabled.
- Approximate location only if future pub discovery asks for device location.

## Native Permissions Copy

Add production copy before the first EAS build if the default Expo permission strings are not acceptable:

- Camera: required to capture a pour photo.
- Photos: optional import of an existing pour photo.
- Notifications: score, friend, competition, and leaderboard alerts.

## QA Matrix

- iPhone current iOS, one older supported iOS.
- Android current API, one mid-range Android device.
- Google OAuth sign-in and sign-out.
- Camera capture and library upload.
- Authenticated pour submit with bearer token.
- Anonymous pour submit with `X-Split-G-Session`.
- Feed, pour detail, leaderboard, pubs directory.
- Expo push token registration.

## Production Readiness Gaps

- Confirm `/api/pour-submission` is deployed on the web backend before enabling production submissions.
- Confirm Supabase redirect URL: `splittheg://auth/callback`.
- Confirm `push_subscriptions` accepts Expo token rows or add a mobile-specific token table.
- Add EAS project ID to `app.json` after `npx eas init`.
