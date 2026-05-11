# Transitioning web app to expo app
_Exported on 5/11/2026 at 19:49:41 GMT+7 from Cursor (3.3.30)_

---

**User**

Currently it's a web progressive app and I would love to spin this into a expo app for ios and android can you help me with that. I will keep that project I would probably need to start a new project for this 
Let me know what's need to be done 

---

**Cursor**

Exploring the project structure and PWA setup so we can plan an Expo mobile app alongside the existing web app.



Confirming the repo: React Router 7 + Vite (SSR), not Next.js — strong PWA (manifest, service worker, install banner) and Supabase (Google OAuth), camera/scoring, maps, push. Choosing between a WebView shell and a full React Native UI changes scope drastically.



**Expo app approach**

> **Which direction do you want for the first shipping version of the Expo app?**
> - Thin native shell: Expo loads the existing deployed web app in a WebView (fastest; OAuth/deep links need setup)
> - Hybrid: Native shell + WebView for most screens, native only where needed (camera, share, etc.)
> - Full React Native UI: Rebuild screens with Expo Router / RN components (largest effort, most native feel) ✔

Checking how heavily the app relies on server loaders vs client-side Supabase to scope the RN migration.



Noting pour submission already accepts `Authorization: Bearer` and form `accessToken`; mobile auth integration is feasible. Creating the plan.



---

**User**

Before we start I want to understand a couple of more things how does it work with git? Do I need a new repo please give also more insights 
I want something clean 

---

**Cursor**

Clarifying Git/repo options and updating the plan with a concise "Git & repository strategy" section.



Expanding the plan with a dedicated Git & repository strategy: you don't need a new repo, but a separate repo is often the cleanest option for a full RN app.



