import {
  applyDamageReduction,
  applySpeedBoosts,
  calculateRetaliationDamage,
  initializeCombatEffectStates,
  markAttackBlocked,
  markAttackDodged,
  shouldBlockAttack,
  shouldDodgeAttack,
  shouldRedirectAttack,
} from "./combatEffects";
import { SHOP_ITEMS } from "./shop";
import { resolveTargets } from "./targeting";
import {
  type BattleEvent,
  BattleEventType,
  type BattleState,
  TargetType,
  type Unit,
} from "./types";
import { getAttackById, isAlive, takeDamage } from "./unit";

export function createBattleState(playerUnits: Unit[], enemyUnits: Unit[]): BattleState {
  // Apply speed boosts from equipment before combat starts
  const boostedPlayerUnits = playerUnits.map((unit) => applySpeedBoosts(unit, SHOP_ITEMS));
  const boostedEnemyUnits = enemyUnits.map((unit) => applySpeedBoosts(unit, SHOP_ITEMS));

  // Initialize combat effect states for tracking per-combat effects
  const allUnits = [...boostedPlayerUnits, ...boostedEnemyUnits];
  const combatEffectStates = initializeCombatEffectStates(allUnits);

  return {
    tick: 0,
    playerUnits: boostedPlayerUnits,
    enemyUnits: boostedEnemyUnits,
    events: [{ type: BattleEventType.BattleStart, tick: 0 }],
    isComplete: false,
    winner: null,
    combatEffectStates,
    lastPlayerTargetId: null,
  };
}

export function simulateBattle(
  playerUnits: Unit[],
  enemyUnits: Unit[],
  maxTicks: number = 1000,
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
        state.playerUnits.filter(isAlive).length > state.enemyUnits.filter(isAlive).length
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

  const collectReadyAttacks = (unit: Unit, isPlayer: boolean, allAllies: Unit[]) => {
    if (!isAlive(unit)) return;

    let speed = unit.stats.speed;
    // Lone Wolf speed bonus: +50% speed when last surviving player unit
    if (
      isPlayer &&
      unit.mutations.includes("lone_wolf") &&
      allAllies.filter(isAlive).length === 1
    ) {
      speed = Math.floor(speed * 1.5);
    }

    unit.attackTimers.forEach((timer) => {
      if (timer.currentCooldown === 0) {
        pendingAttacks.push({
          unitId: unit.id,
          isPlayer,
          attackId: timer.attackId,
          speed,
        });
      }
    });
  };

  state.playerUnits.forEach((u) => collectReadyAttacks(u, true, state.playerUnits));
  state.enemyUnits.forEach((u) => collectReadyAttacks(u, false, state.enemyUnits));

  pendingAttacks.sort((a, b) => b.speed - a.speed);

  let newState = state;
  pendingAttacks.forEach((pending) => {
    newState = executeAttack(newState, pending.unitId, pending.isPlayer, pending.attackId);
  });

  return newState;
}

