import { getHpColor } from "@/web/utils/species";

interface HpBarProps {
  current: number;
  max: number;
  showNumbers?: boolean;
  className?: string;
}

export function HpBar({ current, max, showNumbers = true, className = "" }: HpBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const colorClass = getHpColor(pct);

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <div className="h-2 w-full rounded-full bg-panel-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      {showNumbers && (
        <div className="text-xs text-muted tabular-nums">
          {current}/{max}
        </div>
      )}
    </div>
  );
}
