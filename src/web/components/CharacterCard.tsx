import type { Unit } from "@/core/types";
import { GeneticGrade } from "@/core/types";
import { getIdleTimerLabel } from "@/web/utils/characterCard";
import { getSpeciesEmoji, getSpeciesTint } from "@/web/utils/species";
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

function bestGrade(unit: Unit): GeneticGrade {
  return (["maxHp", "speed", "attackPower"] as const)
    .map((s) => unit.geneticPotential[s])
    .reduce((best, g) => (GRADE_RANK[g] > GRADE_RANK[best] ? g : best));
}

function specimenTag(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `SPEC-${(h % 1000).toString().padStart(3, "0")}`;
}

// Attack-turn timer bar: 0 = just attacked / battle start, 1 = ready to attack.
function TimerBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(1, progress));
  const colorClass = pct >= 0.85 ? "bg-warning" : pct >= 0.45 ? "bg-accent" : "bg-bio/60";
  return (
    <div className="h-1.5 w-full rounded-full bg-panel-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-100 ${colorClass}`}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}

export interface CharacterCardProps {
  unit: Unit;
  currentHp: number;
  isDead?: boolean;
  isEnemy?: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
  /** Combat timer 0-1 (0=just attacked). Undefined → idle/shop shows stat preview. */
  timerProgress?: number;
  isSelected?: boolean;
  onClick?: () => void;
  /** Compact shrinks the portrait for horizontal squad strips. */
  compact?: boolean;
  className?: string;
}

export function CharacterCard({
  unit,
  currentHp,
  isDead = false,
  isEnemy = false,
  isAttacking = false,
  isHit = false,
  timerProgress,
  isSelected = false,
  onClick,
  compact = false,
  className = "",
}: CharacterCardProps) {
  const inCombat = timerProgress !== undefined;

  let borderClass: string;
  if (isDead) {
    borderClass = "border-line opacity-40 grayscale";
  } else if (isSelected) {
    borderClass = "border-accent ring-2 ring-accent/30";
  } else if (isAttacking) {
    borderClass = `border-accent animate-attack ${isEnemy ? "animate-lunge-left" : "animate-lunge-right"}`;
  } else if (isHit) {
    borderClass = "border-danger animate-hit animate-shake";
  } else if (isEnemy) {
    borderClass = "border-danger/40";
  } else {
    borderClass = "border-line";
  }

  const interactiveClass = onClick && !isDead ? "cursor-pointer hover:border-muted" : "";
  const artHeight = compact ? "h-12" : "h-20";
  const glyphSize = compact ? "text-xl" : "text-5xl";

  return (
    <div
      className={`rounded-xl border p-2 bg-panel transition-all duration-200 ${borderClass} ${interactiveClass} ${className}`}
      onClick={onClick}
    >
      {/* Header: specimen tag + grade */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-mono tracking-wider text-muted">
          {specimenTag(unit.id)}
        </span>
        {!isEnemy && (
          <span className={`text-[9px] font-bold ${GRADE_COLOR[bestGrade(unit)]}`}>
            {bestGrade(unit)}
          </span>
        )}
      </div>

      {/* Portrait — art-ready slot; real portraits drop straight in here */}
      <div
        className={`flex items-center justify-center rounded-md ${getSpeciesTint(unit.speciesId)} ${
          isDead ? "grayscale opacity-50" : ""
        } ${artHeight} w-full`}
      >
        <span className={`leading-none select-none ${glyphSize}`}>
          {getSpeciesEmoji(unit.speciesId)}
        </span>
      </div>

      {/* HP bar */}
      <HpBar current={isDead ? 0 : currentHp} max={unit.stats.maxHp} className="mt-1.5" />

      {/* Attack-icon slot — art-ready placeholder */}
      <div className="mt-1.5 flex items-center gap-1 min-w-0">
        <div className="h-5 w-5 rounded bg-panel-2 border border-line flex items-center justify-center shrink-0">
          <span className="text-[9px] text-muted">⚔</span>
        </div>
        <span className="text-[9px] text-muted truncate">
          {unit.attacks[0]?.id.replace(/_/g, " ") ?? "—"}
        </span>
      </div>

      {/* Attack-turn timer: live bar in combat, static preview at rest */}
      <div className="mt-1">
        {inCombat ? (
          <TimerBar progress={timerProgress} />
        ) : (
          <div className="text-[9px] text-muted tabular-nums">{getIdleTimerLabel(unit)}</div>
        )}
      </div>
    </div>
  );
}
