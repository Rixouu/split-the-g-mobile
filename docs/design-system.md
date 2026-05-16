# Split the G — mobile design system

This app is Expo / React Native. Visual language matches the Split the G web palette (`tailwind` `guinness.*`): black base, Guinness gold accents, brown panels, cream body text.

---

## Source of truth

| Layer | File | Role |
|--------|------|------|
| Brand primitives | [`constants/theme.ts`](../constants/theme.ts) | `brandColors`, `Fonts` — hex values aligned with web |
| Semantic tokens | [`constants/design-tokens.ts`](../constants/design-tokens.ts) | Mapped roles: text, surfaces, strokes, CTAs, spacing, radii, `typeScale`, dock layout, shadows |
| Horizontal gutter alias | [`constants/layout.ts`](../constants/layout.ts) | Re-exports `SCREEN_EDGE_GUTTER` from design tokens |

**Rule of thumb:** new UI should consume **`design-tokens`** (and shared components), not duplicate `rgba(...)` / magic numbers from `brandColors`, unless there is no token yet—in that case, add a named token first.

---

## Call to action (CTA) tiers

### Primary — solid gold fill

- **Component:** [`AppButton`](../components/split-the-g/button.tsx) `variant="primary"` (default).
- **Look:** Background `colors.cta.primaryBg` (`brandColors.gold`), label `colors.cta.primaryFg` (dark on gold).
- **Shape:** Default **pill** (`radii.pill`); **`shape="rounded"`** for rectangles (`radii.buttonRounded`).
- **Also:** Pour FAB in [`brand-dock.tsx`](../components/split-the-g/brand-dock.tsx) uses the same primary fill.

Use for the single strongest action on a surface (e.g. sign-in, save, main empty-state action).

### Secondary — panel + gold stroke + gold label

- **Component:** `AppButton` `variant="secondary"`.
- **Look:** `colors.cta.secondaryBg` (panel brown), `borderColor` `colors.cta.secondaryBorder`, label `colors.cta.secondaryFg` (gold).

Use for supporting actions (toolbar pills, “open in maps”, card rows). Optional **`compact`** shrinks height and label for dense rows.

### Tertiary — gold text + underline

- **Component:** [`TextLink`](../components/split-the-g/text-link.tsx) — uses `typeScale.tertiaryLink`.
- **Also:** [`UnderlineTabRow`](../components/split-the-g/underline-tab-row.tsx) and [`BrandDockTabBar`](../components/split-the-g/brand-dock.tsx) use gold + bottom border for **tab** selection (same tier, different control).

### Ghost

- **Component:** `AppButton` `variant="ghost"` — transparent background, **cream** label (`colors.text.primary`) for low-emphasis actions (e.g. cancel beside a primary).

### Outline gold (optional)

- **Component:** `AppButton` `variant="outlineGold"`.
- **Look:** Transparent fill, thicker gold border (`colors.cta.outlineBorderWidth` / `outlineBorder`), gold label.
- Rare; prefer **secondary** unless you explicitly need outline-only on a busy surface.

---

## Typography

### Text components

[`components/split-the-g/typography.tsx`](../components/split-the-g/typography.tsx) wraps `Text` with styles from **`typeScale`**:

| Export | Token basis | Typical use |
|--------|-------------|-------------|
| `Eyebrow` | `typeScale.overline` | Section / screen label (uppercase, muted) |
| `Title` | `typeScale.title` | Large screen titles (32 / 800) |
| `Tagline` | `typeScale.tagline` | Gold emphasis line |
| `Body` | `typeScale.body` | Paragraphs |
| `Muted` | `typeScale.bodySmall` | Secondary copy (14, muted gold) |

Android: components set `includeFontPadding: false` where needed for alignment.

### Discover / feed chrome

[`discover-feed-chrome.tsx`](../components/split-the-g/discover-feed-chrome.tsx) composes `Eyebrow`, `Title`, `Muted` with local overrides aligned to tokens (e.g. `titleCompact` for list headers, `discoverMuted` for subtitles, `sectionTitle` for grid intros).

### Other `typeScale` entries

Defined in [`design-tokens.ts`](../constants/design-tokens.ts): `dockLabel`, `underlineTab`, `buttonLabel`, `pubSectionHeading`, `tertiaryLink`. Prefer importing the token and spreading into `StyleSheet.create` rather than copying values.

---

## Layout and spacing

From **`spacing`** in design tokens:

- **`screenGutter` / `SCREEN_EDGE_GUTTER`:** horizontal inset for scroll screens and aligned lists (20).
- **`sectionGap`:** default vertical rhythm between blocks inside [`Screen`](../components/split-the-g/screen.tsx) content.
- **`contentBottomInset`:** bottom padding so content clears the floating tab bar + FAB.
- **`cardPadding` / `cardInnerGap`:** [`Card`](../components/split-the-g/screen.tsx) padding and internal gap.

Use **`radii`** for corners: `pill`, `buttonRounded`, `card`, `dockPanel`, etc.

Dock-specific numbers live under **`layout.dock`** (FAB size, overlap, center gap, icon sizes, safe padding).

---

## Color roles (semantic)

High-level groups in **`colors`**:

- **`text`:** primary (cream), muted steps, accent / accentBright, `onPrimary`.
- **`surface`:** panel solids and translucent browns/blacks for cards, hub rows, icon wells.
- **`stroke`:** frames, hub strokes, CTA borders, subtle hairlines.
- **`cta`:** primary/secondary/outline/tertiary action colors + pressed/disabled opacity.
- **`dock` / `tab` / `chevron`:** navigation chrome.

Underlying hex values remain in **`brandColors`** so web and mobile stay aligned when the palette changes.

---

## Shadows

**`shadows.dockPanel`** and **`shadows.fab`** are shared by the bottom dock; extend this object if you add other elevated surfaces so elevation stays consistent.

---

## Contributing checklist

1. Add or adjust **`design-tokens.ts`** before introducing new hex, font sizes, or spacing literals.
2. Use **`AppButton`** / **`TextLink`** / **`UnderlineTabRow`** for interactive patterns instead of one-off styled `Pressable`s where possible.
3. Keep **screen horizontal alignment** on `SCREEN_EDGE_GUTTER` unless a design explicitly needs an exception (then document it in the PR).

---

## Related docs

- [`docs/data-parity.md`](data-parity.md) — API / data alignment with web (not visual).
