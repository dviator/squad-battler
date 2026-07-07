import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { BattleEvent, BattleState, Unit } from "@/core/types";
import { BattleEventType } from "@/core/types";
import { formatAttackLine } from "@/web/utils/battleLog";
import { getPrimaryAttackCooldown } from "@/web/utils/characterCard";
import { getSpeciesName } from "@/web/utils/species";

interface ReplayState {
  unitHps: Map<string, number>;
  deadUnitIds: Set<string>;
  activeAttackerId: string | null;
  hitUnitIds: Set<string>;
  /** Per-unit attack-timer progress 0-1: 0=just attacked, 1=ready to fire. */
  unitTimerProgress: Map<string, number>;
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

  const meaningful = useMemo(() => battleState.events.filter(isMeaningful), [battleState.events]);

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

  // Per-unit wall-clock timestamp of last attack — drives the live timer bar.
  const lastAttackTimestampsRef = useRef<Map<string, number>>(
    new Map(allUnits.map((u) => [u.id, Date.now()])),
  );
  // Triggers re-renders so the timer bars animate each frame.
  const [, triggerRender] = useReducer((n: number) => n + 1, 0);
  const animFrameRef = useRef<number | null>(null);

  const baseMs = Math.floor(600 / speed);

  // Animation loop — drives smooth timer bar updates while the battle plays.
  useEffect(() => {
    if (isDone) {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const frame = () => {
      triggerRender();
      animFrameRef.current = requestAnimationFrame(frame);
    };
    animFrameRef.current = requestAnimationFrame(frame);
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDone]);

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
          lastAttackTimestampsRef.current.set(event.attackerId, Date.now());
          const name = getUnitName(event.attackerId);
          const targetNames = event.targetIds.map(getUnitName);
          setLog((l) => [...l, formatAttackLine(name, event.attackName, targetNames)]);
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
            setLog((l) => [...l, `  ${name} takes ${event.damage} dmg → ${event.remainingHp} HP`]);
            setTimeout(
              () => {
                setHitUnitIds((prev) => {
                  const next = new Set(prev);
                  next.delete(event.targetId);
                  return next;
                });
              },
              Math.floor(baseMs * 0.6),
            );
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

  // Compute live timer progress each render (needs fresh Date.now()).
  const now = Date.now();
  const unitTimerProgress = new Map<string, number>();
  for (const unit of allUnits) {
    const lastTs = lastAttackTimestampsRef.current.get(unit.id) ?? now;
    const cooldownMs = getPrimaryAttackCooldown(unit) * baseMs;
    unitTimerProgress.set(unit.id, Math.min(1, (now - lastTs) / cooldownMs));
  }

  return {
    unitHps,
    deadUnitIds,
    activeAttackerId,
    hitUnitIds,
    unitTimerProgress,
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
