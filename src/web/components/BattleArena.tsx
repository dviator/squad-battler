import type { Unit } from "@/core/types";
import { Position } from "@/core/types";
import { BattleUnitCard } from "./UnitCard";

interface BattleArenaProps {
  playerUnits: Unit[];
  enemyUnits: Unit[];
  unitHps: Map<string, number>;
  deadUnitIds: Set<string>;
  activeAttackerId: string | null;
  hitUnitIds: Set<string>;
}

function getUnitAtPosition(units: Unit[], position: Position): Unit | undefined {
  return units.find((u) => u.position === position);
}

const POSITIONS = [Position.Left, Position.Center, Position.Right] as const;

export function BattleArena({
  playerUnits,
  enemyUnits,
  unitHps,
  deadUnitIds,
  activeAttackerId,
  hitUnitIds,
}: BattleArenaProps) {
  function side(units: Unit[], isEnemy: boolean) {
    return (
      <div className="flex flex-col gap-2">
        {POSITIONS.map((pos) => {
          const unit = getUnitAtPosition(units, pos);
          if (!unit) {
            return (
              <div
                key={pos}
                className="rounded-xl border border-dashed border-line min-h-[180px] opacity-40"
              />
            );
          }
          return (
            <BattleUnitCard
              key={pos}
              unit={unit}
              currentHp={unitHps.get(unit.id) ?? unit.stats.currentHp}
              isEnemy={isEnemy}
              isDead={deadUnitIds.has(unit.id)}
              isAttacking={unit.id === activeAttackerId}
              isHit={hitUnitIds.has(unit.id)}
            />
          );
        })}
      </div>
    );
  }

  function column(label: string, labelColor: string, units: Unit[], isEnemy: boolean) {
    return (
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${labelColor}`}>
          {label}
        </div>
        {side(units, isEnemy)}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
      {column("Your Squad", "text-accent", playerUnits, false)}

      {/* VS divider — horizontal on mobile, vertical on desktop */}
      <div className="flex md:flex-col items-center justify-center gap-2 md:self-stretch md:pt-8">
        <div className="h-px flex-1 bg-line md:h-full md:w-px md:flex-none" />
        <span className="text-sm font-bold text-muted">VS</span>
        <div className="h-px flex-1 bg-line md:h-full md:w-px md:flex-none" />
      </div>

      {column("Enemies", "text-danger", enemyUnits, true)}
    </div>
  );
}
