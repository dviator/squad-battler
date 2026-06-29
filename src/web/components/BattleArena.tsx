import type { Unit } from "@/core/types";
import { Position } from "@/core/types";
import { SquadFrame } from "./SquadFrame";
import { BattleUnitCard } from "./UnitCard";

interface BattleArenaProps {
  playerUnits: Unit[];
  enemyUnits: Unit[];
  unitHps: Map<string, number>;
  deadUnitIds: Set<string>;
  activeAttackerId: string | null;
  hitUnitIds: Set<string>;
  unitTimerProgress: Map<string, number>;
}

const POSITIONS = [Position.Left, Position.Center, Position.Right] as const;

function getUnitAtPosition(units: Unit[], position: Position): Unit | undefined {
  return units.find((u) => u.position === position);
}

function EnemySide({
  units,
  unitHps,
  deadUnitIds,
  activeAttackerId,
  hitUnitIds,
}: {
  units: Unit[];
  unitHps: Map<string, number>;
  deadUnitIds: Set<string>;
  activeAttackerId: string | null;
  hitUnitIds: Set<string>;
}) {
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
            isEnemy
            isDead={deadUnitIds.has(unit.id)}
            isAttacking={unit.id === activeAttackerId}
            isHit={hitUnitIds.has(unit.id)}
          />
        );
      })}
    </div>
  );
}

export function BattleArena({
  playerUnits,
  enemyUnits,
  unitHps,
  deadUnitIds,
  activeAttackerId,
  hitUnitIds,
  unitTimerProgress,
}: BattleArenaProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
      {/* Player squad — persistent CharacterCard frame */}
      <div className="flex-1 min-w-0">
        <SquadFrame
          units={playerUnits}
          label="Your Squad"
          unitHps={unitHps}
          deadUnitIds={deadUnitIds}
          activeAttackerId={activeAttackerId}
          hitUnitIds={hitUnitIds}
          unitTimerProgress={unitTimerProgress}
        />
      </div>

      {/* VS divider — horizontal on mobile, vertical on desktop */}
      <div className="flex md:flex-col items-center justify-center gap-2 md:self-stretch md:pt-8">
        <div className="h-px flex-1 bg-line md:h-full md:w-px md:flex-none" />
        <span className="text-sm font-bold text-muted">VS</span>
        <div className="h-px flex-1 bg-line md:h-full md:w-px md:flex-none" />
      </div>

      {/* Enemy side — existing BattleUnitCard treatment */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-danger">
          Enemies
        </div>
        <EnemySide
          units={enemyUnits}
          unitHps={unitHps}
          deadUnitIds={deadUnitIds}
          activeAttackerId={activeAttackerId}
          hitUnitIds={hitUnitIds}
        />
      </div>
    </div>
  );
}
