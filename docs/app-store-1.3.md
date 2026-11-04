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


The signed version 1.3.0 build 9 was installed on the connected iPhone. The user confirmed that Capture and analyze opens the result on the first tap. The exact release bundle was checked for the retry label and absence of the external donation URL.

Donation prompts were also removed from the website homepage, FAQ, and shared result pages in all seven languages. Web TypeScript and seven tests passed. The staged deployment was checked before promotion; the live homepage, FAQ and a shared result then returned HTTP 200 without donation text or payment URLs. Web source commit: 1518ad4. Deployment: dpl_8c8euBwCL2PEwDwqzCduWx5btkgo.

The earlier server response could not be reconstructed because historical runtime logs were unavailable. The original symptom was consistent with the iOS modal handoff, which is now serialized and verified on the user's phone.

## Delivery

- Version 1.3.0, build 9 uploaded to App Store Connect on November 4, 2026 at 15:42 Bangkok time. Xcode reported “Upload succeeded” and “EXPORT SUCCEEDED”; Apple then began processing the package.
- The user will update the App Store Connect version and build selection manually. No review resubmission was sent by this agent.
- Xcode reported missing debug symbols for the prebuilt React, ReactNativeDependencies and Hermes frameworks. These warnings did not block the upload and can limit symbol names in crash reports from those frameworks.
