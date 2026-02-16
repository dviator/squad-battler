import {
  BattleState,
  BattleEvent,
  BattleEventType,
  Unit,
} from "./types";
import { isAlive, takeDamage, getAttackById } from "./unit";
import { resolveTargets } from "./targeting";

export function createBattleState(
  playerUnits: Unit[],
  enemyUnits: Unit[]
): BattleState {
  return {
    tick: 0,
    playerUnits,
    enemyUnits,
    events: [{ type: BattleEventType.BattleStart, tick: 0 }],
    isComplete: false,
    winner: null,
  };
}

export function simulateBattle(
  playerUnits: Unit[],
  enemyUnits: Unit[],
  maxTicks: number = 1000
): BattleState {
  let state = createBattleState(playerUnits, enemyUnits);

  while (!state.isComplete && state.tick < maxTicks) {
    state = tickBattle(state);
  }

  if (state.tick >= maxTicks && !state.isComplete) {
    state = {
      ...state,
      isComplete: true,
      winner:
        state.playerUnits.filter(isAlive).length >
        state.enemyUnits.filter(isAlive).length
          ? "player"
          : "enemy",
    };
  }

  return state;
}

export function tickBattle(state: BattleState): BattleState {
  if (state.isComplete) return state;

  const nextTick = state.tick + 1;
  let newState: BattleState = {
    ...state,
    tick: nextTick,
    events: [...state.events, { type: BattleEventType.Tick, tick: nextTick }],
  };

  newState = decrementTimers(newState);
  newState = processReadyAttacks(newState);
  newState = checkBattleEnd(newState);

  return newState;
}

function decrementTimers(state: BattleState): BattleState {
  const updateTimers = (unit: Unit): Unit => {
    if (!isAlive(unit)) return unit;

    return {
      ...unit,
      attackTimers: unit.attackTimers.map((timer) => ({
        ...timer,
        currentCooldown: Math.max(0, timer.currentCooldown - 1),
      })),
    };
  };

  return {
    ...state,
    playerUnits: state.playerUnits.map(updateTimers),
    enemyUnits: state.enemyUnits.map(updateTimers),
  };
}

interface PendingAttack {
  unitId: string;
  isPlayer: boolean;
  attackId: string;
  speed: number;
}

function processReadyAttacks(state: BattleState): BattleState {
  const pendingAttacks: PendingAttack[] = [];

  const collectReadyAttacks = (unit: Unit, isPlayer: boolean) => {
    if (!isAlive(unit)) return;

    unit.attackTimers.forEach((timer) => {
      if (timer.currentCooldown === 0) {
        pendingAttacks.push({
          unitId: unit.id,
          isPlayer,
          attackId: timer.attackId,
          speed: unit.stats.speed,
        });
      }
    });
  };

  state.playerUnits.forEach((u) => collectReadyAttacks(u, true));
  state.enemyUnits.forEach((u) => collectReadyAttacks(u, false));

  pendingAttacks.sort((a, b) => b.speed - a.speed);

  let newState = state;
  pendingAttacks.forEach((pending) => {
    newState = executeAttack(
      newState,
      pending.unitId,
      pending.isPlayer,
      pending.attackId
    );
  });

  return newState;
}

function executeAttack(
  state: BattleState,
  attackerId: string,
  isPlayerAttacker: boolean,
  attackId: string
): BattleState {
  const attackerUnits = isPlayerAttacker
    ? state.playerUnits
    : state.enemyUnits;
  const defenderUnits = isPlayerAttacker
    ? state.enemyUnits
    : state.playerUnits;

  const attacker = attackerUnits.find((u) => u.id === attackerId);
  if (!attacker || !isAlive(attacker)) return state;

  const attack = getAttackById(attacker, attackId);
  if (!attack) return state;

  const allies = attackerUnits;
  const enemies = defenderUnits;
  const targets = resolveTargets(attacker, allies, enemies, attack.targetType);

  if (targets.length === 0) return state;

  const events: BattleEvent[] = [
    ...state.events,
    {
      type: BattleEventType.AttackExecuted,
      tick: state.tick,
      attackerId: attacker.id,
      attackName: attack.name,
      targetIds: targets.map((t) => t.id),
    },
  ];

  let newPlayerUnits = [...state.playerUnits];
  let newEnemyUnits = [...state.enemyUnits];

  targets.forEach((target) => {
    const baseDamage = attacker.stats.attackPower * attack.damageMultiplier;
    const damage = Math.max(1, Math.floor(baseDamage));

    const targetList = isPlayerAttacker ? newEnemyUnits : newPlayerUnits;
    const targetIndex = targetList.findIndex((u) => u.id === target.id);

    if (targetIndex !== -1) {
      const damagedUnit = takeDamage(targetList[targetIndex]!, damage);
      targetList[targetIndex] = damagedUnit;

      events.push({
        type: BattleEventType.Damage,
        tick: state.tick,
        targetId: target.id,
        damage,
        remainingHp: damagedUnit.stats.currentHp,
      });

      if (!isAlive(damagedUnit)) {
        events.push({
          type: BattleEventType.UnitDied,
          tick: state.tick,
          unitId: damagedUnit.id,
        });
      }
    }
  });

  const resetTimer = (unit: Unit): Unit => {
    if (unit.id !== attackerId) return unit;

    return {
      ...unit,
      attackTimers: unit.attackTimers.map((timer) =>
        timer.attackId === attackId
          ? { ...timer, currentCooldown: attack.baseCooldown }
          : timer
      ),
    };
  };

  return {
    ...state,
    playerUnits: newPlayerUnits.map(resetTimer),
    enemyUnits: newEnemyUnits.map(resetTimer),
    events,
  };
}

function checkBattleEnd(state: BattleState): BattleState {
  const livingPlayers = state.playerUnits.filter(isAlive);
  const livingEnemies = state.enemyUnits.filter(isAlive);

  if (livingPlayers.length === 0 && livingEnemies.length === 0) {
    return {
      ...state,
      isComplete: true,
      winner: "player",
      events: [
        ...state.events,
        {
          type: BattleEventType.BattleEnd,
          tick: state.tick,
          winner: "player",
          survivors: [],
        },
      ],
    };
  }

  if (livingPlayers.length === 0) {
    return {
      ...state,
      isComplete: true,
      winner: "enemy",
      events: [
        ...state.events,
        {
          type: BattleEventType.BattleEnd,
          tick: state.tick,
          winner: "enemy",
          survivors: livingEnemies.map((u) => u.id),
        },
      ],
    };
  }

  if (livingEnemies.length === 0) {
    return {
      ...state,
      isComplete: true,
      winner: "player",
      events: [
        ...state.events,
        {
          type: BattleEventType.BattleEnd,
          tick: state.tick,
          winner: "player",
          survivors: livingPlayers.map((u) => u.id),
        },
      ],
    };
  }

  return state;
}
