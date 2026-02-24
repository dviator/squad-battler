#!/usr/bin/env bun

import { simulateBattle } from "../src/core/battle";
import { applyConsumableToUnit } from "../src/core/shop";
import type { ConsumableItem, Unit } from "../src/core/types";
import { ConsumableEffect, ItemCategory, Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { GOOB, HEAVY_GOOB, MEGA_GOOB } from "../src/data/enemies";
import { BEAR, EAGLE, TIGER, WOLF } from "../src/data/species";

const SIMULATIONS = 500;

// ─── Shop items available during a run ───────────────────────────────────────

const HEALTH_POTION_SMALL: ConsumableItem = {
  id: "health_potion_small",
  name: "Minor Healing Vial",
  description: "Restores 20 HP",
  category: ItemCategory.Consumable,
  cost: 3,
  effect: { type: ConsumableEffect.HealHealth, amount: 20 },
};

const HEALTH_POTION_MEDIUM: ConsumableItem = {
  id: "health_potion_medium",
  name: "Healing Elixir",
  description: "Restores 60 HP",
  category: ItemCategory.Consumable,
  cost: 6,
  effect: { type: ConsumableEffect.HealHealth, amount: 60 },
};

const HEALTH_POTION_LARGE: ConsumableItem = {
  id: "health_potion_large",
  name: "Greater Restorative",
  description: "Restores 120 HP",
  category: ItemCategory.Consumable,
  cost: 10,
  effect: { type: ConsumableEffect.HealHealth, amount: 120 },
};

const HASTE_SERUM: ConsumableItem = {
  id: "haste_serum",
  name: "Haste Serum",
  description: "Reduces cooldowns by 1",
  category: ItemCategory.Consumable,
  cost: 8,
  effect: { type: ConsumableEffect.ReduceCooldowns, amount: 1, duration: "permanent" },
};

const FEROCITY_ENHANCEMENT: ConsumableItem = {
  id: "ferocity_enhancement",
  name: "Ferocity Enhancement",
  description: "+15 Attack Power",
  category: ItemCategory.Consumable,
  cost: 12,
  effect: {
    type: ConsumableEffect.BoostStats,
    stats: { attackPower: 15 },
    duration: "permanent",
  },
};

const RESILIENCE_ENHANCEMENT: ConsumableItem = {
  id: "resilience_enhancement",
  name: "Resilience Enhancement",
  description: "+30 Max HP",
  category: ItemCategory.Consumable,
  cost: 12,
  effect: { type: ConsumableEffect.BoostStats, stats: { maxHp: 30 }, duration: "permanent" },
};

// ─── Encounter definitions matching World 1 in world.ts ──────────────────────

type EncounterDef = {
  id: number;
  type: "regular" | "elite" | "miniboss" | "boss";
  enemies: () => Unit[];
  goldReward: number;
};

// Boss variant (Alpha Goob) — matches world.ts bossSpecies multipliers
const ALPHA_GOOB_STATS = {
  maxHp: Math.floor(MEGA_GOOB.baseStats.maxHp * 1.6),
  speed: MEGA_GOOB.baseStats.speed,
  attackPower: Math.floor(MEGA_GOOB.baseStats.attackPower * 1.4),
};

const ENCOUNTERS: EncounterDef[] = [
  {
    id: 1,
    type: "regular",
    enemies: () => [createUnit(GOOB, Position.Left), createUnit(GOOB, Position.Right)],
    goldReward: 5,
  },
  {
    id: 2,
    type: "regular",
    enemies: () => [createUnit(GOOB, Position.Left), createUnit(GOOB, Position.Right)],
    goldReward: 5,
  },
  {
    id: 3,
    type: "regular",
    enemies: () => [createUnit(GOOB, Position.Left), createUnit(GOOB, Position.Center)],
    goldReward: 5,
  },
  {
    id: 4,
    type: "elite",
    enemies: () => [
      createUnit(GOOB, Position.Left),
      createUnit(HEAVY_GOOB, Position.Center),
      createUnit(GOOB, Position.Right),
    ],
    goldReward: 10,
  },
  {
    id: 5,
    type: "regular",
    enemies: () => [createUnit(GOOB, Position.Left), createUnit(GOOB, Position.Right)],
    goldReward: 5,
  },
  {
    id: 6,
    type: "miniboss",
    enemies: () => [createUnit(MEGA_GOOB, Position.Center)],
    goldReward: 15,
  },
  {
    id: 7,
    type: "regular",
    enemies: () => [createUnit(HEAVY_GOOB, Position.Left), createUnit(HEAVY_GOOB, Position.Right)],
    goldReward: 6,
  },
  {
    id: 8,
    type: "regular",
    enemies: () => [
      createUnit(GOOB, Position.Left),
      createUnit(GOOB, Position.Center),
      createUnit(GOOB, Position.Right),
    ],
    goldReward: 5,
  },
  {
    id: 9,
    type: "elite",
    enemies: () => [
      createUnit(GOOB, Position.Left),
      createUnit(HEAVY_GOOB, Position.Center),
      createUnit(GOOB, Position.Right),
    ],
    goldReward: 10,
  },
  {
    id: 10,
    type: "boss",
    enemies: () => {
      const boss = createUnit(MEGA_GOOB, Position.Center);
      return [
        {
          ...boss,
          speciesId: "mega_goob_boss",
          stats: {
            ...boss.stats,
            maxHp: ALPHA_GOOB_STATS.maxHp,
            currentHp: ALPHA_GOOB_STATS.maxHp,
            speed: ALPHA_GOOB_STATS.speed,
            attackPower: ALPHA_GOOB_STATS.attackPower,
          },
        },
      ];
    },
    goldReward: 30,
  },
];

// ─── Strategy helpers ─────────────────────────────────────────────────────────

const SPECIES = [BEAR, EAGLE, TIGER, WOLF] as const;

function healSquad(
  squad: Unit[],
  gold: number,
  threshold: number,
): { squad: Unit[]; gold: number } {
  for (let i = 0; i < squad.length; i++) {
    const unit = squad[i]!;
    const missing = unit.stats.maxHp - unit.stats.currentHp;
    const hpPct = unit.stats.currentHp / unit.stats.maxHp;
    if (hpPct >= threshold) continue;

    if (missing > 90 && gold >= 10) {
      squad[i] = applyConsumableToUnit(unit, HEALTH_POTION_LARGE, SPECIES[i]!).unit;
      gold -= 10;
    } else if (missing > 40 && gold >= 6) {
      squad[i] = applyConsumableToUnit(unit, HEALTH_POTION_MEDIUM, SPECIES[i]!).unit;
      gold -= 6;
    } else if (missing > 15 && gold >= 3) {
      squad[i] = applyConsumableToUnit(unit, HEALTH_POTION_SMALL, SPECIES[i]!).unit;
      gold -= 3;
    }
  }
  return { squad, gold };
}

function applyHaste(unit: Unit, speciesIdx: number, gold: number): { unit: Unit; gold: number } {
  if (gold >= 8) {
    return {
      unit: applyConsumableToUnit(unit, HASTE_SERUM, SPECIES[speciesIdx]!).unit,
      gold: gold - 8,
    };
  }
  return { unit, gold };
}

// ─── Run simulation ───────────────────────────────────────────────────────────

interface RunResult {
  reachedElite: number; // Enc 4
  reachedMiniBoss: number; // Enc 6
  defeatedMiniBoss: number;
  reachedBoss: number; // Enc 10
  defeatedBoss: number;
  totalGoldSpent: number;
  hpAtMiniBoss: number; // Total HP remaining when entering enc 6
  hpAtMiniBossTotal: number; // Total max HP at that point
}

function simulateRun(
  strategy: "no_items" | "healing_only" | "haste_focus" | "balanced" | "whale",
): RunResult {
  const result: RunResult = {
    reachedElite: 0,
    reachedMiniBoss: 0,
    defeatedMiniBoss: 0,
    reachedBoss: 0,
    defeatedBoss: 0,
    totalGoldSpent: 0,
    hpAtMiniBoss: 0,
    hpAtMiniBossTotal: 0,
  };

  for (let sim = 0; sim < SIMULATIONS; sim++) {
    let squad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];

    let gold = 10;
    let miniBossDefeated = false;

    // ── Upfront investments (before enc 1) ──
    switch (strategy) {
      case "haste_focus":
        // Haste one unit
        if (gold >= 8) {
          const r = applyHaste(squad[0]!, 0, gold);
          squad[0] = r.unit;
          gold = r.gold;
          result.totalGoldSpent += 8;
        }
        break;
      case "whale":
        // Haste Tiger (fastest attacker) and one stat boost
        if (gold >= 8) {
          const r = applyHaste(squad[2]!, 2, gold);
          squad[2] = r.unit;
          gold = r.gold;
          result.totalGoldSpent += 8;
        }
        break;
    }

    let alive = true;

    for (const enc of ENCOUNTERS) {
      if (!alive) break;

      // ── Pre-battle shop ──
      const goldBefore = gold;
      switch (strategy) {
        case "healing_only": {
          // Conservative: only heal when below 50% HP (reactive, not proactive)
          const r = healSquad([...squad], gold, 0.5);
          squad = r.squad;
          gold = r.gold;
          break;
        }
        case "balanced": {
          // Haste Tiger on enc 3 if we have gold
          if (enc.id === 3 && gold >= 8) {
            const r = applyHaste(squad[2]!, 2, gold);
            squad[2] = r.unit;
            gold = r.gold;
          }
          // Heal before elite/mini-boss/boss encounters when below 60%
          if (enc.type === "elite" || enc.type === "miniboss" || enc.type === "boss") {
            const r = healSquad([...squad], gold, 0.6);
            squad = r.squad;
            gold = r.gold;
          }
          break;
        }
        case "haste_focus": {
          // Apply haste to more units when gold allows
          if (enc.id === 4 && gold >= 8) {
            const r = applyHaste(squad[1]!, 1, gold);
            squad[1] = r.unit;
            gold = r.gold;
          }
          if (enc.id === 7 && gold >= 8) {
            const r = applyHaste(squad[2]!, 2, gold);
            squad[2] = r.unit;
            gold = r.gold;
          }
          break;
        }
        case "whale": {
          // Heal aggressively before elite/boss encounters
          if (enc.type === "elite" || enc.type === "miniboss" || enc.type === "boss") {
            const r = healSquad([...squad], gold, 0.9);
            squad = r.squad;
            gold = r.gold;
          }
          // Buy stat boosts when flush with gold
          if (enc.id === 7 && gold >= 12) {
            squad[0] = applyConsumableToUnit(squad[0]!, FEROCITY_ENHANCEMENT, BEAR).unit;
            gold -= 12;
          }
          if (enc.id === 8 && gold >= 12) {
            squad[1] = applyConsumableToUnit(squad[1]!, RESILIENCE_ENHANCEMENT, EAGLE).unit;
            gold -= 12;
          }
          break;
        }
      }
      result.totalGoldSpent += goldBefore - gold;

      // ── Checkpoint tracking ──
      if (enc.id === 4) result.reachedElite++;
      if (enc.id === 6) {
        result.reachedMiniBoss++;
        result.hpAtMiniBoss += squad.reduce((s, u) => s + u.stats.currentHp, 0);
        result.hpAtMiniBossTotal += squad.reduce((s, u) => s + u.stats.maxHp, 0);
      }
      if (enc.id === 10) result.reachedBoss++;

      // ── Run battle ──
      const battle = simulateBattle(
        squad.map((u) => ({ ...u, stats: { ...u.stats } })),
        enc.enemies(),
        300,
      );

      if (battle.winner !== "player") {
        alive = false;
        break;
      }

      // ── Post-battle ──
      squad = battle.playerUnits;
      gold += enc.goldReward;

      if (enc.id === 6) miniBossDefeated = true;
      if (enc.id === 6 && battle.winner === "player") result.defeatedMiniBoss++;
      if (enc.id === 10 && battle.winner === "player") result.defeatedBoss++;
    }
  }

  return result;
}

