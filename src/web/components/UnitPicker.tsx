import type { Unit } from "@/core/types";
import { getSpeciesEmoji, getSpeciesName } from "@/web/utils/species";
import { HpBar } from "./HpBar";

interface UnitPickerProps {
  units: Unit[];
  title?: string;
  onSelect(unit: Unit): void;
  onCancel(): void;
}

export function UnitPicker({ units, title = "Select a unit", onSelect, onCancel }: UnitPickerProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-semibold text-zinc-300 mb-3">{title}</div>
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
                  border-zinc-700 hover:border-cyan-500 bg-zinc-800 hover:bg-zinc-750
                  transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
              >
                <span className="text-2xl">{getSpeciesEmoji(unit.speciesId)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-100">
                    {getSpeciesName(unit.speciesId)}{" "}
                    <span className="text-zinc-500 font-normal text-xs">Lv.{unit.level}</span>
                  </div>
                  <HpBar
                    current={unit.stats.currentHp}
                    max={unit.stats.maxHp}
                    className="mt-1"
                  />
                </div>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
