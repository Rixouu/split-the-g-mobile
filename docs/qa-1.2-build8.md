# Version 1.2, build 8

## Changes

- Notebook uses the existing black, brown, cream and gold design tokens, with compact controls, underline status filters and simpler venue cards.
- Stack screens share a plain gold back chevron and black header. The native iOS glass background no longer surrounds a custom button.
- All embedded maps use dark appearance: native dark maps on iOS and the shared Google Maps style on Android.
- Pub details show a skeleton during the initial load without an ellipsis title.
- The Home photo replacement button stays on one line.
- API base URLs copied with a language suffix now resolve to the root API. The system photo picker works without full photo-library permission. HTTP 504 responses use the existing analysis timeout guidance and keep the selected photo available for retry.

## Verification

- TypeScript and ESLint passed; all 66 Jest tests passed.
- Native iPhone 17 Pro Max simulator checks covered adding a place, saving a private note and tags, status and search filters, and persistence after relaunch.
- Pub details loaded and the single back button returned to the directory. A saved analysis also loaded and returned through the shared back control.
- Both pub maps were visually checked in dark appearance on the native iOS simulator.
- The supplied Guinness photo was submitted through the native system picker to the production API. It returned a score of 4.49/5 and saved annotated image URLs, which returned HTTP 200. An earlier request timed out; a subsequent complete native request succeeded. This check does not establish that every request will succeed.
- The signed iOS Release build completed with version 1.2.0, build 8 and an embedded JavaScript bundle. The local IPA is in `dist/ios/split-the-g-1.2-build8.ipa` (ignored by Git).

Build 8 includes these fixes. The App Store Connect build previously uploaded was build 7; uploading or selecting build 8 there is a separate release step.
