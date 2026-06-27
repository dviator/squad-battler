#!/usr/bin/env bun
/**
 * balance-check — the automated balance half of the `/eval` gate.
 *
 * Drives the real World 1 (Goob) campaign with a fresh starter squad and checks
 * two classes of expectation:
 *
 *   HARD gates  → sanity invariants that must always hold. A failure means the
 *                 game/sim is broken or a change caused a real regression.
 *                 Violations print to stderr and exit non-zero (blocks the gate).
 *
 *   SOFT targets → the aspirational balance ranges from docs/DESIGN_FRAMEWORK.md.
 *                 These drift as the game is still being built, so they only WARN.
 *
 * Tune the constants below; keep HARD gates conservative so routine balance work
 * isn't blocked, while a genuinely broken build (e.g. starter squad can't win the
 * tutorial fight) still fails loudly.
 */

import { createGameState } from "../src/core/gameState";
import { simulateRun } from "../src/core/runSimulator";
import { Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { createGoobCampaign } from "../src/core/world";
import { GOOB, HEAVY_GOOB, MEGA_GOOB } from "../src/data/enemies";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

const RUNS = Number(process.argv.find((a) => a.startsWith("--runs="))?.split("=")[1] ?? 300);

// World 1 checkpoints (see src/core/world.ts createWorld1Goobs):
// encounters 1-10, mini-boss = enc 6, boss = enc 10. `combatsCompleted` counts
// cleared encounters, so reaching enc N means combatsCompleted >= N-1.
const MINIBOSS_ENC = 6;
const BOSS_ENC = 10;

function freshSquad() {
  return [
    createUnit(BEAR, Position.Left),
    createUnit(EAGLE, Position.Center),
    createUnit(TIGER, Position.Right),
  ];
}

const speciesPool = [BEAR, EAGLE, TIGER];

interface Tally {
  runs: number;
  clearedEnc1: number;
  reachedMiniBoss: number;
  defeatedMiniBoss: number;
  reachedBoss: number;
  defeatedBoss: number;
  totalCombats: number;
}

function runSims(): Tally {
  const t: Tally = {
    runs: RUNS,
    clearedEnc1: 0,
    reachedMiniBoss: 0,
    defeatedMiniBoss: 0,
    reachedBoss: 0,
    defeatedBoss: 0,
    totalCombats: 0,
  };

  for (let i = 0; i < RUNS; i++) {
    const state = createGameState(freshSquad(), []);
    const campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, speciesPool);
    const result = simulateRun(state, campaign, speciesPool);
    const cleared = result.combatsCompleted;

    if (!Number.isFinite(cleared)) {
      throw new Error(`simulateRun returned non-finite combatsCompleted on run ${i}`);
    }

    t.totalCombats += cleared;
    if (cleared >= 1) t.clearedEnc1++;
    if (cleared >= MINIBOSS_ENC - 1) t.reachedMiniBoss++;
    if (cleared >= MINIBOSS_ENC) t.defeatedMiniBoss++;
    if (cleared >= BOSS_ENC - 1) t.reachedBoss++;
    if (cleared >= BOSS_ENC) t.defeatedBoss++;
  }

  return t;
}

const pct = (n: number) => (n / RUNS) * 100;
const fmt = (n: number) => `${pct(n).toFixed(1)}%`;

interface Check {
  label: string;
  value: number; // percentage
  pass: boolean;
  detail: string;
}

function hard(label: string, valuePct: number, pass: boolean, detail: string): Check {
  return { label, value: valuePct, pass, detail };
}

function soft(label: string, valuePct: number, min: number, max: number): Check {
  const pass = valuePct >= min && valuePct <= max;
  const arrow = valuePct < min ? "⬇ below" : valuePct > max ? "⬆ above" : "in";
  return { label, value: valuePct, pass, detail: `target ${min}-${max}% (${arrow} range)` };
}

function main() {
  const t = runSims();
  const avgCombats = t.totalCombats / RUNS;

  // ── HARD gates: "the build/sim isn't broken" invariants only. Difficulty
  // tuning lives in SOFT so a pre-existing imbalance never blocks unrelated work. ──
  const hardChecks: Check[] = [
    hard(
      "Starter squad clears Encounter 1",
      pct(t.clearedEnc1),
      pct(t.clearedEnc1) >= 90,
      ">= 90% (tutorial must be winnable — combat not broken)",
    ),
    hard(
      "Squad makes progress (reaches mini-boss)",
      pct(t.reachedMiniBoss),
      t.reachedMiniBoss > 0,
      "> 0% (early game not impossible)",
    ),
  ];

  // ── SOFT targets: docs/DESIGN_FRAMEWORK.md balance ranges (advisory). Once a
  // rebalance brings these into range they become meaningful regression detectors. ──
  const softChecks: Check[] = [
    soft("Mini-boss reach rate", pct(t.reachedMiniBoss), 40, 70),
    soft("Mini-boss defeat rate", pct(t.defeatedMiniBoss), 20, 40),
    soft("Boss reach rate", pct(t.reachedBoss), 10, 30),
    soft("Boss defeat rate", pct(t.defeatedBoss), 5, 15),
  ];

  console.log("=".repeat(64));
  console.log(`  BALANCE CHECK — ${RUNS} runs, World 1 (Goob), starter squad`);
  console.log("=".repeat(64));
  console.log(
    `  Cleared:  enc1 ${fmt(t.clearedEnc1)} · mini-boss reach ${fmt(t.reachedMiniBoss)} · ` +
      `boss reach ${fmt(t.reachedBoss)} · boss kill ${fmt(t.defeatedBoss)}`,
  );
  console.log(`  Avg encounters cleared per run: ${avgCombats.toFixed(2)}`);

  console.log("\n  HARD gates (block on failure):");
  for (const c of hardChecks) {
    console.log(`    ${c.pass ? "✓" : "✗"} ${c.label}: ${c.value.toFixed(1)}%  [${c.detail}]`);
  }

  console.log("\n  SOFT targets (advisory — design goals):");
  for (const c of softChecks) {
    console.log(`    ${c.pass ? "✓" : "⚠"} ${c.label}: ${c.value.toFixed(1)}%  [${c.detail}]`);
  }

  const softMisses = softChecks.filter((c) => !c.pass).length;
  if (softMisses > 0) {
    console.log(`\n  ⚠ ${softMisses} soft target(s) outside design range (advisory only).`);
  }

  const hardFails = hardChecks.filter((c) => !c.pass);
  console.log("=".repeat(64));
  if (hardFails.length > 0) {
    console.error(`BALANCE CHECK FAILED — ${hardFails.length} hard gate(s):`);
    for (const c of hardFails)
      console.error(`  ✗ ${c.label} = ${c.value.toFixed(1)}% (${c.detail})`);
    process.exit(1);
  }
  console.log("BALANCE CHECK PASSED (hard gates).");
}

main();