// ─── Report ───────────────────────────────────────────────────────────────────

console.log("=".repeat(70));
console.log("              FULL RUN SIMULATION — 10 ENCOUNTERS");
console.log("=".repeat(70));
console.log(`Running ${SIMULATIONS} full runs per strategy...\n`);
console.log("Encounter map:");
console.log("  1-3: Regular (2× Goob)");
console.log("  4:   Elite   (2× Goob + 1× Heavy Goob)");
console.log("  5:   Regular (2× Goob)");
console.log("  6:   MINI-BOSS (Mega Goob)");
console.log("  7:   Regular (2× Heavy Goob)");
console.log("  8:   Regular (3× Goob)");
console.log("  9:   Elite   (2× Goob + 1× Heavy Goob)");
console.log("  10:  BOSS    (Alpha Goob)\n");

const strategies = [
  { name: "No Items", key: "no_items" as const },
  { name: "Healing Only", key: "healing_only" as const },
  { name: "Haste Focus", key: "haste_focus" as const },
  { name: "Balanced", key: "balanced" as const },
  { name: "Whale (All Items)", key: "whale" as const },
];

const results = strategies.map((strat) => ({
  strategy: strat.name,
  result: simulateRun(strat.key),
}));

// Targets from docs/systems/world-progression.md
const TARGETS = {
  reachMiniBoss: { min: 40, max: 70 },
  defeatMiniBoss: { min: 20, max: 40 },
  reachBoss: { min: 10, max: 30 },
  defeatBoss: { min: 5, max: 15 },
};

