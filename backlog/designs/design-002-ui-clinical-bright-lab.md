---
id: design-002-ui-clinical-bright-lab
status: decomposed
priority: 1
created: 2026-06-27
updated: 2026-06-27
feedback_refs: []
---

# Design: Web UI design pass — Clinical Bright Lab

## Summary

The game is now played interactively in the browser, so the web UI needs to look
intentional. Replace the dark/generic zinc theme with a cohesive **Clinical Bright
Lab** design system (light "specimen sheet" aesthetic), turn the battle into a
left↔right face-off, and give units large art-ready **specimen-card** portraits —
applied across all five views.

## Player Experience

Calm lab phases feel bright and airy (a clean lab bench); combat reads as a clear
squad-vs-enemies face-off that tints toward warm danger. Units feel like specimens
on cards you'll later fill with real art, reinforcing the rogue-scientist theme.

## Acceptance Criteria

- [ ] App uses a Clinical Bright Lab palette via semantic tokens (paper bg, white
      panels, ink text, lab-teal/bio-green/danger-red accents) — no raw `zinc-*`
      dark classes left in `src/web`.
- [ ] Battle shows squad (left) vs enemies (right), responsive to stacked on narrow
      screens.
- [ ] Units render as large specimen cards with a species-tinted art panel, glyph,
      name, HP, SPD/ATK, SPEC tag, and grade badge.
- [ ] `bun run typecheck`, `bun run web:build`, and `bun run test` stay green.

## Implementation Notes

Decisions locked with the user: Clinical Bright Lab palette (paper #f4f2ec, panel
#fff, ink #23272e, accent/lab-teal #0d9488, bio #65a30d, danger #dc2626, amber
#d97706); specimen-card portraits; full pass across all views. Build semantic
tokens in `src/web/index.css` `@theme` (Tailwind v4 generates `bg-paper`,
`text-ink`, `text-accent`, …) and refactor the ~295 raw palette utility usages onto
them. Reuse `SPECIES_EMOJI`/`getSpeciesEmoji` as the placeholder glyph; add
`getSpeciesTint`. Keep store/sim/core untouched (presentational only).

## Out of Scope

- Real portrait art (placeholder glyph; panel is art-ready).
- Game logic, `gameStore.ts`, core/sim changes.

## Open Questions

None — style direction decided with the user.

## Tickets

- ticket-002-ui-design-system-foundation
- ticket-003-ui-specimen-card-portraits
- ticket-004-ui-battle-faceoff
