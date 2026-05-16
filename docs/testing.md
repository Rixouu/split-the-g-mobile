# Testing

## Tooling

- **Jest** with **`jest-expo`** preset (SDK-aligned transforms and `react-native` mocks)
- Config: [`jest.config.js`](../jest.config.js)
- Test files: **`__tests__/**/*.test.ts`** (and `.tsx` if you add component tests later)

## Commands

```bash
pnpm test              # CI mode, once
pnpm run test:watch    # local TDD loop
```

## What to test first

Prioritize **pure functions** and small modules with no native calls:

- `lib/utils/*`, `lib/pour/format-split-score.ts`, `lib/places/parse-place-geo.ts`, `lib/competition/score-path.ts`, etc.
- Avoid Jest in code paths that require `expo-camera`, real SecureStore, or live network unless you add integration tests with heavy mocking.

## Adding tests

1. Create `lib/<area>/__tests__/<module>.test.ts` next to the module under test.
2. Import the exported functions and assert edge cases (`null`, invalid input, boundaries).
3. Run `pnpm test` before opening a PR.

## CI

If you add GitHub Actions (or EAS workflow), run `pnpm test` after `pnpm install --frozen-lockfile` on Node 20+. This repo may not define CI yet; adding `test` to your pipeline is recommended when contributing.
