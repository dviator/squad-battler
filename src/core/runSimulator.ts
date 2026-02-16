import { simulateBattle } from "./battle";
import type { GameState } from "./gameState";
import { addGold, addMaterials, advanceTimeAfterCombat } from "./gameState";
import { applyHealing, isHealingComplete, startHealing } from "./lab";
import { applyConsumableToUnit, generateShop, purchaseItem } from "./shop";
import type { BattleState, ConsumableItem, ShopItem, Species, Unit } from "./types";
import { ItemCategory } from "./types";
import { gainExperience, isAlive } from "./unit";
import type { Campaign, Encounter } from "./world";
import { advanceEncounter, getCurrentEncounter, isCampaignComplete } from "./world";

// Run result (single combat through campaign completion)
export interface RunResult {
  success: boolean;
  combatsCompleted: number;
  goldEarned: number;
  materialsEarned: number;
  levelsCompleted: number;
  worldsCompleted: number;
  finalSquad: Unit[];
  timeElapsed: number;
  reason: "victory" | "defeat" | "campaign_complete";
}

// Combat result
export interface CombatResult {
  victory: boolean;
  survivors: Unit[];
  goldEarned: number;
  materialsEarned: number;
  battleState: BattleState;
}

// Simulate a single combat
export function simulateCombat(playerSquad: Unit[], encounter: Encounter): CombatResult {
  const battleState = simulateBattle(playerSquad, encounter.enemies);

  const victory = battleState.winner === "player";
  const survivors = victory ? battleState.playerUnits.filter(isAlive) : [];

  return {
    victory,
    survivors,
    goldEarned: victory ? encounter.goldReward : 0,
    materialsEarned: victory ? encounter.materialsReward : 0,
    battleState,
  };
}

// Simple AI: Buy health potions for wounded units
export function aiShopDecisions(
  gameState: GameState,
  availableItems: ShopItem[],
  speciesPool: Species[],
): GameState {
  let state = gameState;

  // Find wounded units in squad
  const woundedUnits = state.roster.squad.filter((u) => u.stats.currentHp < u.stats.maxHp * 0.7);

  if (woundedUnits.length === 0) return state;

  // Try to buy health potions
  const healthPotions = availableItems.filter(
    (item) => item.category === ItemCategory.Consumable && item.id.includes("health_potion"),
  );

  for (const unit of woundedUnits) {
    // Find best affordable potion (prefer larger potions)
    const affordablePotion = healthPotions
      .filter((item) => item.cost <= state.currency.gold)
      .sort((a, b) => b.cost - a.cost)[0]; // Get most expensive affordable

    if (affordablePotion) {
      const purchaseResult = purchaseItem(state.currency, affordablePotion);

      if (purchaseResult.success) {
        // Apply potion to unit
        const unitIndex = state.roster.squad.findIndex((u) => u.id === unit.id);
        if (unitIndex !== -1) {
          const species = speciesPool.find((s) => s.id === unit.speciesId)!;
          const result = applyConsumableToUnit(unit, affordablePotion as ConsumableItem, species);
          const newSquad = [...state.roster.squad];
          newSquad[unitIndex] = result.unit;

          state = {
            ...state,
            currency: purchaseResult.newCurrency,
            roster: {
              ...state.roster,
              squad: newSquad,
            },
          };
        }
      }
    }
  }

  return state;
}

// Simple AI: Heal wounded units in stable
export function aiLabDecisions(gameState: GameState): GameState {
  const state = gameState;

  // Find wounded units in stable that aren't already healing
  const woundedInStable = state.roster.stable.filter(
    (u) =>
      u.stats.currentHp < u.stats.maxHp && !state.roster.healing.some((h) => h.unitId === u.id),
  );

  // Start healing for up to 5 units (healing station capacity)
  const maxHealingSlots = 5;
  const availableSlots = maxHealingSlots - state.roster.healing.length;

  const toHeal = woundedInStable.slice(0, availableSlots);

  const newHealingSlots = toHeal.map((unit) => startHealing(unit, 100));

  return {
    ...state,
    roster: {
      ...state.roster,
      healing: [...state.roster.healing, ...newHealingSlots],
    },
  };
}

// Complete healing for finished units
export function completeHealing(gameState: GameState): GameState {
  const completedHealing = gameState.roster.healing.filter(isHealingComplete);
  const ongoingHealing = gameState.roster.healing.filter((slot) => !isHealingComplete(slot));

  if (completedHealing.length === 0) {
    return gameState;
  }

  // Apply healing to units in stable
  const newStable = gameState.roster.stable.map((unit) => {
    const healingSlot = completedHealing.find((slot) => slot.unitId === unit.id);
    if (healingSlot) {
      return applyHealing(unit);
    }
    return unit;
  });

  return {
    ...gameState,
    roster: {
      ...gameState.roster,
      stable: newStable,
      healing: ongoingHealing,
    },
  };
}

