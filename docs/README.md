# Documentation index

Product and engineering reference for the **Split the G** Expo client. Start here; deeper context for scoring and web APIs lives in the [split-the-g](https://github.com/Rixouu/split-the-g) repo.

| Doc | Purpose |
| --- | --- |
| [architecture.md](./architecture.md) | App layers, routing, data flow, and where logic lives |
| [data-parity.md](./data-parity.md) | Web vs mobile behavior, route coverage, known gaps |
| [design-system.md](./design-system.md) | Tokens, CTAs, typography, and UI conventions |
| [local-development.md](./local-development.md) | Env, scripts, auth redirects, maps keys |
| [release-checklist.md](./release-checklist.md) | Pre-release store and config checks |
| [rls-review-checklist.md](./rls-review-checklist.md) | Supabase RLS expectations for new tables/RPCs |
| [testing.md](./testing.md) | Unit tests, running Jest, what to add next |
| [cursor_transitioning_web_app_to_expo_ap.md](./cursor_transitioning_web_app_to_expo_ap.md) | Historical migration notes (Cursor export) |

## When to update docs

- **New screen or major flow:** Add a short note in `data-parity.md` if it changes web/native alignment.
- **New tokens or UI primitives:** Update `design-system.md` and link the source file.
- **New env vars or EAS secrets:** Update `local-development.md` and root `README.md` if they are developer-facing.
- **New pure helpers in `lib/`:** Prefer a colocated `__tests__` file (see `testing.md`).
