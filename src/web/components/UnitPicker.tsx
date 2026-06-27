import type { Unit } from "@/core/types";
import { getSpeciesEmoji, getSpeciesName } from "@/web/utils/species";
import { HpBar } from "./HpBar";

interface UnitPickerProps {
  units: Unit[];
  title?: string;
  onSelect(unit: Unit): void;
  onCancel(): void;
}

export function UnitPicker({
  units,
  title = "Select a unit",
  onSelect,
  onCancel,
}: UnitPickerProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-panel border border-line rounded-2xl p-4 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-semibold text-ink mb-3">{title}</div>
        <div className="flex flex-col gap-2">
          {units.map((unit) => {
            const isDead = unit.stats.currentHp <= 0;
            return (
              <button
                key={unit.id}
                type="button"
                disabled={isDead}
                onClick={() => !isDead && onSelect(unit)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border
                  border-line hover:border-accent/40 bg-panel-2 hover:bg-panel-2
                  transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
              >
                <span className="text-2xl">{getSpeciesEmoji(unit.speciesId)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink">
                    {getSpeciesName(unit.speciesId)}{" "}
                    <span className="text-muted font-normal text-xs">Lv.{unit.level}</span>
                  </div>
                  <HpBar current={unit.stats.currentHp} max={unit.stats.maxHp} className="mt-1" />
                </div>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full py-2 text-sm text-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
