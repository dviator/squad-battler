import type { GameState } from "../core/gameState";
import type { ShopItem, Unit } from "../core/types";

// Display a unit's stats and info
export function displayUnit(unit: Unit, index?: number): string {
  const prefix = index !== undefined ? `[${index + 1}] ` : "";
  const hpBar = createHpBar(unit.stats.currentHp, unit.stats.maxHp);

  return `${prefix}${unit.speciesId.toUpperCase()} Lv.${unit.level} | ${hpBar} ${unit.stats.currentHp}/${unit.stats.maxHp} HP | ⚡${unit.stats.speed} SPD | ⚔️  ${unit.stats.attackPower} ATK | XP: ${unit.xp}/100`;
}

// Create a visual HP bar
function createHpBar(current: number, max: number): string {
  const percentage = current / max;
  const barLength = 10;
  const filled = Math.round(percentage * barLength);
  const empty = barLength - filled;

  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}

// Display game state header
export function displayGameState(state: GameState): void {
  console.log("\n" + "=".repeat(70));
  console.log(`💰 Gold: ${state.currency.gold} | 🧬 Materials: ${state.currency.materials}`);
  console.log(
    `🌍 World ${state.progress.worldsCompleted + 1} | Progress: ${state.progress.encountersCompleted} encounters`,
  );
  console.log("=".repeat(70));
}

// Display squad
export function displaySquad(units: Unit[]): void {
  console.log("\n🎯 YOUR SQUAD:");
  if (units.length === 0) {
    console.log("  (empty)");
    return;
  }

  units.forEach((unit, i) => {
    console.log(`  ${displayUnit(unit, i)}`);
  });
}

// Display roster/stable
export function displayRoster(state: GameState): void {
  console.log("\n📋 ROSTER:");

  console.log("\n  Active Squad:");
  if (state.roster.squad.length === 0) {
    console.log("    (empty)");
  } else {
    state.roster.squad.forEach((unit, i) => {
      console.log(`    ${displayUnit(unit, i)}`);
    });
  }

  console.log("\n  Stable:");
  if (state.roster.stable.length === 0) {
    console.log("    (empty)");
  } else {
    state.roster.stable.forEach((unit, i) => {
      console.log(`    ${displayUnit(unit, i)}`);
    });
  }

  if (state.roster.healing.length > 0) {
    console.log("\n  🏥 Healing:");
    state.roster.healing.forEach((slot) => {
      const unit = [...state.roster.squad, ...state.roster.stable].find(
        (u) => u.id === slot.unitId,
      );
      const label = unit ? displayUnit(unit) : slot.unitId;
      console.log(`    ${label} - ${slot.daysRemaining} days remaining`);
    });
  }

  if (state.roster.breeding.length > 0) {
    console.log("\n  🧬 Breeding:");
    state.roster.breeding.forEach((slot, i) => {
      console.log(
        `    [${i + 1}] ${slot.parent1Id} + ${slot.parent2Id} - ${slot.daysRemaining} days remaining`,
      );
    });
  }
}

// Display shop item
export function displayShopItem(item: ShopItem, index: number): string {
  return `[${index + 1}] ${item.name} - ${item.cost}g - ${item.description}`;
}

// Display battle summary
export function displayBattleSummary(
  playerUnits: Unit[],
  enemyUnits: Unit[],
  victory: boolean,
): void {
  console.log("\n" + "=".repeat(70));
  console.log(victory ? "🎉 VICTORY!" : "💀 DEFEAT!");
  console.log("=".repeat(70));

  console.log("\nYour Squad:");
  playerUnits.forEach((unit) => {
    const status = unit.stats.currentHp > 0 ? "✓ Alive" : "✗ Dead";
    console.log(`  ${unit.speciesId} - ${unit.stats.currentHp}/${unit.stats.maxHp} HP - ${status}`);
  });

  console.log("\nEnemies:");
  enemyUnits.forEach((unit) => {
    const status = unit.stats.currentHp > 0 ? "✓ Alive" : "✗ Dead";
    console.log(`  ${unit.speciesId} - ${unit.stats.currentHp}/${unit.stats.maxHp} HP - ${status}`);
  });
}

// Clear screen (works in most terminals)
export function clearScreen(): void {
  console.clear();
}

// Display header with title
export function displayHeader(title: string): void {
  console.log("\n" + "=".repeat(70));
  console.log(title.toUpperCase().padStart(35 + title.length / 2));
  console.log("=".repeat(70));
}