function executeAttack(
  state: BattleState,
  attackerId: string,
  isPlayerAttacker: boolean,
  attackId: string,
): BattleState {
  const attackerUnits = isPlayerAttacker ? state.playerUnits : state.enemyUnits;
  const defenderUnits = isPlayerAttacker ? state.enemyUnits : state.playerUnits;

  const attacker = attackerUnits.find((u) => u.id === attackerId);
  if (!attacker || !isAlive(attacker)) return state;

  const attack = getAttackById(attacker, attackId);
  if (!attack) return state;

  const allies = attackerUnits;
  const enemies = defenderUnits;
  let targets = resolveTargets(
    attacker,
    allies,
    enemies,
    attack.targetType,
    isPlayerAttacker ? state.lastPlayerTargetId : undefined,
  );

  // Check for attack redirection (Enemy Confuser)
  if (shouldRedirectAttack(attacker, SHOP_ITEMS) && enemies.filter(isAlive).length > 1) {
    const aliveEnemies = enemies.filter(isAlive);
    const randomTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    if (randomTarget) {
      targets = [randomTarget];
    }
  }

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

  const newPlayerUnits = [...state.playerUnits];
  const newEnemyUnits = [...state.enemyUnits];
  let effectStates = state.combatEffectStates || [];

  targets.forEach((target) => {
    const targetList = isPlayerAttacker ? newEnemyUnits : newPlayerUnits;
    const targetIndex = targetList.findIndex((u) => u.id === target.id);

    if (targetIndex === -1) return;

    const defender = targetList[targetIndex]!;
    const defenderEffectState = effectStates.find((s) => s.unitId === defender.id);

    if (!defenderEffectState) return;

    // Check for block (Bubble Shield)
    if (shouldBlockAttack(defender, SHOP_ITEMS, defenderEffectState)) {
      effectStates = markAttackBlocked(effectStates, defender.id);
      events.push({
        type: BattleEventType.Damage,
        tick: state.tick,
        targetId: target.id,
        damage: 0,
        remainingHp: defender.stats.currentHp,
      });
      return;
    }

    // Check for dodge (Mind Reader)
    if (shouldDodgeAttack(defender, SHOP_ITEMS, defenderEffectState)) {
      effectStates = markAttackDodged(effectStates, defender.id);
      events.push({
        type: BattleEventType.Damage,
        tick: state.tick,
        targetId: target.id,
        damage: 0,
        remainingHp: defender.stats.currentHp,
      });
      return;
    }

    // Calculate base damage
    let attackPower = attacker.stats.attackPower;

    // Lone Wolf: if attacker has lone_wolf mutation and is the last surviving player unit
    if (
      isPlayerAttacker &&
      attacker.mutations.includes("lone_wolf") &&
      attackerUnits.filter(isAlive).length === 1
    ) {
      attackPower = Math.floor(attackPower * 1.5); // +50% attack power
    }

    let damageMultiplier = attack.damageMultiplier;

    // Swarm bonus: if this attack targets the last player target, bonus damage
    if (
      isPlayerAttacker &&
      attack.targetType === TargetType.LastPlayerTarget &&
      state.lastPlayerTargetId &&
      target.id === state.lastPlayerTargetId
    ) {
      damageMultiplier *= 1.5; // 50% bonus damage for focus-firing
    }

    // Calculate damage with reduction (Team Shield Generator)
    const baseDamage = attackPower * damageMultiplier;
    const defenderSquad = isPlayerAttacker ? newEnemyUnits : newPlayerUnits;
    const reducedDamage = applyDamageReduction(
      Math.floor(baseDamage),
      defender,
      defenderSquad,
      SHOP_ITEMS,
    );
    const finalDamage = Math.max(1, reducedDamage);

    const damagedUnit = takeDamage(defender, finalDamage);
    targetList[targetIndex] = damagedUnit;

    events.push({
      type: BattleEventType.Damage,
      tick: state.tick,
      targetId: target.id,
      damage: finalDamage,
      remainingHp: damagedUnit.stats.currentHp,
    });

    if (!isAlive(damagedUnit)) {
      events.push({
        type: BattleEventType.UnitDied,
        tick: state.tick,
        unitId: damagedUnit.id,
      });
    }

    // Apply retaliation damage (Spike Armor)
    const retaliationDamage = calculateRetaliationDamage(defender, SHOP_ITEMS);
    if (retaliationDamage > 0 && isAlive(attacker)) {
      const attackerList = isPlayerAttacker ? newPlayerUnits : newEnemyUnits;
      const attackerIndex = attackerList.findIndex((u) => u.id === attacker.id);

      if (attackerIndex !== -1) {
        const retaliatedAttacker = takeDamage(attackerList[attackerIndex]!, retaliationDamage);
        attackerList[attackerIndex] = retaliatedAttacker;

        events.push({
          type: BattleEventType.Damage,
          tick: state.tick,
          targetId: attacker.id,
          damage: retaliationDamage,
          remainingHp: retaliatedAttacker.stats.currentHp,
        });

        if (!isAlive(retaliatedAttacker)) {
          events.push({
            type: BattleEventType.UnitDied,
            tick: state.tick,
            unitId: retaliatedAttacker.id,
          });
        }
      }
    }
  });

  const resetTimer = (unit: Unit): Unit => {
    if (unit.id !== attackerId) return unit;

    // Apply run-scoped cooldown reduction
    const effectiveCooldown = Math.max(1, attack.baseCooldown - unit.cooldownReduction);

    return {
      ...unit,
      attackTimers: unit.attackTimers.map((timer) =>
        timer.attackId === attackId ? { ...timer, currentCooldown: effectiveCooldown } : timer,
      ),
    };
  };

  // Track the last player target for Swarm mechanics
  const lastPlayerTargetId = isPlayerAttacker
    ? (targets[0]?.id ?? state.lastPlayerTargetId)
    : state.lastPlayerTargetId;

  return {
    ...state,
    playerUnits: newPlayerUnits.map(resetTimer),
    enemyUnits: newEnemyUnits.map(resetTimer),
    events,
    combatEffectStates: effectStates,
    lastPlayerTargetId,
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
