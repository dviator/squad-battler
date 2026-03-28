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

function UnitSlot({
  unit,
  currentHp,
  isDead,
  isAttacking,
  isHit,
  isEnemy,
}: {
  unit: Unit | undefined;
  currentHp: number;
  isDead: boolean;
  isAttacking: boolean;
  isHit: boolean;
  isEnemy: boolean;
}) {
  if (!unit) {
    return <div className="rounded-xl border border-zinc-800 border-dashed min-h-[120px] opacity-30" />;
  }

  return (
    <BattleUnitCard
      unit={unit}
      currentHp={currentHp}
      isEnemy={isEnemy}
      isDead={isDead}
      isAttacking={isAttacking}
      isHit={isHit}
    />
  );
}

export function BattleArena({
  playerUnits,
  enemyUnits,
  unitHps,
  deadUnitIds,
  activeAttackerId,
  hitUnitIds,
}: BattleArenaProps) {
  const positions = [Position.Left, Position.Center, Position.Right] as const;

  function renderRow(units: Unit[], isEnemy: boolean) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {positions.map((pos) => {
          const unit = getUnitAtPosition(units, pos);
          const hp = unit ? (unitHps.get(unit.id) ?? unit.stats.currentHp) : 0;
          const dead = unit ? deadUnitIds.has(unit.id) : false;
          const attacking = unit ? unit.id === activeAttackerId : false;
          const hit = unit ? hitUnitIds.has(unit.id) : false;

          return (
            <UnitSlot
              key={pos}
              unit={unit}
              currentHp={hp}
              isDead={dead}
              isAttacking={attacking}
              isHit={hit}
              isEnemy={isEnemy}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Enemy row */}
      <div>
        <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">
          Enemies
        </div>
        {renderRow(enemyUnits, true)}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-zinc-600 text-xs">⚔️</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      {/* Player row */}
      <div>
        <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-2">
          Your Squad
        </div>
        {renderRow(playerUnits, false)}
      </div>
    </div>
  );
}