Here’s the distilled Git picture, aligned with what we added to the plan ([Expo full RN spinout plan](file:///Users/cto/.cursor/plans/expo_full_rn_spinout_fc3b27e2.plan.md)).

### Do you need a new repo?

**No, it’s not required by Git or by Expo.** Git only cares what’s inside **one** repository boundary. You can:

1. **New repo (Expo only)** — separate `split-the-g` (web) and e.g. `split-the-g-mobile` (Expo).
2. **Same repo (monorepo)** — one git history with `apps/web` + `apps/mobile` (+ optional `packages/shared`).
3. **Two repos + shared package** — web + mobile repos; optional small shared npm/GitHub package for types/i18n later.

None of these change Supabase or your deployed web app by themselves; they’re about **how you organize code, CI, and releases**.

### What tends to feel “clean”

For **full React Native** alongside an existing **mature web app**, **a new Expo repo** is often the cleanest default:

- **Mobile and web have different tooling** (EAS, Xcode/signing, OTA updates vs Vercel/SSR). Separate repos keep PRs, failures, and release trains easier to reason about.
- **Secrets stay obvious**: mobile repo gets **public** config (e.g. Supabase anon); **server/private** keys stay in the web/backend deployment, not in the app store binary’s sibling folder.
- **Duplication is acceptable at first** (strings, a few types). When that hurts, you add a **shared package**—not submodules unless you really want that operational complexity.

A **monorepo** is clean in a different sense: **one place for shared types and i18n** and one PR for cross-cutting changes—but you pay for it with **workspace setup** and **CI that runs the right checks per app**.

### Practical workflow (either layout)

- Same **Supabase project**; same product.
- Mobile may **call your production web origin** for things that must stay server-side (e.g. pour pipeline), as in the plan’s diagram—**that’s HTTP/URLs, not git**.
- Link the two repos in each **README** so nobody hunts for “where’s mobile?”

The plan’s **§1** is now expanded with Option A/B/C, submodule caution, and a short recommendation for a “clean” default. If you tell me whether you prefer **strict separation** (two repos) or **single repo forever** (monorepo), we can treat that as the locked decision before any scaffold.

---

**User**

I would prefer to have the cleanest option which is new repo so let's do that 

---

**Cursor**

Locking the plan to Option A (new Expo repo) and updating the plan document.



Here’s what we locked in and how the plan reflects it.

### Decision

You’re using **Option A: a new git repository** only for the Expo app. The current **split-the-g** repo stays the web/PWA source of truth; no monorepo move of the existing project.

### What that implies day to day

- **Two remotes:** e.g. `split-the-g` (web) + `split-the-g-mobile` (or whatever you name it).
- **Shared product, separate code:** Same Supabase project and same deployed web URL for server-only flows; the mobile repo holds RN/Expo only and **public** client config (anon key, API URL), not Roboflow/server secrets.
- **README cross-links** in each repo so the split is obvious to future you and collaborators.

### Plan updates

The plan file is updated with:

- A **locked** repository decision right after the intro.
- **Overview** and **§2** wording that assume scaffolding happens **in the new repo**.
- The first todo is now: *create the new remote + local repo, scaffold Expo Router + EAS + scheme, cross-link READMEs* (the “pick monorepo vs new repo” step is removed as work).

When you’re ready to **execute** (create the repo and run `create-expo-app`, etc.), say so explicitly (e.g. “go ahead and implement” / “start scaffolding the mobile repo”) and we can do it in agent mode in the folder you choose.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I’ll execute from the attached plan without modifying the plan file. First I’m loading the relevant execution guidance, then I’ll mark the first existing todo in progress and start by creating the separate Expo repo scaffold.

I’m using the executing-plans guidance for this plan. Because subagents are available, I’m also checking the subagent-driven workflow before starting implementation.

I’ll use `split-the-g-mobile` as the local project name unless an existing folder or remote tells us otherwise. I’m checking the current repo remote and parent directory before creating anything.

The current web repo is `Rixouu/split-the-g` on `main`, and there is no `split-the-g-mobile` folder under the sibling projects directory. Next I’m checking GitHub CLI access and whether the intended mobile repo already exists.

`gh` is not installed, so I can create the local git repo now but cannot create the GitHub remote from this machine via GitHub CLI. I’ll proceed locally and leave the remote URL unset unless another authenticated GitHub method is available.

The Expo scaffold is downloading/installing in the new sibling folder. While npm finishes, I’m mapping the existing env and API expectations so the mobile app can point at the right public config without copying secrets.

---

**User**

https://github.com/Rixouu/split-the-g-mobile I have this for the git repo 

---

**Cursor**

Thanks, that remote exists and is empty, so I’ll wire the local Expo scaffold to `Rixouu/split-the-g-mobile` directly. I also noticed the scaffolded folder is currently being seen by an enclosing parent git repo until we initialize its own `.git`, so I’m fixing that boundary first.

The mobile folder is now its own git repo on `main` with the GitHub remote attached. Next I’m replacing the default Expo sample with the Split The G skeleton and installing the native dependencies needed by the plan.

Dependencies for Supabase auth, Expo secure storage, image capture, sharing, notifications, maps, React Query, and PostHog are installed. I’m now adding the app foundation: config, providers, Supabase auth, API client, and the initial native screens.

The new repo now has app config, EAS config, environment docs, and the mobile README cross-link. I’m adding the reciprocal web README pointer and then the web API endpoint the native app submits pours to.

The first todo is verified at the repo level: the mobile repo has its own `main` branch and origin set to `https://github.com/Rixouu/split-the-g-mobile.git`. Supabase auth scaffolding is in place now; I’m moving into the pour submission API alignment and native core flow.

The capture flow, result route, feed, profile, pubs, leaderboard, i18n seed, and share path normalization are now in the mobile app. I’m documenting the loader-to-native data map so future parity work has a clean source of truth.

Maps support is in place with `react-native-maps`, and the README now documents native Google key restrictions. I’m adding the release/compliance checklist, then I’ll run the mobile and web verification commands and fix what they surface.

The release checklist is added. Running fresh verification now for the Expo app first, then the web route changes.

Web typecheck passed and mobile lint passed, but mobile TypeScript found five issues. I’m fixing those now before marking the final todo complete.

Mobile TypeScript is now clean after the fixes. I’m re-running lint and checking editor diagnostics for the edited files.

All plan todos are marked complete after the current verification pass. I’m doing the required final review/branch-finish checks now, including collecting the exact git diffs in both repos.

I’m using the finishing workflow now. Before presenting integration options, I’m running one final code review against the implemented plan and already have fresh verification evidence for mobile typecheck/lint and web typecheck/ESLint.

The automated code-review subagent could not run because the API usage limit was reached, so I’m doing the final review manually from the diffs and verification outputs.

Manual review found one functional issue: `expo-sharing` shares local files, not plain URLs. I’m switching result sharing to React Native’s `Share.share()` API.

Implemented the Expo spinout and completed all plan todos.

What changed:

- Created local mobile repo at `/Users/cto/Documents/Repositories/02-Pro/split-the-g-mobile`.
- Wired remote to `https://github.com/Rixouu/split-the-g-mobile.git`.
- Added Expo Router app with native tabs: Home capture, Feed, Pubs, Profile, Pour detail, Leaderboard.
- Added Supabase native auth with SecureStore, Google OAuth deep link `splittheg://auth/callback`.
- Added mobile pour submission to web `POST /api/pour-submission`.
- Added direct Supabase reads for scores/feed/leaderboard/pubs.
- Added `react-native-maps`, PostHog wrapper, Expo push registration, EAS config, `.env.example`, mobile README, data parity docs, release checklist.
- Updated web repo with `/api/pour-submission`, mobile session support via `X-Split-G-Session` / `mobileSessionId`, and README cross-link.

Verification run:

- Mobile `npx tsc --noEmit`: passed.
- Mobile `npm run lint`: passed.
- Web `npm run typecheck`: passed.
- Web `npm run eslint`: passed with one existing warning in `app/i18n/seo-meta.ts`.

No commits or pushes were made because you haven’t explicitly asked me to commit/push.

Implementation complete. What would you like to do?

1. Merge back to main locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

