import { Unit, TargetType, Position } from "./types";
import { isAlive } from "./unit";

export function resolveTargets(
  attacker: Unit,
  allies: Unit[],
  enemies: Unit[],
  targetType: TargetType
): Unit[] {
  const livingEnemies = enemies.filter(isAlive);
  const livingAllies = allies.filter(isAlive);

  if (livingEnemies.length === 0) return [];

  switch (targetType) {
    case TargetType.OppositeEnemy: {
      const oppositeEnemy = livingEnemies.find(
        (e) => e.position === attacker.position
      );
      if (oppositeEnemy) return [oppositeEnemy];
      return [livingEnemies[0]!];
    }

    case TargetType.LowestHpEnemy: {
      const sorted = [...livingEnemies].sort(
        (a, b) => a.stats.currentHp - b.stats.currentHp
      );
      return [sorted[0]!];
    }

    case TargetType.AllEnemies: {
      return livingEnemies;
    }

    case TargetType.RandomEnemy: {
      const randomIndex = Math.floor(Math.random() * livingEnemies.length);
      return [livingEnemies[randomIndex]!];
    }

    case TargetType.LeftAlly: {
      if (attacker.position === Position.Left) return [];
      const leftAlly = livingAllies.find(
        (a) => a.position === attacker.position - 1
      );
      return leftAlly ? [leftAlly] : [];
    }

    case TargetType.RightAlly: {
      if (attacker.position === Position.Right) return [];
      const rightAlly = livingAllies.find(
        (a) => a.position === attacker.position + 1
      );
      return rightAlly ? [rightAlly] : [];
    }

    default:
      return [];
  }
}
