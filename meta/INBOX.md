# INBOX — your review queue

The one place to check. Entries the autonomous loop produces for you, newest
first. `[NEEDS-INPUT]` also fires a push notification; `[SHIPPED]` does not
(review on your own cadence).

Legend:

- `[SHIPPED]` — merged to main, now in its playtest verification window. Play it,
  then give feedback via `/capture-feedback` (positive → ticket `verified`,
  negative → follow-up ticket).
- `[NEEDS-INPUT]` — a design/idea is blocked on a decision only you can make
  (game feel, balance, new content). The loop will not guess.

Clear an entry by deleting it once handled (the underlying ticket/design carries
the durable record).

---

### [NEEDS-INPUT] 2026-06-27 · design-004 Level Loop & Squad Frame

Filed `design-004-level-loop-and-squad-frame` from our session and decomposed it.
Locked with you: **action before economy** — the run opens on combat, the shop is
earned (no shop before fight 1), shop after every fight → next node (linear, lightly
randomized) → boss; combat + shop share one **persistent squad frame**. Encoded the
judgment in `meta/policies.md` + `feedback-005-action-before-economy` +
`DESIGN_FRAMEWORK` Run Loop.

Tickets: **007** shop-sequence bug (*started in background now*), **008** persistent
squad frame + card layout (actionable), **009** card visual design (blocked, below),
**010** shop screen layout (after 007+008).

Needs your creative input before I push on the card *design* and economy feel:

1. **Card visual design language (ticket-009)** — how the attack-turn timer reads
   (radial ring vs. depleting bar vs. pip countdown), information hierarchy, and the
   polish that makes the tick-combat fun to watch. I can prototype 1–2 timer
   treatments in-browser for you to pick from — say the word.
2. **Shop economy feel** — how tight should "spend only what you earned" be? I'll
   tune to balance targets unless you have a feel in mind.
3. **Node randomization** — how light is "light"? Enemy layout only, or minor
   difficulty variation too?
4. **Pre-boss treatment** — is the normal post-fight shop before the boss enough, or
   should the boss get a distinct prep beat?

### [NEEDS-INPUT] 2026-06-27 · design-003 Overall Level Design

Refined your `overall-level-design` idea into `backlog/designs/design-003-overall-level-design.md`.
Locked with you: 9 floors + bonus 10th, floor = themed world of N encounters, boss
per floor. Still needs your creative input before full decomposition:

1. **3 missing floor themes** (you have 6 of 9).
2. **Floor ordering** — confirm/reorder my proposed curve (genetic scrap → goobs →
   reject → hybrids → HR → TBD → TBD → sharp creatures → TBD climax → bonus).
3. **Floor-10 bonus** — what is it (true boss / endless / secret)?
4. **Per-floor enemy & boss rosters** (new species/mutations are yours to author).
5. **Meta-progression** — breed/lab between floors, or only between runs?

Note: the **structural foundation** (generalize World→Floor for a 9+bonus campaign,
reframe the Goob content as one floor, show floor progress in UI) is already
actionable and can be built without waiting on the above. Say the word and I'll
decompose + ship that slice.

### [SHIPPED] 2026-06-27 · ticket-004 battle left↔right face-off (UI pass complete)

The battle now reads as a face-off: **your squad on the left**, **enemies on the
right**, with a VS divider and directional attack lunges (squad lunges right,
enemies left). On narrow screens it stacks. This completes the full UI design pass
(design-002) — Clinical Bright Lab palette + specimen cards + face-off. Play a run
and let me know how it feels; `/capture-feedback` to verify or steer.

### [SHIPPED] 2026-06-27 · ticket-003 specimen-card portraits

Units now render as large specimen cards — a species-tinted art panel with a big
glyph (real portrait art drops straight in later), a SPEC-### tag, and a genetic
grade badge, across the campaign roster and the battle arena. Battle is still
top/bottom; ticket-004 turns it into the left↔right face-off next.

### [SHIPPED] 2026-06-27 · ticket-002 UI design-system foundation

The web UI is now the Clinical Bright Lab look — light paper bg, lab-teal/bio-green
accents, semantic design tokens, all 5 views swept off the old dark zinc theme.
Battle is still top/bottom with emoji portraits (that's ticket-003 specimen cards +
ticket-004 left↔right face-off, coming next). Have a look when convenient; feedback
on the palette/feel via `/capture-feedback`.

### [SHIPPED] 2026-06-27 · ticket-001 World 1 difficulty pass

World 1 was a walkover (starter squad beat the boss ~94%). Buffed Goob-family
attack ×1.9; sim now hits all balance targets (mini-boss reach 69%, boss kill 7.5%)
and avg run depth dropped from ~25 to ~6 encounters.

**Please playtest a couple of runs** and confirm it feels tense rather than just
hitting the numbers — the buffed boss's Crushing Weight can now one-shot a unit, so
that's the main feel risk. Then run `/capture-feedback` (positive → ticket
`verified`; negative → I'll spawn a follow-up). Commit: see git log for ticket-001.
