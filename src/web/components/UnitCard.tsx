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
  [GeneticGrade.S]: "text-yellow-300",
  [GeneticGrade.A]: "text-orange-400",
  [GeneticGrade.B]: "text-cyan-400",
  [GeneticGrade.C]: "text-green-400",
  [GeneticGrade.D]: "text-zinc-400",
  [GeneticGrade.F]: "text-zinc-600",
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
    ? "border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
    : isDead
      ? "border-zinc-700 opacity-50"
      : isEnemy
        ? "border-red-800 hover:border-red-600"
        : "border-zinc-700 hover:border-zinc-500";

  const cursor = onClick ? "cursor-pointer" : "";

  if (compact) {
    return (
      <div
        className={`rounded-lg border p-2 bg-zinc-900 transition-all ${border} ${cursor} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-zinc-100 truncate">{name}</div>
            <HpBar
              current={unit.stats.currentHp}
              max={unit.stats.maxHp}
              showNumbers={false}
              className="mt-1"
            />
          </div>
          <div className="text-xs text-zinc-400 tabular-nums whitespace-nowrap">
            {unit.stats.currentHp}/{unit.stats.maxHp}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-3 bg-zinc-900 transition-all ${border} ${cursor} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <div className="text-sm font-bold text-zinc-100">{name}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500">Lv.{unit.level}</span>
              <span className={`text-xs ${lifeColor}`}>{getLifeStageLabel(unit.lifeStage)}</span>
            </div>
          </div>
        </div>
        {isEnemy && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-400">ENEMY</span>
        )}
      </div>

      <HpBar current={unit.stats.currentHp} max={unit.stats.maxHp} className="mb-2" />

      <div className="grid grid-cols-3 gap-1 text-xs mb-2">
        <div className="text-center bg-zinc-800 rounded p-1">
          <div className="text-zinc-500">SPD</div>
          <div className="text-cyan-400 font-bold">{unit.stats.speed}</div>
        </div>
        <div className="text-center bg-zinc-800 rounded p-1">
          <div className="text-zinc-500">ATK</div>
          <div className="text-red-400 font-bold">{unit.stats.attackPower}</div>
        </div>
        <div className="text-center bg-zinc-800 rounded p-1">
          <div className="text-zinc-500">GEN</div>
          <div className="text-zinc-300 font-bold">{unit.level}</div>
        </div>
      </div>

      {unit.mutations.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {unit.mutations.map((m) => (
            <span
              key={m}
              className="text-xs px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300"
            >
              {getMutationName(m)}
            </span>
          ))}
        </div>
      )}

      {unit.equipment.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unit.equipment.map((e) => (
            <span key={e} className="text-xs px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300">
              {e.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-zinc-800 grid grid-cols-3 gap-1 text-xs text-zinc-600">
        {(["maxHp", "speed", "attackPower"] as const).map((stat) => (
          <div key={stat} className="text-center">
            <span className={GRADE_COLOR[unit.geneticPotential[stat]] ?? "text-zinc-600"}>
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

  let cardClass = "rounded-xl border p-3 bg-zinc-900 transition-all duration-200 ";
  if (isDead) {
    cardClass += "border-zinc-800 opacity-30 grayscale";
  } else if (isAttacking) {
    cardClass += "border-cyan-400 animate-attack";
  } else if (isHit) {
    cardClass += "border-red-500 animate-hit animate-shake";
  } else if (isEnemy) {
    cardClass += "border-red-900";
  } else {
    cardClass += "border-zinc-700";
  }

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-2xl transition-all ${isDead ? "grayscale" : ""}`}>{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-zinc-100 truncate">{name}</div>
          <div className="text-xs text-zinc-500">Lv.{unit.level}</div>
        </div>
      </div>
      <HpBar current={isDead ? 0 : currentHp} max={unit.stats.maxHp} />
      <div className="flex justify-between text-xs mt-1">
        <span className="text-zinc-500">
          SPD:{unit.stats.speed} ATK:{unit.stats.attackPower}
        </span>
      </div>
    </div>
  );
}
