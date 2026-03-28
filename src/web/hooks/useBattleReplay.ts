import { BattleEventType } from "@/core/types";
import type { BattleEvent, BattleState, Unit } from "@/core/types";
import { getSpeciesName } from "@/web/utils/species";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ReplayState {
  unitHps: Map<string, number>;
  deadUnitIds: Set<string>;
  activeAttackerId: string | null;
  hitUnitIds: Set<string>;
  log: string[];
  isDone: boolean;
  isPlaying: boolean;
  speed: number;
  setSpeed(s: number): void;
  skipToEnd(): void;
  pause(): void;
  play(): void;
}

function isMeaningful(event: BattleEvent): boolean {
  return event.type !== BattleEventType.Tick;
}

function getEventDelay(event: BattleEvent, baseMs: number): number {
  switch (event.type) {
    case BattleEventType.BattleStart:
      return baseMs * 0.5;
    case BattleEventType.AttackExecuted:
      return baseMs;
    case BattleEventType.Damage:
      return baseMs * 0.8;
    case BattleEventType.UnitDied:
      return baseMs * 1.2;
    case BattleEventType.BattleEnd:
      return baseMs * 1.5;
    default:
      return baseMs * 0.5;
  }
}

export function useBattleReplay(
  battleState: BattleState,
  initialPlayerUnits: Unit[],
  initialEnemyUnits: Unit[],
): ReplayState {
  const allUnits = useMemo(
    () => [...initialPlayerUnits, ...initialEnemyUnits],
    [initialPlayerUnits, initialEnemyUnits],
  );

  const meaningful = useMemo(
    () => battleState.events.filter(isMeaningful),
    [battleState.events],
  );

  const initialHps = useMemo(() => {
    const map = new Map<string, number>();
    for (const unit of allUnits) {
      map.set(unit.id, unit.stats.currentHp);
    }
    return map;
  }, [allUnits]);

  const getUnitName = useCallback(
    (id: string) => {
      const unit = allUnits.find((u) => u.id === id);
      return unit ? getSpeciesName(unit.speciesId) : "???";
    },
    [allUnits],
  );

  const [eventIndex, setEventIndex] = useState(0);
  const [unitHps, setUnitHps] = useState<Map<string, number>>(new Map(initialHps));
  const [deadUnitIds, setDeadUnitIds] = useState<Set<string>>(new Set());
  const [activeAttackerId, setActiveAttackerId] = useState<string | null>(null);
  const [hitUnitIds, setHitUnitIds] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<string[]>(["⚔️ Battle begins!"]);
  const [isDone, setIsDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  const baseMs = Math.floor(600 / speed);

  useEffect(() => {
    if (!isPlaying || isDone) return;
    if (eventIndex >= meaningful.length) {
      setIsDone(true);
      return;
    }

    const event = meaningful[eventIndex];
    if (!event) return;

    const delay = getEventDelay(event, baseMs);

    const timer = setTimeout(() => {
      switch (event.type) {
        case BattleEventType.AttackExecuted: {
          setActiveAttackerId(event.attackerId);
          const name = getUnitName(event.attackerId);
          setLog((l) => [...l, `${name} uses ${event.attackName}!`]);
          break;
        }
        case BattleEventType.Damage: {
          if (event.damage === 0) {
            const name = getUnitName(event.targetId);
            setLog((l) => [...l, `  ${name} blocked/dodged!`]);
          } else {
            setUnitHps((prev) => {
              const next = new Map(prev);
              next.set(event.targetId, event.remainingHp);
              return next;
            });
            setHitUnitIds((prev) => new Set(prev).add(event.targetId));
            const name = getUnitName(event.targetId);
            setLog((l) => [
              ...l,
              `  ${name} takes ${event.damage} dmg → ${event.remainingHp} HP`,
            ]);
            setTimeout(() => {
              setHitUnitIds((prev) => {
                const next = new Set(prev);
                next.delete(event.targetId);
                return next;
              });
            }, Math.floor(baseMs * 0.6));
          }
          break;
        }
        case BattleEventType.UnitDied: {
          setDeadUnitIds((prev) => new Set(prev).add(event.unitId));
          const name = getUnitName(event.unitId);
          setLog((l) => [...l, `💀 ${name} has fallen!`]);
          setActiveAttackerId(null);
          break;
        }
        case BattleEventType.BattleEnd: {
          const msg = event.winner === "player" ? "🏆 Victory!" : "💔 Defeat!";
          setLog((l) => [...l, msg]);
          setActiveAttackerId(null);
          break;
        }
        default:
          setActiveAttackerId(null);
      }

      setEventIndex((i) => i + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, isDone, eventIndex, meaningful, baseMs, getUnitName]);

  const skipToEnd = useCallback(() => {
    // Process all remaining events instantly
    const remaining = meaningful.slice(eventIndex);
    const newHps = new Map(unitHps);
    const newDead = new Set(deadUnitIds);
    const newLog: string[] = [];

    for (const event of remaining) {
      if (event.type === BattleEventType.Damage && event.damage > 0) {
        newHps.set(event.targetId, event.remainingHp);
      } else if (event.type === BattleEventType.UnitDied) {
        newDead.add(event.unitId);
      } else if (event.type === BattleEventType.BattleEnd) {
        newLog.push(event.winner === "player" ? "🏆 Victory!" : "💔 Defeat!");
      }
    }

    setUnitHps(newHps);
    setDeadUnitIds(newDead);
    setHitUnitIds(new Set());
    setActiveAttackerId(null);
    setLog((l) => [...l, ...newLog]);
    setEventIndex(meaningful.length);
    setIsDone(true);
    setIsPlaying(false);
  }, [eventIndex, meaningful, unitHps, deadUnitIds]);

  return {
    unitHps,
    deadUnitIds,
    activeAttackerId,
    hitUnitIds,
    log,
    isDone,
    isPlaying,
    speed,
    setSpeed,
    skipToEnd,
    pause: () => setIsPlaying(false),
    play: () => setIsPlaying(true),
  };
}