function pct(n: number): string {
  return ((n / SIMULATIONS) * 100).toFixed(1) + "%";
}

function inRange(n: number, min: number, max: number): string {
  const p = (n / SIMULATIONS) * 100;
  if (p < min) return `⬇ LOW`;
  if (p > max) return `⬆ HIGH`;
  return `✓`;
}

for (const { strategy, result } of results) {
  const avgHpPct =
    result.reachedMiniBoss > 0
      ? ((result.hpAtMiniBoss / result.hpAtMiniBossTotal) * 100).toFixed(0)
      : "N/A";

  console.log(`\n📊 ${strategy.toUpperCase()}`);
  console.log(`  Reach Elite (enc 4):    ${pct(result.reachedElite)}`);
  console.log(
    `  Reach Mini-Boss (enc 6): ${pct(result.reachedMiniBoss)}  target: ${TARGETS.reachMiniBoss.min}-${TARGETS.reachMiniBoss.max}%  ${inRange(result.reachedMiniBoss, TARGETS.reachMiniBoss.min, TARGETS.reachMiniBoss.max)}`,
  );
  console.log(
    `  Defeat Mini-Boss:        ${pct(result.defeatedMiniBoss)}  target: ${TARGETS.defeatMiniBoss.min}-${TARGETS.defeatMiniBoss.max}%  ${inRange(result.defeatedMiniBoss, TARGETS.defeatMiniBoss.min, TARGETS.defeatMiniBoss.max)}`,
  );
  console.log(
    `  Reach Boss (enc 10):     ${pct(result.reachedBoss)}   target: ${TARGETS.reachBoss.min}-${TARGETS.reachBoss.max}%  ${inRange(result.reachedBoss, TARGETS.reachBoss.min, TARGETS.reachBoss.max)}`,
  );
  console.log(
    `  Defeat Boss:             ${pct(result.defeatedBoss)}   target: ${TARGETS.defeatBoss.min}-${TARGETS.defeatBoss.max}%  ${inRange(result.defeatedBoss, TARGETS.defeatBoss.min, TARGETS.defeatBoss.max)}`,
  );
  console.log(`  HP at Mini-Boss entry:   ${avgHpPct}% of max  (target: 30-50%)`);
  console.log(`  Avg gold spent:          ${(result.totalGoldSpent / SIMULATIONS).toFixed(1)}g`);
}

// ─── Overall analysis ─────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(70));
console.log("ANALYSIS (no_items baseline):");

const noItems = results.find((r) => r.strategy === "No Items")!.result;
console.log(
  `\n  Mini-boss reach: ${pct(noItems.reachedMiniBoss)}  ${inRange(noItems.reachedMiniBoss, TARGETS.reachMiniBoss.min, TARGETS.reachMiniBoss.max)}`,
);
console.log(
  `  Boss reach:      ${pct(noItems.reachedBoss)}  ${inRange(noItems.reachedBoss, TARGETS.reachBoss.min, TARGETS.reachBoss.max)}`,
);

const whale = results.find((r) => r.strategy === "Whale (All Items)")!.result;
console.log(`\nWhale (best-case) boss defeat rate: ${pct(whale.defeatedBoss)}`);
console.log(`  This represents the ceiling for experienced players with good items.`);

console.log("\n" + "=".repeat(70) + "\n");
