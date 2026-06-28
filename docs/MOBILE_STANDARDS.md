# Mobile & Web Rendering Standards

The web frontend must render well on a phone (~360px wide) **and** desktop
without regressions. These are the concrete rules. Most are checked
automatically by `bun run check:responsive`; the rest are review-time checks
(see the checklist at the bottom).

---

## 1. Mobile-first, always

- Author the **base** classes for the narrowest screen, then scale **up** with
  `md:` / `lg:` prefixes. Never the reverse.
- Target widths to keep in mind: **360px** (phone), **768px** (tablet, `md`),
  **1280px** (desktop, `lg`).
- ✅ `grid-cols-2 md:grid-cols-3`  ❌ `grid-cols-3`

## 2. Multi-column card grids must reflow

- Any grid whose cells are **cards with multiple pieces of content** (portrait,
  name, stats, tags) must start at **≤ 2 columns** on mobile and scale up.
- Bare `grid-cols-3`+ (no responsive prefix) is **rejected by the guard**.
- Tiny, fixed-content grids (e.g. three SPD/ATK/STAGE stat chips) may stay
  3-up, but must be added to the guard's `ALLOWLIST` with a one-line reason —
  not left bare.

## 3. No fixed pixel widths

- Don't size layout with `w-[320px]` / `min-w-[…px]` / `max-w-[…px]`. Use
  relative units, flex, grid, or the semantic `max-w-*` scale.
- Container max-widths are standardized:
  | Surface | Max width | Why |
  |---|---|---|
  | Content views (menu, campaign, shop, lab) | `max-w-lg` | single readable column |
  | Battle arena | `max-w-3xl` / `max-w-5xl` | two squads need horizontal room |
- The guard rejects `*-[…px]` width classes.

## 4. Flex rows must not overflow

- Any flex child that holds variable-length text needs **`min-w-0`** (so it can
  shrink) plus **`truncate`** on the text, or the row blows out its container.
- Chip/tag rows (mutations, equipment, status) use **`flex-wrap`** so they wrap
  instead of overflowing.

## 5. Tap targets

- Interactive controls should be comfortably tappable — aim for **≥ 40px**
  effective height (`py-2`+ on buttons, generous padding on icon controls).

---

## Enforcement

| Mechanism | Catches | Where |
|---|---|---|
| `bun run check:responsive` | bare `grid-cols-3+`, fixed px widths | pre-commit hook (`.claude/hooks/pre-commit-check.sh`) |
| Review checklist (below) | overflow, min-w-0, wrap, tap size | `.claude/hooks/stop-review.sh`, this doc |

The guard is mechanical and intentionally narrow — it cannot see layout. The
checklist covers what a grep can't.

## Review checklist (web changes)

- [ ] New grids are mobile-first (`grid-cols-2 md:grid-cols-3`, not `grid-cols-3`).
- [ ] Flex rows with text have `min-w-0` + `truncate`; chip rows use `flex-wrap`.
- [ ] No fixed pixel widths; container uses the standard `max-w-*`.
- [ ] Buttons/controls meet the tap-target size.
- [ ] Eyeballed at ~360px and at desktop — no horizontal scroll, no clipped text.

## Verifying a width manually

The page is a single SPA with no routes, so to inspect a view at phone width,
render it inside a 360–390px iframe (or use Chrome DevTools device toolbar) —
resizing the OS window is unreliable under display scaling.
