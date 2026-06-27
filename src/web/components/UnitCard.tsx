import type { Unit } from "@/core/types";
import { GeneticGrade } from "@/core/types";
import {
  getLifeStageColor,
  getLifeStageLabel,
  getMutationName,
  getSpeciesEmoji,
  getSpeciesName,
} from "@/web/utils/species";
import { HpBar } from "./HpBar";

interface UnitCardProps {
  unit: Unit;
  isEnemy?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

const GRADE_COLOR: Record<GeneticGrade, string> = {
  [GeneticGrade.S]: "text-warning",
  [GeneticGrade.A]: "text-warning",
  [GeneticGrade.B]: "text-accent",
  [GeneticGrade.C]: "text-bio",
  [GeneticGrade.D]: "text-muted",
  [GeneticGrade.F]: "text-muted",
};

export function UnitCard({
  unit,
  isEnemy = false,
  isSelected = false,
  onClick,
  className = "",
  compact = false,
}: UnitCardProps) {
  const emoji = getSpeciesEmoji(unit.speciesId);
  const name = getSpeciesName(unit.speciesId);
  const isDead = unit.stats.currentHp <= 0;
  const lifeColor = getLifeStageColor(unit.lifeStage);

  const border = isSelected
    ? "border-accent shadow-[0_0_8px_rgba(34,211,238,0.4)]"
    : isDead
      ? "border-line opacity-50"
      : isEnemy
        ? "border-danger/60 hover:border-danger"
        : "border-line hover:border-line";

  const cursor = onClick ? "cursor-pointer" : "";

  if (compact) {
    return (
      <div
        className={`rounded-lg border p-2 bg-panel transition-all ${border} ${cursor} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink truncate">{name}</div>
            <HpBar
              current={unit.stats.currentHp}
              max={unit.stats.maxHp}
              showNumbers={false}
              className="mt-1"
            />
          </div>
          <div className="text-xs text-muted tabular-nums whitespace-nowrap">
            {unit.stats.currentHp}/{unit.stats.maxHp}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-3 bg-panel transition-all ${border} ${cursor} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <div className="text-sm font-bold text-ink">{name}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted">Lv.{unit.level}</span>
              <span className={`text-xs ${lifeColor}`}>{getLifeStageLabel(unit.lifeStage)}</span>
            </div>
          </div>
        </div>
        {isEnemy && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-danger/15 text-danger">ENEMY</span>
        )}
      </div>

      <HpBar current={unit.stats.currentHp} max={unit.stats.maxHp} className="mb-2" />

      <div className="grid grid-cols-3 gap-1 text-xs mb-2">
        <div className="text-center bg-panel-2 rounded p-1">
          <div className="text-muted">SPD</div>
          <div className="text-accent font-bold">{unit.stats.speed}</div>
        </div>
        <div className="text-center bg-panel-2 rounded p-1">
          <div className="text-muted">ATK</div>
          <div className="text-danger font-bold">{unit.stats.attackPower}</div>
        </div>
        <div className="text-center bg-panel-2 rounded p-1">
          <div className="text-muted">GEN</div>
          <div className="text-ink font-bold">{unit.level}</div>
        </div>
      </div>

      {unit.mutations.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {unit.mutations.map((m) => (
            <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-gene/15 text-gene">
              {getMutationName(m)}
            </span>
          ))}
        </div>
      )}

      {unit.equipment.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unit.equipment.map((e) => (
            <span key={e} className="text-xs px-1.5 py-0.5 rounded bg-accent/15 text-accent">
              {e.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-line grid grid-cols-3 gap-1 text-xs text-muted">
        {(["maxHp", "speed", "attackPower"] as const).map((stat) => (
          <div key={stat} className="text-center">
            <span className={GRADE_COLOR[unit.geneticPotential[stat]] ?? "text-muted"}>
              {stat === "maxHp" ? "HP" : stat === "speed" ? "SPD" : "ATK"}{" "}
              {unit.geneticPotential[stat]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Separate display for the battle arena (shows live HP during replay)
interface BattleUnitCardProps {
  unit: Unit;
  currentHp: number;
  isEnemy?: boolean;
  isDead?: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
}

export function BattleUnitCard({
  unit,
  currentHp,
  isEnemy = false,
  isDead = false,
  isAttacking = false,
  isHit = false,
}: BattleUnitCardProps) {
  const emoji = getSpeciesEmoji(unit.speciesId);
  const name = getSpeciesName(unit.speciesId);

  let cardClass = "rounded-xl border p-3 bg-panel transition-all duration-200 ";
  if (isDead) {
    cardClass += "border-line opacity-30 grayscale";
  } else if (isAttacking) {
    cardClass += "border-accent animate-attack";
  } else if (isHit) {
    cardClass += "border-danger animate-hit animate-shake";
  } else if (isEnemy) {
    cardClass += "border-danger/40";
  } else {
    cardClass += "border-line";
  }

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-2xl transition-all ${isDead ? "grayscale" : ""}`}>{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-ink truncate">{name}</div>
          <div className="text-xs text-muted">Lv.{unit.level}</div>
        </div>
      </div>
      <HpBar current={isDead ? 0 : currentHp} max={unit.stats.maxHp} />
      <div className="flex justify-between text-xs mt-1">
        <span className="text-muted">
          SPD:{unit.stats.speed} ATK:{unit.stats.attackPower}
        </span>
      </div>
    </div>
  );
}
