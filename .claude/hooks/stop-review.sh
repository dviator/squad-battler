#!/bin/bash
# Injects a reminder into Claude's context when it finishes responding.
# This doesn't block — it adds feedback that Claude sees on its next turn.

cat <<'EOF'
Before finishing, verify:
- No unnecessary complexity (premature abstractions, deep nesting)
- Three-layer architecture respected (core/data/sim)
- No trivial comments that restate the code
- Enums used where they exist (Position, TargetType, BattleEventType)
- Web changes follow docs/MOBILE_STANDARDS.md: mobile-first grids
  (grid-cols-2 md:grid-cols-3), min-w-0+truncate on flex text rows, no
  fixed px widths — checked at ~360px and desktop
EOF

exit 0
