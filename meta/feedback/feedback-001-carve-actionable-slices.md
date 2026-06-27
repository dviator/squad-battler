---
id: feedback-001-carve-actionable-slices
kind: steering
created: 2026-06-27
ticket:
sentiment:
tags: [pipeline, refine-idea, decomposition, throughput]
---

# Feedback: carve the decided engineering slice out of a needs-input design

## What was said

When refining `design-003-overall-level-design`, Dan locked the structure but the
bulk (themes, bosses, enemy rosters) needed his creative input, so the design went
`needs-input`. I noted in passing that the structural-foundation slice was
independently actionable. Dan: "I like what you did there decomposing the
independent structural task. You should directly create a ticket there so it
immediately becomes actionable work and we should enshrine that behavior."

## Why it matters

A `needs-input` design otherwise blocks **all** progress until a human answers the
creative questions — even the parts that need no creativity. Most game-design
designs are a mix: human-authored content (themes, species, balance feel) **plus**
pure engineering scaffolding (data models, refactors, plumbing, UI structure). The
engineering scaffolding is squarely in Claude's autonomy and is often a hard
dependency for the content anyway. Carving it into a real `todo` ticket keeps the
loop producing value while the human creative input is pending, and front-loads the
foundation the content will later slot into.

## How to apply

When a design is (or is becoming) `needs-input`, before stopping, look for a
**fully-decided, creative-input-free slice** — typically the structural/engineering
foundation. If one exists, write it as its own actionable `todo` ticket (parent =
the design, `depends_on: []`) so `/dev-tick` can pick it up immediately. Keep that
ticket strictly to what needs no human creative decision; leave content-dependent
work blocked on the design's open questions. The design stays `needs-input` for the
creative remainder. See [[policies]] · enshrined in the `refine-idea` skill.
