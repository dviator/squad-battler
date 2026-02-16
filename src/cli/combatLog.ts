import type { BattleState } from "../core/types";
import { BattleEventType } from "../core/types";

// Display detailed combat log
export function displayCombatLog(battleState: BattleState): void {
  const allUnits = [...battleState.playerUnits, ...battleState.enemyUnits];

  // Track unit status for context
  const unitStatus = new Map<string, { hp: number; maxHp: number; alive: boolean }>();

  for (const unit of allUnits) {
    unitStatus.set(unit.id, {
      hp: unit.stats.currentHp,
      maxHp: unit.stats.maxHp,
      alive: true,
    });
  }

  const getUnitName = (unitId: string): string => {
    const unit = allUnits.find((u) => u.id === unitId);
    return unit ? `${unit.speciesId.toUpperCase()}` : "???";
  };

  console.log("\n⚔️  COMBAT LOG:\n");

  let currentTick = -1;

  for (const event of battleState.events) {
    // Skip battle start/end events for cleaner log
    if (event.type === BattleEventType.BattleStart || event.type === BattleEventType.BattleEnd) {
      continue;
    }

    // Show tick separator
    if (event.tick !== currentTick) {
      currentTick = event.tick;
      console.log(`\n  ⏱️  Tick ${currentTick}`);
    }

    switch (event.type) {
      case BattleEventType.Tick:
        // Skip displaying tick events themselves
        break;

      case BattleEventType.AttackExecuted: {
        const attackerName = getUnitName(event.attackerId);
        const targetNames = event.targetIds.map(getUnitName).join(", ");
        console.log(`    ${attackerName} uses ${event.attackName} → ${targetNames}`);
        break;
      }

      case BattleEventType.Damage: {
        const targetName = getUnitName(event.targetId);
        const status = unitStatus.get(event.targetId);

        if (event.damage === 0) {
          console.log(`      ✨ ${targetName} takes no damage! (BLOCKED/DODGED)`);
        } else {
          const hpPercent = Math.round((event.remainingHp / (status?.maxHp || 1)) * 100);
          console.log(
            `      💥 ${targetName} takes ${event.damage} damage! (${event.remainingHp}/${status?.maxHp} HP - ${hpPercent}%)`,
          );
        }

        if (status) {
          status.hp = event.remainingHp;
        }
        break;
      }

      case BattleEventType.UnitDied: {
        const unitName = getUnitName(event.unitId);
        console.log(`      💀 ${unitName} has been defeated!`);

        const status = unitStatus.get(event.unitId);
        if (status) {
          status.alive = false;
        }
        break;
      }
    }
  }

  console.log("\n");
}

// Display simplified combat summary (for quick view)
export function displayCombatSummary(battleState: BattleState): void {
  const attackEvents = battleState.events.filter((e) => e.type === BattleEventType.AttackExecuted);
  const damageEvents = battleState.events.filter((e) => e.type === BattleEventType.Damage);
  const deathEvents = battleState.events.filter((e) => e.type === BattleEventType.UnitDied);

  console.log("\n📊 Combat Statistics:");
  console.log(`  • Total attacks: ${attackEvents.length}`);
  console.log(
    `  • Total damage dealt: ${damageEvents.reduce((sum, e) => sum + (e.type === "damage" ? e.damage : 0), 0)}`,
  );
  console.log(`  • Units defeated: ${deathEvents.length}`);
  console.log(`  • Battle duration: ${battleState.tick} ticks`);
}