// Simulate a full run through the campaign
export function simulateRun(
  initialGameState: GameState,
  campaign: Campaign,
  speciesPool: Species[],
): RunResult {
  let gameState = initialGameState;
  let currentCampaign = campaign;
  let combatsCompleted = 0;
  let goldEarned = 0;
  let materialsEarned = 0;
  let levelsCompleted = 0;
  let worldsCompleted = 0;

  // Run until campaign complete or defeat
  while (!isCampaignComplete(currentCampaign)) {
    const encounter = getCurrentEncounter(currentCampaign);

    if (!encounter) {
      // No more encounters
      break;
    }

    // Shop phase before combat
    const shop = generateShop(combatsCompleted);
    gameState = aiShopDecisions(gameState, shop, speciesPool);

    // Combat phase
    const combatResult = simulateCombat(gameState.roster.squad, encounter);

    if (!combatResult.victory) {
      // Run failed
      return {
        success: false,
        combatsCompleted,
        goldEarned,
        materialsEarned,
        levelsCompleted,
        worldsCompleted,
        finalSquad: gameState.roster.squad,
        timeElapsed: gameState.timeElapsed,
        reason: "defeat",
      };
    }

    // Victory! Update state
    combatsCompleted++;
    goldEarned += combatResult.goldEarned;
    materialsEarned += combatResult.materialsEarned;

    // Award XP to survivors (50 XP per combat)
    const experiencedSquad = combatResult.survivors.map((unit) => gainExperience(unit, 50));

    // Update game state
    gameState = {
      ...gameState,
      roster: {
        ...gameState.roster,
        squad: experiencedSquad,
      },
    };

    gameState = addGold(gameState, combatResult.goldEarned);
    gameState = addMaterials(gameState, combatResult.materialsEarned);
    gameState = advanceTimeAfterCombat(gameState);

    // Advance to next encounter
    const advanceResult = advanceEncounter(currentCampaign);
    currentCampaign = advanceResult.campaign;

    if (advanceResult.levelCompleted) {
      levelsCompleted++;

      // Apply level completion rewards
      if (advanceResult.reward) {
        if (advanceResult.reward.gold) {
          gameState = addGold(gameState, advanceResult.reward.gold);
          goldEarned += advanceResult.reward.gold;
        }
        if (advanceResult.reward.materials) {
          gameState = addMaterials(gameState, advanceResult.reward.materials);
          materialsEarned += advanceResult.reward.materials;
        }
      }
    }

    if (advanceResult.worldCompleted) {
      worldsCompleted++;

      // Lab phase between worlds
      gameState = aiLabDecisions(gameState);
      gameState = completeHealing(gameState);
    }
  }

  // Campaign complete!
  return {
    success: true,
    combatsCompleted,
    goldEarned,
    materialsEarned,
    levelsCompleted,
    worldsCompleted,
    finalSquad: gameState.roster.squad,
    timeElapsed: gameState.timeElapsed,
    reason: "campaign_complete",
  };
}

// Run metrics for analysis
export interface RunMetrics {
  totalRuns: number;
  successfulRuns: number;
  averageCombatsCompleted: number;
  averageGoldEarned: number;
  averageLevelsCompleted: number;
  averageTimeElapsed: number;
  maxCombatsCompleted: number;
  failureReasons: Record<string, number>;
}

// Simulate multiple runs and collect metrics
export function simulateMultipleRuns(
  runCount: number,
  createInitialState: () => GameState,
  createCampaign: () => Campaign,
  speciesPool: Species[],
): RunMetrics {
  const results: RunResult[] = [];

  for (let i = 0; i < runCount; i++) {
    const result = simulateRun(createInitialState(), createCampaign(), speciesPool);
    results.push(result);
  }

  const successfulRuns = results.filter((r) => r.success).length;
  const totalCombats = results.reduce((sum, r) => sum + r.combatsCompleted, 0);
  const totalGold = results.reduce((sum, r) => sum + r.goldEarned, 0);
  const totalLevels = results.reduce((sum, r) => sum + r.levelsCompleted, 0);
  const totalTime = results.reduce((sum, r) => sum + r.timeElapsed, 0);
  const maxCombats = Math.max(...results.map((r) => r.combatsCompleted));

  const failureReasons: Record<string, number> = {};
  results.forEach((r) => {
    if (!r.success) {
      failureReasons[r.reason] = (failureReasons[r.reason] || 0) + 1;
    }
  });

  return {
    totalRuns: runCount,
    successfulRuns,
    averageCombatsCompleted: totalCombats / runCount,
    averageGoldEarned: totalGold / runCount,
    averageLevelsCompleted: totalLevels / runCount,
    averageTimeElapsed: totalTime / runCount,
    maxCombatsCompleted: maxCombats,
    failureReasons,
  };
}
