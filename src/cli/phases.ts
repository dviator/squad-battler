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
  displayUnitGrades,
} from "../cli/display";
import { simulateBattle } from "../core/battle";
import type { GameState } from "../core/gameState";
import {
  addScrapTech,
  advanceTimeAfterCombat,
  getScannerUpgradeCost,
  SCANNER_MAX_CAPACITY,
  spendScrapTech,
  upgradeScanner,
} from "../core/gameState";
import { applyHealing } from "../core/lab";
import {
  applyConsumableToUnit,
  applyGeneticModToUnit,
  generateShop,
  purchaseItem,
} from "../core/shop";
import type { ConsumableItem, GeneticModItem, ShopItem, Species, Unit } from "../core/types";
import { ItemCategory, type Position } from "../core/types";
import { isAlive } from "../core/unit";
import { type Campaign, type Encounter, getCurrentEncounter } from "../core/world";

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

const HEAL_COST = 5;

// Lab Phase - Between runs: heal units and select squad
export async function labPhase(state: GameState): Promise<GameState> {
  displayHeader("🔬 Lab");

  let currentState = state;

  // Squad selection is required before leaving the lab
  if (currentState.roster.squad.length === 0) {
    console.log("\n📋 Select your squad for this run:");
    currentState = await squadSelectPhase(currentState);
  }

  // Scans available this lab visit (replenished each visit from scannerCapacity)
  let scansRemaining = currentState.scannerCapacity;

  let inLab = true;
  while (inLab) {
    displayGameState(currentState);
    displayRoster(currentState);

    if (currentState.scannerCapacity > 0) {
      const atMax = currentState.scannerCapacity >= SCANNER_MAX_CAPACITY;
      const upgradeCostDisplay = atMax
        ? "(MAX)"
        : `| upgrade: ${getScannerUpgradeCost(currentState.scannerCapacity)} 🔧`;
      console.log(
        `\n🔬 Scanner: capacity ${currentState.scannerCapacity}/${SCANNER_MAX_CAPACITY} ${upgradeCostDisplay} | scans this visit: ${scansRemaining}`,
      );
    }

    const allUnits = [...currentState.roster.squad, ...currentState.roster.stable];
    const wounded = allUnits.filter((u) => u.stats.currentHp < u.stats.maxHp);
    const canHeal = wounded.length > 0 && currentState.scrapTech >= HEAL_COST;
    const hasUnscannedGenes = allUnits.some(
      (u) => !u.revealedGenes.maxHp || !u.revealedGenes.speed || !u.revealedGenes.attackPower,
    );
    const canScan = currentState.scannerCapacity > 0 && scansRemaining > 0 && hasUnscannedGenes;
    const upgradeCost = getScannerUpgradeCost(currentState.scannerCapacity);
    const canUpgrade = upgradeCost !== null && currentState.scrapTech >= upgradeCost;

    const choices = [
      ...(canScan
        ? [{ name: `🔬 Scan a gene (${scansRemaining} remaining this visit)`, value: "scan" }]
        : []),
      ...(canUpgrade
        ? [
            {
              name: `⬆️  Upgrade scanner (${upgradeCost} 🔧 → capacity ${currentState.scannerCapacity + 1}/${SCANNER_MAX_CAPACITY})`,
              value: "upgrade",
            },
          ]
        : []),
      ...(canHeal ? [{ name: `🏥 Heal a unit (${HEAL_COST} 🔧)`, value: "heal" }] : []),
      { name: "🎯 Re-select squad", value: "squad" },
      { name: "✅ Start run", value: "done" },
    ];

    const choice = await select({ message: "What would you like to do?", choices });

    switch (choice) {
      case "scan": {
        const result = await scanGene(currentState, scansRemaining);
        currentState = result.state;
        scansRemaining = result.scansRemaining;
        break;
      }
      case "upgrade": {
        const result = upgradeScanner(currentState);
        if (result.success) {
          currentState = result.newState;
          scansRemaining += 1; // New capacity takes effect immediately this visit
          console.log(`\n✅ Scanner upgraded to capacity ${currentState.scannerCapacity}!`);
        } else {
          console.log(`\n❌ ${result.error}`);
        }
        break;
      }
      case "heal":
        currentState = await instantHeal(currentState);
        break;
      case "squad":
        currentState = await squadSelectPhase(currentState);
        break;
      case "done":
        if (currentState.roster.squad.length === 0) {
          console.log("\n⚠️  You need at least one unit in your squad!");
        } else {
          inLab = false;
        }
        break;
    }
  }

  return currentState;
}

// Scan a gene: pick unit → pick unrevealed gene → reveal it permanently
async function scanGene(
  state: GameState,
  scansRemaining: number,
): Promise<{ state: GameState; scansRemaining: number }> {
  const allUnits = [...state.roster.squad, ...state.roster.stable];
  const scannable = allUnits.filter(
    (u) => !u.revealedGenes.maxHp || !u.revealedGenes.speed || !u.revealedGenes.attackPower,
  );

  const unitChoice = await select({
    message: "Scan which creature?",
    choices: [
      ...scannable.map((u) => ({
        name: `${u.speciesId} — ${displayUnitGrades(u)}`,
        value: u.id,
      })),
      { name: "Cancel", value: "cancel" },
    ],
  });

  if (unitChoice === "cancel") return { state, scansRemaining };

  const unit = allUnits.find((u) => u.id === unitChoice)!;
  const geneChoices = [
    ...(!unit.revealedGenes.maxHp
      ? [{ name: `HP gene (currently ?)`, value: "maxHp" as const }]
      : []),
    ...(!unit.revealedGenes.speed
      ? [{ name: `Speed gene (currently ?)`, value: "speed" as const }]
      : []),
    ...(!unit.revealedGenes.attackPower
      ? [{ name: `Attack gene (currently ?)`, value: "attackPower" as const }]
      : []),
  ];

  const geneChoice = await select({
    message: "Which gene to scan?",
    choices: [...geneChoices, { name: "Cancel", value: "cancel" as const }],
  });

  if (geneChoice === "cancel") return { state, scansRemaining };

  const revealedUnit = {
    ...unit,
    revealedGenes: { ...unit.revealedGenes, [geneChoice]: true },
  };

  const gradeRevealed = unit.geneticPotential[geneChoice];
  console.log(`\n🔬 Scanned! ${unit.speciesId}'s ${geneChoice} gene: ${gradeRevealed}`);

  return {
    state: updateUnitInRoster(state, unit.id, revealedUnit),
    scansRemaining: scansRemaining - 1,
  };
}

