# Split The G 1.3

## What's New

- Improved the camera-to-result flow. Analysis starts once the camera closes, and successful results open automatically.
- If an analysis times out, the app keeps the captured photo so you can retry without retaking it.
- Removed donation prompts and external payment links from the app.

## App Review notes

Version 1.3 removes the external donation option identified in the November 2 review under Guideline 3.1.1. The “Buy the creator a beer” prompt, its external payment link, and the related FAQ entry have been removed in all app languages. No purchase or donation is required to use the app.

To verify, open a pour result and scroll through its sharing section, then open FAQ from Profile. To test capture, tap Start analysis, frame a Guinness glass with the G visible, then tap Capture and analyze. A successful result opens automatically. If a request times out, the photo and retry action stay visible.

## Verification

TypeScript, ESLint, and all 68 Jest tests passed. The capture regression tests cover iOS camera dismissal, a successful first analysis, duplicate dismissal events, and a timeout followed by a successful retry of the same photo. The tests simulate the camera and API responses.
