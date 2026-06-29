import type { Unit } from "@/core/types";
import { Position } from "@/core/types";
import { CharacterCard } from "./CharacterCard";

const POSITIONS = [Position.Left, Position.Center, Position.Right] as const;

function getUnitAtPosition(units: Unit[], position: Position): Unit | undefined {
  return units.find((u) => u.position === position);
}

interface SquadFrameProps {
  units: Unit[];
  label?: string;
  /** horizontal: cards side-by-side (shop strip). vertical: stacked column (battle arena). */
  orientation?: "vertical" | "horizontal";
  // Combat props — present signals combat/live mode
  unitHps?: Map<string, number>;
  deadUnitIds?: Set<string>;
  activeAttackerId?: string | null;
  hitUnitIds?: Set<string>;
  unitTimerProgress?: Map<string, number>;
  // Idle/shop interaction
  selectedUnitId?: string | null;
  onUnitClick?: (unitId: string) => void;
}

export function SquadFrame({
  units,
  label,
  orientation = "vertical",
  unitHps,
  deadUnitIds,
  activeAttackerId,
  hitUnitIds,
  unitTimerProgress,
  selectedUnitId,
  onUnitClick,
}: SquadFrameProps) {
  const inCombat = unitHps !== undefined;
  const isHorizontal = orientation === "horizontal";

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="text-xs font-semibold uppercase tracking-wider text-accent">{label}</div>
      )}
      <div className={isHorizontal ? "flex gap-2" : "flex flex-col gap-2"}>
        {POSITIONS.map((pos) => {
          const unit = getUnitAtPosition(units, pos);

          if (!unit) {
            return (
              <div
                key={pos}
                className={`rounded-xl border border-dashed border-line opacity-40 ${
                  isHorizontal ? "flex-1 min-h-[80px]" : "min-h-[120px]"
                }`}
              />
            );
          }

          const currentHp = inCombat
            ? (unitHps?.get(unit.id) ?? unit.stats.currentHp)
            : unit.stats.currentHp;
          const isDead = inCombat
            ? (deadUnitIds?.has(unit.id) ?? false)
            : unit.stats.currentHp <= 0;
          const isAttacking = activeAttackerId === unit.id;
          const isHit = hitUnitIds?.has(unit.id) ?? false;
          const timerProgress = inCombat ? (unitTimerProgress?.get(unit.id) ?? 0) : undefined;

          return (
            <CharacterCard
              key={pos}
              unit={unit}
              currentHp={currentHp}
              isDead={isDead}
              isAttacking={isAttacking}
              isHit={isHit}
              timerProgress={timerProgress}
              isSelected={selectedUnitId === unit.id}
              onClick={onUnitClick ? () => onUnitClick(unit.id) : undefined}
              compact={isHorizontal}
              className={isHorizontal ? "flex-1 min-w-0" : ""}
            />
          );
        })}
      </div>
    </div>
  );
}
