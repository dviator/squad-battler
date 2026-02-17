import { confirm, select } from "@inquirer/prompts";
import { displayCombatLog, displayCombatSummary } from "../cli/combatLog";
import {
  displayBattleSummary,
  displayGameState,
  displayHeader,
  displayRoster,
  displayShopItem,
  displaySquad,
  displayUnit,
} from "../cli/display";
import { simulateBattle } from "../core/battle";
import type { GameState } from "../core/gameState";
import { advanceTimeAfterCombat } from "../core/gameState";
import { applyHealing, isHealingComplete, startHealing } from "../core/lab";
import {
  applyConsumableToUnit,
  applyGeneticModToUnit,
  generateShop,
  purchaseItem,
} from "../core/shop";
import type { ConsumableItem, GeneticModItem, ShopItem, Species, Unit } from "../core/types";
import { ItemCategory } from "../core/types";
import { isAlive } from "../core/unit";
import { type Campaign, getCurrentEncounter } from "../core/world";

// Shop Phase - Interactive shopping
export async function shopPhase(state: GameState, allSpecies: Species[]): Promise<GameState> {
  displayHeader("🛒 Shop");
  displayGameState(state);

  const shop = generateShop(state.progress.encountersCompleted);

  console.log("\n📦 AVAILABLE ITEMS:");
  shop.forEach((item, i) => {
    console.log(`  ${displayShopItem(item, i)}`);
  });

  let currentState = state;
  let shopping = true;

  while (shopping && currentState.currency.gold > 0) {
    const choices = [
      ...shop
        .filter((item) => item.cost <= currentState.currency.gold)
        .map((item, i) => ({
          name: `${item.name} - ${item.cost}g`,
          value: i,
          description: item.description,
        })),
      { name: "Done shopping", value: -1 },
    ];

    if (choices.length === 1) {
      console.log("\n💸 Not enough gold for any items!");
      break;
    }

    const choice = await select({
      message: `What would you like to buy? (${currentState.currency.gold}g available)`,
      choices,
    });

    if (choice === -1) {
      shopping = false;
      break;
    }

    const item = shop[choice];
    if (!item) continue;

    // Purchase the item
    const result = purchaseItem(currentState.currency, item);
    if (!result.success) {
      console.log(`\n❌ ${result.error}`);
      continue;
    }

    currentState = { ...currentState, currency: result.newCurrency };
    console.log(`\n✅ Purchased ${item.name} for ${item.cost}g!`);

    // Apply the item to a unit
    if (item.category === ItemCategory.Consumable) {
      currentState = await applyConsumable(currentState, item as ConsumableItem, allSpecies);
    } else if (item.category === ItemCategory.GeneticMod) {
      currentState = await applyGeneticMod(currentState, item as GeneticModItem, allSpecies);
    } else if (item.category === ItemCategory.Equipment) {
      currentState = await equipItem(currentState, item);
    }

    // Remove purchased item from shop (no duplicates)
    shop.splice(choice, 1);
  }

  return currentState;
}

// Apply consumable to a unit
async function applyConsumable(
  state: GameState,
  item: ConsumableItem,
  allSpecies: Species[],
): Promise<GameState> {
  const allUnits = [...state.roster.squad, ...state.roster.stable];

  console.log("\n👤 Select unit to apply item:");
  allUnits.forEach((unit, i) => {
    console.log(`  ${displayUnit(unit, i)}`);
  });

  const choice = await select({
    message: "Which unit?",
    choices: allUnits.map((unit, i) => ({
      name: displayUnit(unit),
      value: i,
    })),
  });

  const unit = allUnits[choice];
  if (!unit) return state;

  const species = allSpecies.find((s) => s.id === unit.speciesId);
  if (!species) return state;

  const result = applyConsumableToUnit(unit, item, species);

  if (result.permanentMutation) {
    console.log(`\n✨ BONUS! Gained permanent mutation: ${result.permanentMutation}`);
  }

  // Update the unit in the roster
  return updateUnitInRoster(state, unit.id, result.unit);
}

// Apply genetic mod to a unit
async function applyGeneticMod(
  state: GameState,
  item: GeneticModItem,
  allSpecies: Species[],
): Promise<GameState> {
  const allUnits = [...state.roster.squad, ...state.roster.stable];

  console.log("\n👤 Select unit to apply genetic mod:");
  allUnits.forEach((unit, i) => {
    console.log(`  ${displayUnit(unit, i)}`);
  });

  const choice = await select({
    message: "Which unit?",
    choices: allUnits.map((unit, i) => ({
      name: displayUnit(unit),
      value: i,
    })),
  });

  const unit = allUnits[choice];
  if (!unit) return state;

  const species = allSpecies.find((s) => s.id === unit.speciesId);
  if (!species) return state;

  const modifiedUnit = applyGeneticModToUnit(unit, item, species);
  console.log("\n✅ Genetic modification applied!");

  return updateUnitInRoster(state, unit.id, modifiedUnit);
}

// Equip item to a unit
async function equipItem(state: GameState, item: ShopItem): Promise<GameState> {
  const squadUnits = state.roster.squad;

  console.log("\n👤 Select unit to equip item:");
  squadUnits.forEach((unit, i) => {
    console.log(`  ${displayUnit(unit, i)}`);
  });

  const choice = await select({
    message: "Which unit?",
    choices: squadUnits.map((unit, i) => ({
      name: displayUnit(unit),
      value: i,
    })),
  });

  const unit = squadUnits[choice];
  if (!unit) return state;

  const equippedUnit = {
    ...unit,
    equipment: [...unit.equipment, item.id],
  };

  console.log(`\n✅ ${item.name} equipped to ${unit.speciesId}!`);

  return updateUnitInRoster(state, unit.id, equippedUnit);
}

