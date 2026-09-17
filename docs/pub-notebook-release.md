# Pub Notebook — September 17, 2026

## Product boundary

- **Pubs:** public venue discovery, map, opening information, community photos.
- **Notebook:** personal planning, user-added places, want-to-visit/visited lists, private notes, and personal amenity tags. No score ranking, drink count, streak, reward, or visit target.
- **Profile → Analysis journal:** previous image analyses. This is not duplicated in Notebook.
- Old Favorites links redirect to Notebook. The remaining weekly wall ranking and unused Compete home component were removed.

## Guest and account behavior

All Notebook actions work without authentication: add a custom place or save one from Pubs, write/edit a note, choose tags/status, search/filter, open maps, and remove a place after confirmation.

Guest data is local AsyncStorage under `split-the-g-guest-notebook-v1`. Local reads/writes work offline. It is not uploaded automatically on sign-in. Uninstalling the app deletes guest data. Signed-in notebooks use existing `user_favorite_bars` plus the new `user_pub_notes` table and are separate from the device notebook. The UI explains this distinction.

Tags are explicitly personal observations, not verified accessibility or menu claims. Removing a favorite removes its note via a foreign-key cascade. Both mobile removal entry points warn before doing so. Account deletion also cascades the new notes. Existing favorites remain intact.

## Backend

Applied `supabase/migrations/20260917090000_private_pub_notebook.sql` to project `xjhjltbwhneykitcdawm`. RLS denies anonymous access and limits authenticated reads/writes to the owner; inserts and updates also verify ownership of the associated favorite.

Executed `supabase/tests/pub_notebook_rls.sql` against the live schema in a rollback-only transaction: owner read/write passed; other-user read/update/delete/insert denied; anonymous table access denied. No test records retained.

## Release checks

Implemented-code checks: 31 Jest tests pass, TypeScript passes, ESLint has no errors, and the iOS JS bundle exports successfully. The redesigned Notebook uses the same visual system as Pubs, Feed, and Profile. Directory-backed Notebook cards resolve their canonical pub key and open Pub Details; user-added places are clearly identified as personal entries instead of presenting a broken route.

- Run TypeScript, ESLint, Jest, and iOS bundling.
- Native guest smoke test: add a place → add note and tags → filter → force close/relaunch → edit → cancel removal → confirm removal.
- Native route test: save a pub from Pub Details → open Notebook → tap its card → confirm the same Pub Details page opens.
- Native account sync must also be tested on a signed-in device before production submission.
- Refresh App Store screenshots to show the actual new tab and guest functionality. Remove images promising rankings or competition.
- Review App Privacy and the privacy-policy text for private notes associated with an account. Guest notes never leave the device through this feature.
- Explain the new functionality honestly to App Review. Do not claim changing a tab guarantees acceptance: the G-alignment scoring concept may still be considered a drinking game under 4.3(b).

No App Store submission or production binary upload is performed by this feature implementation.
