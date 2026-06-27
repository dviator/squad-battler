---
id: ticket-002-ui-design-system-foundation
status: shipped
priority: 1
size: L
parent: design-002-ui-clinical-bright-lab
depends_on: []
feedback_refs: []
created: 2026-06-27
updated: 2026-06-27
---

# Ticket: UI design-system foundation (Clinical Bright Lab)

## Goal

Establish the Clinical Bright Lab token system and flip the whole app to it, leaving
a coherent light UI (battle still vertical, portraits still emoji — those are later
tickets).

## Scope

- `src/web/index.css` — replace `@theme` + `body` with semantic tokens (paper,
  panel, panel-2, ink, muted, line, accent, bio, danger, warning, squad, enemy;
  `--font-sans` added, `--font-mono` kept). Retune keyframes + scrollbar for light bg.
- `src/web/utils/species.ts` — retune `getHpColor`, `getLifeStageColor`,
  `getEncounterTypeColor`, `getItemCategoryColor`, `getItemRarityColor`; add
  `getSpeciesTint`.
- Sweep raw `zinc/cyan/red/...` classes → semantic token classes across:
  `App.tsx`, `views/{BattleView,CampaignView,ShopView,LabView,MainMenuView}.tsx`,
  `components/{BattleArena,UnitCard,HpBar,ShopItemCard,UnitPicker}.tsx`.

## Acceptance Criteria

- [ ] `grep -rE "(bg|text|border)-zinc" src/web` returns ~none.
- [ ] App renders light/clinical and coherent across all 5 views.
- [ ] `bun run typecheck`, `bun run web:build`, `bun run test` green.

## Verification

`/eval` + `bun run web:build`. Screenshot menu/campaign/battle/shop/lab via
claude-in-chrome for contrast/readability.

## Notes

Presentational only — no store/sim/core changes. Leaves battle vertical + emoji
portraits for ticket-003/004.

> **Shipped 2026-06-27.** Clinical Bright Lab tokens in `index.css`; color helpers
> retuned + `getSpeciesTint` added in `utils/species.ts`; swept all `*.tsx` off raw
> `zinc/cyan/red/...` onto semantic tokens (0 raw palette classes remain). Verified
> in-browser: menu, shop, battle render light/clinical with good contrast.
> `/eval`: typecheck ✓ test ✓ (576) balance ✓ · web:build ✓.
