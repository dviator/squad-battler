import type { ReactNode } from "react";
import type { Unit } from "@/core/types";
import { GeneticGrade } from "@/core/types";
import {
  getLifeStageColor,
  getLifeStageLabel,
  getMutationName,
  getSpeciesEmoji,
  getSpeciesName,
  getSpeciesTint,
} from "@/web/utils/species";
import { HpBar } from "./HpBar";

const GRADE_COLOR: Record<GeneticGrade, string> = {
  [GeneticGrade.S]: "text-warning",
  [GeneticGrade.A]: "text-warning",
  [GeneticGrade.B]: "text-accent",
  [GeneticGrade.C]: "text-bio",
  [GeneticGrade.D]: "text-muted",
  [GeneticGrade.F]: "text-muted",
};

const GRADE_RANK: Record<GeneticGrade, number> = {
  [GeneticGrade.F]: 0,
  [GeneticGrade.D]: 1,
  [GeneticGrade.C]: 2,
  [GeneticGrade.B]: 3,
  [GeneticGrade.A]: 4,
  [GeneticGrade.S]: 5,
};

// Stable "specimen" id from the unit's runtime id — a flavor label on each card.
function specimenTag(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `SPEC-${(h % 1000).toString().padStart(3, "0")}`;
}

function bestGrade(unit: Unit): GeneticGrade {
  return (["maxHp", "speed", "attackPower"] as const)
    .map((s) => unit.geneticPotential[s])
    .reduce((best, g) => (GRADE_RANK[g] > GRADE_RANK[best] ? g : best));
}

// The art panel — a species-tinted plate with a large placeholder glyph. Real
// portrait art drops in here later (swap the <span> for an <img>).
function SpecimenArt({
  speciesId,
  isDead,
  className = "",
}: {
  speciesId: string;
  isDead?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg ${getSpeciesTint(speciesId)} ${
        isDead ? "grayscale" : ""
      } ${className}`}
    >
      <span className="leading-none select-none">{getSpeciesEmoji(speciesId)}</span>
    </div>
  );
}

// Shared specimen-card shell used by the roster and battle variants.
function SpecimenCard({
  unit,
  hp,
  isDead,
  isEnemy,
  artClass,
  glyphClass,
  children,
}: {
  unit: Unit;
  hp: number;
  isDead: boolean;
  isEnemy: boolean;
  artClass: string;
  glyphClass: string;
  children?: ReactNode;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono tracking-wider text-muted">
          {specimenTag(unit.id)}
        </span>
        {isEnemy ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/15 text-danger font-semibold">
            ENEMY
          </span>
        ) : (
          <span className={`text-[10px] font-bold ${GRADE_COLOR[bestGrade(unit)]}`}>
            {bestGrade(unit)}-grade
          </span>
        )}
      </div>

      <SpecimenArt
        speciesId={unit.speciesId}
        isDead={isDead}
        className={`${artClass} ${glyphClass}`}
      />

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="font-bold text-ink truncate">{getSpeciesName(unit.speciesId)}</span>
        <span className="text-xs text-muted whitespace-nowrap">Lv.{unit.level}</span>
      </div>

      <HpBar current={hp} max={unit.stats.maxHp} className="mt-1.5" />

      {children}
    </>
  );
}

interface UnitCardProps {
  unit: Unit;
  isEnemy?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export function UnitCard({
  unit,
  isEnemy = false,
  isSelected = false,
  onClick,
  className = "",
  compact = false,
}: UnitCardProps) {
  const isDead = unit.stats.currentHp <= 0;
  const cursor = onClick ? "cursor-pointer" : "";

  // Compact: a dense roster row (lab lists) — small tinted glyph chip + HP.
  if (compact) {
    const border = isSelected ? "border-accent" : "border-line hover:border-muted";
    return (
      <button
        type="button"
        className={`w-full text-left rounded-lg border p-2 bg-panel transition-all ${border} ${cursor} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <SpecimenArt
            speciesId={unit.speciesId}
            isDead={isDead}
            className="h-9 w-9 text-xl shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink truncate">
              {getSpeciesName(unit.speciesId)}
            </div>
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
      </button>
    );
  }

  const border = isSelected
    ? "border-accent ring-2 ring-accent/30"
    : isDead
      ? "border-line opacity-50"
      : isEnemy
        ? "border-danger/50 hover:border-danger"
        : "border-line hover:border-muted";

  return (
    <div
      className={`rounded-xl border p-3 bg-panel transition-all ${border} ${cursor} ${className}`}
      onClick={onClick}
    >
      <SpecimenCard
        unit={unit}
        hp={unit.stats.currentHp}
        isDead={isDead}
        isEnemy={isEnemy}
        artClass="h-24"
        glyphClass="text-5xl"
      >
        <div className="grid grid-cols-3 gap-1 text-xs mt-2">
          <div className="text-center bg-panel-2 rounded p-1">
            <div className="text-muted">SPD</div>
            <div className="text-accent font-bold">{unit.stats.speed}</div>
          </div>
          <div className="text-center bg-panel-2 rounded p-1">
            <div className="text-muted">ATK</div>
            <div className="text-danger font-bold">{unit.stats.attackPower}</div>
          </div>
          <div className="text-center bg-panel-2 rounded p-1">
            <div className="text-muted">STAGE</div>
            <div className={`font-bold ${getLifeStageColor(unit.lifeStage)}`}>
              {getLifeStageLabel(unit.lifeStage)}
            </div>
          </div>
        </div>

        {unit.mutations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {unit.mutations.map((m) => (
              <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-gene/15 text-gene">
                {getMutationName(m)}
              </span>
            ))}
          </div>
        )}

        {unit.equipment.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {unit.equipment.map((e) => (
              <span key={e} className="text-xs px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                {e.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-line grid grid-cols-3 gap-1 text-xs">
          {(["maxHp", "speed", "attackPower"] as const).map((stat) => (
            <div key={stat} className="text-center">
              <span className={GRADE_COLOR[unit.geneticPotential[stat]] ?? "text-muted"}>
                {stat === "maxHp" ? "HP" : stat === "speed" ? "SPD" : "ATK"}{" "}
                {unit.geneticPotential[stat]}
              </span>
            </div>
          ))}
        </div>
      </SpecimenCard>
    </div>
  );
}

// Battle-arena variant: live HP during replay + attack/hit/dead states.
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
  let cardClass = "rounded-xl border p-3 bg-panel transition-all duration-200 ";
  if (isDead) {
    cardClass += "border-line opacity-40 grayscale";
  } else if (isAttacking) {
    cardClass += `border-accent animate-attack ${isEnemy ? "animate-lunge-left" : "animate-lunge-right"}`;
  } else if (isHit) {
    cardClass += "border-danger animate-hit animate-shake";
  } else if (isEnemy) {
    cardClass += "border-danger/40";
  } else {
    cardClass += "border-line";
  }

  return (
    <div className={cardClass}>
      <SpecimenCard
        unit={unit}
        hp={isDead ? 0 : currentHp}
        isDead={isDead}
        isEnemy={isEnemy}
        artClass="h-28"
        glyphClass="text-6xl"
      >
        <div className="flex justify-between text-xs mt-1.5 text-muted tabular-nums">
          <span>SPD {unit.stats.speed}</span>
          <span>ATK {unit.stats.attackPower}</span>
        </div>
      </SpecimenCard>
    </div>
  );
}