// Instant heal: pay HEAL_COST scrap tech, unit restored to full HP
async function instantHeal(state: GameState): Promise<GameState> {
  const allUnits = [...state.roster.squad, ...state.roster.stable];
  const wounded = allUnits.filter((u) => u.stats.currentHp < u.stats.maxHp);

  if (wounded.length === 0) {
    console.log("\n✅ No wounded units!");
    return state;
  }

  const choice = await select({
    message: `Heal which unit? (${HEAL_COST} 🔧 each)`,
    choices: [
      ...wounded.map((unit) => ({
        name: `${displayUnit(unit)} ${unit.stats.currentHp <= 0 ? "☠️ " : ""}`,
        value: unit.id,
      })),
      { name: "Cancel", value: "cancel" },
    ],
  });

  if (choice === "cancel") return state;

  const spendResult = spendScrapTech(state, HEAL_COST);
  if (!spendResult.success) {
    console.log(`\n❌ ${spendResult.error}`);
    return state;
  }

  const unit = allUnits.find((u) => u.id === choice)!;
  const healedUnit = applyHealing(unit);
  console.log(`\n✅ ${unit.speciesId} healed to full HP!`);

  return updateUnitInRoster(spendResult.newState, unit.id, healedUnit);
}

// Squad selection: pick up to 3 units from all available
async function squadSelectPhase(state: GameState): Promise<GameState> {
  const allUnits = [...state.roster.squad, ...state.roster.stable];

  if (allUnits.length === 0) {
    console.log("\n⚠️  No units available!");
    return state;
  }

  const maxSquadSize = Math.min(3, allUnits.length);
  const selectedIds: string[] = [];

  for (let i = 0; i < maxSquadSize; i++) {
    const remaining = allUnits.filter((u) => !selectedIds.includes(u.id));
    if (remaining.length === 0) break;

    const choice = await select({
      message: `Pick squad member ${i + 1}/${maxSquadSize}:`,
      choices: [
        ...remaining.map((u) => ({
          name: `${displayUnit(u)}${u.stats.currentHp <= 0 ? " ☠️  (needs healing)" : ""}`,
          value: u.id,
        })),
        ...(i > 0 ? [{ name: "Done (smaller squad)", value: "done" }] : []),
      ],
    });

    if (choice === "done") break;
    selectedIds.push(choice as string);
  }

  const squad = selectedIds.map((id, idx) => {
    const unit = allUnits.find((u) => u.id === id)!;
    return { ...unit, position: idx as Position };
  });
  const stable = allUnits.filter((u) => !selectedIds.includes(u.id));

  console.log(`\n✅ Squad set: ${squad.map((u) => u.speciesId).join(", ")}`);

  return {
    ...state,
    roster: {
      ...state.roster,
      squad,
      stable,
    },
  };
}

// Combat Phase - Run battle and show results
export async function combatPhase(
  state: GameState,
  campaign: Campaign,
): Promise<{ state: GameState; victory: boolean; encounter: Encounter }> {
  displayHeader("⚔️  Combat");
  displayGameState(state);

  const encounter = getCurrentEncounter(campaign);
  if (!encounter) {
    console.log("\n❌ No encounter available!");
    return {
      state,
      victory: false,
      encounter: {
        id: "",
        type: "normal" as never,
        enemies: [],
        goldReward: 0,
        materialsReward: 0,
        scrapTechReward: 0,
      },
    };
  }

  const totalEncounters =
    campaign.worlds[campaign.currentWorldIndex]?.levels[campaign.currentLevelIndex]?.encounters
      .length ?? 0;
  console.log(
    `\n🎯 ENCOUNTER ${campaign.currentEncounterIndex + 1}/${totalEncounters}: ${encounter.type.toUpperCase()}`,
  );
  console.log(`💰 Reward: ${encounter.goldReward}g | 🔧 ${encounter.scrapTechReward} scrap tech\n`);

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
    return { state, victory: false, encounter };
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
    console.log(`\n💰 +${encounter.goldReward}g | 🔧 +${encounter.scrapTechReward} scrap tech`);
    newState = {
      ...newState,
      currency: {
        gold: newState.currency.gold + encounter.goldReward,
        materials: newState.currency.materials + encounter.materialsReward,
      },
    };
    newState = addScrapTech(newState, encounter.scrapTechReward);

    const survivors = battleState.playerUnits.filter(isAlive);
    console.log(`\n⭐ ${survivors.length} survivors gained XP!`);
  }

  await confirm({
    message: "Press Enter to continue...",
    default: true,
  });

  return { state: newState, victory, encounter };
}
