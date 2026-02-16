import { BattleState, BattleEventType, Unit } from "./types";

export function logBattle(state: BattleState): string {
  const lines: string[] = [];
  const unitMap = new Map<string, Unit>();

  state.playerUnits.forEach((u) => unitMap.set(u.id, u));
  state.enemyUnits.forEach((u) => unitMap.set(u.id, u));

  const getUnitName = (unitId: string): string => {
    const unit = unitMap.get(unitId);
    if (!unit) return unitId;
    return `${unit.speciesId}_${unit.position}`;
  };

  state.events.forEach((event) => {
    switch (event.type) {
      case BattleEventType.BattleStart:
        lines.push("=== BATTLE START ===");
        lines.push(
          `Player: ${state.playerUnits.map((u) => `${u.speciesId}(${u.stats.currentHp}hp)`).join(", ")}`
        );
        lines.push(
          `Enemy: ${state.enemyUnits.map((u) => `${u.speciesId}(${u.stats.currentHp}hp)`).join(", ")}`
        );
        lines.push("");
        break;

      case BattleEventType.Tick:
        break;

      case BattleEventType.AttackExecuted:
        const targets = event.targetIds.map(getUnitName).join(", ");
        lines.push(
          `[T${event.tick}] ${getUnitName(event.attackerId)} uses ${event.attackName} on ${targets}`
        );
        break;

      case BattleEventType.Damage:
        lines.push(
          `  → ${getUnitName(event.targetId)} takes ${event.damage} damage (${event.remainingHp} HP remaining)`
        );
        break;

      case BattleEventType.UnitDied:
        lines.push(`  💀 ${getUnitName(event.unitId)} died`);
        break;

      case BattleEventType.BattleEnd:
        lines.push("");
        lines.push(`=== BATTLE END (Tick ${event.tick}) ===`);
        lines.push(`Winner: ${event.winner.toUpperCase()}`);
        if (event.survivors.length > 0) {
          lines.push(
            `Survivors: ${event.survivors.map(getUnitName).join(", ")}`
          );
        }
        break;
    }
  });

  return lines.join("\n");
}

export function logSquadStatus(units: Unit[], label: string): string {
  const lines: string[] = [`${label}:`];
  units.forEach((unit) => {
    const mutations =
      unit.mutations.length > 0 ? ` [${unit.mutations.join(", ")}]` : "";
    lines.push(
      `  ${unit.speciesId} (Pos ${unit.position}): ${unit.stats.currentHp}/${unit.stats.maxHp} HP, ${unit.stats.attackPower} ATK, ${unit.stats.speed} SPD${mutations}`
    );
  });
  return lines.join("\n");
}
