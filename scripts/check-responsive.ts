#!/usr/bin/env bun
/**
 * Responsive-layout guard. Scans the web layer for class patterns that break
 * mobile rendering, per docs/MOBILE_STANDARDS.md. Exits non-zero on any
 * violation so it can gate commits (see .claude/hooks/pre-commit-check.sh).
 *
 * Checks:
 *  1. Bare (unprefixed) `grid-cols-N` with N >= 3 — the mobile/base column
 *     count must be <= 2, then scale up with a `md:`/`lg:` prefix.
 *  2. Fixed pixel widths `w-[..px]` / `min-w-[..px]` / `max-w-[..px]` — use
 *     relative/responsive sizing instead.
 *
 * Intentional, reviewed exceptions live in ALLOWLIST below.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const WEB_DIR = join(import.meta.dir, "..", "src", "web");
const ROOT = join(import.meta.dir, "..");

/** Reviewed exceptions: a violation is skipped if its file path ends with
 *  `file` and the offending line contains `pattern`. Keep each justified. */
const ALLOWLIST: { file: string; pattern: string; reason: string }[] = [
  {
    file: "views/MainMenuView.tsx",
    pattern: "grid-cols-3",
    reason: "decorative 3-feature teaser row — short labels, not dense cards",
  },
  {
    file: "components/UnitCard.tsx",
    pattern: "grid-cols-3",
    reason: "tiny SPD/ATK/STAGE stat chips inside an already-reflowed card",
  },
];

const BARE_GRID = /(?:^|[^:\w])grid-cols-(\d+)/g;
const FIXED_PX_WIDTH = /\b(?:min-w|max-w|w)-\[[^\]]*px\]/;

interface Violation {
  file: string;
  line: number;
  text: string;
  rule: string;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

function isAllowed(file: string, lineText: string): boolean {
  return ALLOWLIST.some((a) => file.endsWith(a.file) && lineText.includes(a.pattern));
}

const violations: Violation[] = [];

for (const file of walk(WEB_DIR)) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((text, i) => {
    if (isAllowed(file, text)) return;

    BARE_GRID.lastIndex = 0;
    for (let m = BARE_GRID.exec(text); m; m = BARE_GRID.exec(text)) {
      if (Number(m[1]) >= 3) {
        violations.push({
          file: rel,
          line: i + 1,
          text: text.trim(),
          rule: "bare grid-cols-3+ (base column count must be <=2; scale up with md:/lg:)",
        });
      }
    }

    if (FIXED_PX_WIDTH.test(text)) {
      violations.push({
        file: rel,
        line: i + 1,
        text: text.trim(),
        rule: "fixed pixel width (use relative/responsive sizing)",
      });
    }
  });
}

if (violations.length === 0) {
  console.log("✓ responsive check passed — no mobile-layout anti-patterns");
  process.exit(0);
}

console.error(`✗ responsive check failed — ${violations.length} violation(s):\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  ${v.rule}`);
  console.error(`    ${v.text}\n`);
}
console.error("See docs/MOBILE_STANDARDS.md. Fix, or add a justified ALLOWLIST entry.");
process.exit(1);