// Helper to update a unit in the roster
function updateUnitInRoster(state: GameState, unitId: string, newUnit: Unit): GameState {
  return {
    ...state,
    roster: {
      ...state.roster,
      squad: state.roster.squad.map((u) => (u.id === unitId ? newUnit : u)),
      stable: state.roster.stable.map((u) => (u.id === unitId ? newUnit : u)),
    },
  };
}

// Lab Phase - Interactive lab management
export async function labPhase(state: GameState): Promise<GameState> {
  displayHeader("🔬 Lab");
  displayGameState(state);
  displayRoster(state);

  let currentState = state;
  let inLab = true;

  while (inLab) {
    const choices = [
      { name: "🏥 Start healing wounded units", value: "heal" },
      { name: "📋 View roster", value: "roster" },
      { name: "✅ Done (continue to next battle)", value: "done" },
    ];

    const choice = await select({
      message: "What would you like to do?",
      choices,
    });

    switch (choice) {
      case "heal":
        currentState = await healingStation(currentState);
        break;
      case "roster":
        displayRoster(currentState);
        break;
      case "done":
        inLab = false;
        break;
    }
  }

  // Complete any finished healing
  currentState.roster.healing.forEach((slot) => {
    if (isHealingComplete(slot)) {
      const unit = [...currentState.roster.squad, ...currentState.roster.stable].find(
        (u) => u.id === slot.unitId,
      );
      if (unit) {
        const healedUnit = applyHealing(unit);
        currentState = updateUnitInRoster(currentState, unit.id, healedUnit);
      }
    }
  });

  // Remove completed healing slots
  currentState = {
    ...currentState,
    roster: {
      ...currentState.roster,
      healing: currentState.roster.healing.filter((slot) => !isHealingComplete(slot)),
    },
  };

  return currentState;
}

// Healing station
async function healingStation(state: GameState): Promise<GameState> {
  const wounded = [...state.roster.squad, ...state.roster.stable].filter(
    (u) => u.stats.currentHp < u.stats.maxHp,
  );

  if (wounded.length === 0) {
    console.log("\n✅ No wounded units!");
    return state;
  }

  if (state.roster.healing.length >= 5) {
    console.log("\n⚠️  Healing station is full! (max 5 units)");
    return state;
  }

  console.log("\n🏥 WOUNDED UNITS:");
  wounded.forEach((unit, i) => {
    console.log(`  ${displayUnit(unit, i)}`);
  });

  const choice = await select({
    message: "Which unit to heal?",
    choices: [
      ...wounded.map((unit, i) => ({
        name: displayUnit(unit),
        value: i,
      })),
      { name: "Cancel", value: -1 },
    ],
  });

  if (choice === -1) return state;

  const unit = wounded[choice];
  if (!unit) return state;

  const healingSlot = startHealing(unit, 100);

  console.log(
    `\n✅ ${unit.speciesId} placed in healing station (${healingSlot.daysRemaining} days)`,
  );

  // Remove from squad/stable and add to healing
  return {
    ...state,
    roster: {
      ...state.roster,
      squad: state.roster.squad.filter((u) => u.id !== unit.id),
      stable: state.roster.stable.filter((u) => u.id !== unit.id),
      healing: [...state.roster.healing, healingSlot],
      breeding: state.roster.breeding,
    },
  };
}

// Combat Phase - Run battle and show results
export async function combatPhase(
  state: GameState,
  campaign: Campaign,
): Promise<{ state: GameState; victory: boolean }> {
  displayHeader("⚔️  Combat");
  displayGameState(state);

  const encounter = getCurrentEncounter(campaign);
  if (!encounter) {
    console.log("\n❌ No encounter available!");
    return { state, victory: false };
  }

  console.log(`\n🎯 ENCOUNTER: ${encounter.type.toUpperCase()}`);
  console.log(`💰 Reward: ${encounter.goldReward}g | 🧬 ${encounter.materialsReward} materials\n`);

  displaySquad(state.roster.squad);

  console.log("\n⚔️  VS\n");

  encounter.enemies.forEach((unit, i) => {
    console.log(`  ${displayUnit(unit, i)}`);
  });

  const ready = await confirm({
    message: "Ready for battle?",
    default: true,
  });

  if (!ready) {
    console.log("\n⏸️  Combat cancelled!");
    return { state, victory: false };
  }

  console.log("\n⚔️  BATTLE STARTING...\n");

  // Simulate battle
  const battleState = simulateBattle(state.roster.squad, encounter.enemies);
  const victory = battleState.winner === "player";

  // Update units with post-battle HP
  let newState = state;
  battleState.playerUnits.forEach((battleUnit) => {
    newState = updateUnitInRoster(newState, battleUnit.id, battleUnit);
  });

  // Advance time after combat
  newState = advanceTimeAfterCombat(newState);

  // Show detailed combat log
  displayCombatLog(battleState);
  displayCombatSummary(battleState);

  displayBattleSummary(battleState.playerUnits, battleState.enemyUnits, victory);

  if (victory) {
    console.log(`\n💰 +${encounter.goldReward}g | 🧬 +${encounter.materialsReward} materials`);
    newState = {
      ...newState,
      currency: {
        gold: newState.currency.gold + encounter.goldReward,
        materials: newState.currency.materials + encounter.materialsReward,
      },
    };

    // Award XP to survivors
    const survivors = battleState.playerUnits.filter(isAlive);
    console.log(`\n⭐ ${survivors.length} survivors gained XP!`);
  }

  await confirm({
    message: "Press Enter to continue...",
    default: true,
  });

  return { state: newState, victory };
}
