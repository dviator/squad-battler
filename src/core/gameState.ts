import type { Roster } from "./lab";
import { advanceBreeding, advanceHealing } from "./lab";
import type { Currency, Unit } from "./types";
import { ageUnit } from "./unit";

// Persisted between runs (saved to disk)
export interface SaveData {
  scrapTech: number;
  scannerCapacity: number; // 0 = locked, 1–8 = unlocked at that capacity
  stable: Unit[];
  unlockedSpecies: string[];
  unlockedStations: string[];
  progress: {
    worldsCompleted: number;
    encountersCompleted: number;
  };
}

// Game State tracks the player's progress
export interface GameState {
  roster: Roster;
  currency: Currency;
  timeElapsed: number; // in days
  scrapTech: number; // Meta-currency for lab upgrades, persists between runs
  scannerCapacity: number; // 0 = locked, 1–8 = scans available per lab visit
  unlockedSpecies: string[];
  unlockedStations: string[];
  completedWorlds: number;
  progress: {
    worldsCompleted: number;
    encountersCompleted: number;
  };
}

export const SCANNER_MAX_CAPACITY = 8;
// Cost to upgrade from capacity N to N+1; index = current capacity - 1
export const SCANNER_UPGRADE_COSTS = [15, 30, 50, 75, 105, 140, 180] as const;

export function getScannerUpgradeCost(currentCapacity: number): number | null {
  if (currentCapacity <= 0 || currentCapacity >= SCANNER_MAX_CAPACITY) return null;
  return SCANNER_UPGRADE_COSTS[currentCapacity - 1] ?? null;
}

// Time progression constants
export const HOURS_PER_COMBAT = 1;
export const HOURS_PER_DAY = 24;
export const COMBATS_PER_DAY = HOURS_PER_DAY / HOURS_PER_COMBAT;

// Initialize a new game
export function createGameState(
  initialSquad: Unit[],
  initialStable: Unit[],
  startingSpecies: string[] = ["bear", "eagle", "tiger"],
): GameState {
  return {
    roster: {
      squad: initialSquad,
      stable: initialStable,
      healing: [],
      breeding: [],
    },
    currency: {
      gold: 0,
      materials: 0,
    },
    timeElapsed: 0,
    scrapTech: 0,
    scannerCapacity: 0,
    unlockedSpecies: startingSpecies,
    unlockedStations: ["healing", "recruiting"],
    completedWorlds: 0,
    progress: {
      worldsCompleted: 0,
      encountersCompleted: 0,
    },
  };
}

// Advance time by a number of days
export function advanceTime(state: GameState, days: number): GameState {
  const newTimeElapsed = state.timeElapsed + days;

  // Age all units in squad and stable
  const agedSquad = state.roster.squad.map((unit) => ageUnit(unit, days));
  const agedStable = state.roster.stable.map((unit) => ageUnit(unit, days));

  // Advance healing slots
  const advancedHealing = state.roster.healing.map((slot) => advanceHealing(slot, days));

  // Advance breeding slots
  const advancedBreeding = state.roster.breeding.map((slot) => advanceBreeding(slot, days));

  return {
    ...state,
    timeElapsed: newTimeElapsed,
    roster: {
      ...state.roster,
      squad: agedSquad,
      stable: agedStable,
      healing: advancedHealing,
      breeding: advancedBreeding,
    },
  };
}

// Advance time after a combat (1 hour = 1/24 day)
export function advanceTimeAfterCombat(state: GameState): GameState {
  return advanceTime(state, HOURS_PER_COMBAT / HOURS_PER_DAY);
}

// Add gold to player's currency
export function addGold(state: GameState, amount: number): GameState {
  return {
    ...state,
    currency: {
      ...state.currency,
      gold: state.currency.gold + amount,
    },
  };
}

// Add materials to player's currency
export function addMaterials(state: GameState, amount: number): GameState {
  return {
    ...state,
    currency: {
      ...state.currency,
      materials: state.currency.materials + amount,
    },
  };
}

// Spend currency
export function spendCurrency(
  state: GameState,
  gold: number = 0,
  materials: number = 0,
): { success: boolean; newState: GameState; error?: string } {
  if (state.currency.gold < gold) {
    return { success: false, newState: state, error: "Not enough gold" };
  }

  if (state.currency.materials < materials) {
    return { success: false, newState: state, error: "Not enough materials" };
  }

  return {
    success: true,
    newState: {
      ...state,
      currency: {
        gold: state.currency.gold - gold,
        materials: state.currency.materials - materials,
      },
    },
  };
}

// Unlock a new species
export function unlockSpecies(state: GameState, speciesId: string): GameState {
  if (state.unlockedSpecies.includes(speciesId)) {
    return state;
  }

  return {
    ...state,
    unlockedSpecies: [...state.unlockedSpecies, speciesId],
  };
}

// Unlock a new station
export function unlockStation(state: GameState, stationId: string): GameState {
  if (state.unlockedStations.includes(stationId)) {
    return state;
  }

  return {
    ...state,
    unlockedStations: [...state.unlockedStations, stationId],
  };
}

// Complete a world
export function completeWorld(state: GameState): GameState {
  return {
    ...state,
    completedWorlds: state.completedWorlds + 1,
  };
}

// Add scrap tech (meta-currency for lab upgrades)
export function addScrapTech(state: GameState, amount: number): GameState {
  return { ...state, scrapTech: state.scrapTech + amount };
}

// Spend scrap tech
export function spendScrapTech(
  state: GameState,
  amount: number,
): { success: boolean; newState: GameState; error?: string } {
  if (state.scrapTech < amount) {
    return { success: false, newState: state, error: "Not enough scrap tech" };
  }
  return { success: true, newState: { ...state, scrapTech: state.scrapTech - amount } };
}

// Unlock the genetic scanner at capacity 1 (triggered by first boss kill)
export function unlockScanner(state: GameState): GameState {
  if (state.scannerCapacity > 0) return state;
  return { ...state, scannerCapacity: 1 };
}

// Upgrade scanner capacity by 1 tier (costs scrap tech)
export function upgradeScanner(state: GameState): {
  success: boolean;
  newState: GameState;
  error?: string;
} {
  const cost = getScannerUpgradeCost(state.scannerCapacity);
  if (cost === null) {
    return { success: false, newState: state, error: "Scanner already at maximum capacity" };
  }
  const spendResult = spendScrapTech(state, cost);
  if (!spendResult.success) return { success: false, newState: state, error: spendResult.error };
  return {
    success: true,
    newState: { ...spendResult.newState, scannerCapacity: state.scannerCapacity + 1 },
  };
}

// Get all living units (squad + stable, excluding dead units)
export function getLivingUnits(state: GameState): Unit[] {
  const allUnits = [...state.roster.squad, ...state.roster.stable];
  return allUnits.filter((unit) => unit.lifeStage !== "dead");
}

// Get units currently in healing
export function getHealingUnits(
  state: GameState,
): Array<{ unitId: string; daysRemaining: number }> {
  return state.roster.healing.map((slot) => ({
    unitId: slot.unitId,
    daysRemaining: slot.daysRemaining,
  }));
}

// Get units currently breeding
export function getBreedingPairs(
  state: GameState,
): Array<{ parent1Id: string; parent2Id: string; daysRemaining: number }> {
  return state.roster.breeding.map((slot) => ({
    parent1Id: slot.parent1Id,
    parent2Id: slot.parent2Id,
    daysRemaining: slot.daysRemaining,
  }));
}
