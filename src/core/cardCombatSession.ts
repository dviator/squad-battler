import type { CardChoice, CardCombatState } from "./cardCombat";
import { createCardCombatState, drawHand, resolveChoices } from "./cardCombat";
import type { Deck } from "./cards";

export type CombatPhase = "draw" | "choose" | "complete";

export interface CardCombatSession {
  combatState: CardCombatState;
  phase: CombatPhase;
}

export function createSession(
  playerDeck: Deck,
  enemyDeck: Deck,
  playerHp: number,
  enemyHp: number,
): CardCombatSession {
  return {
    combatState: createCardCombatState(playerDeck, enemyDeck, playerHp, enemyHp),
    phase: "draw",
  };
}

// Draws 3 cards and telegraphs enemy intents. Valid only in "draw" phase.
export function sessionDraw(session: CardCombatSession): CardCombatSession {
  const combatState = drawHand(session.combatState);
  return { combatState, phase: "choose" };
}

// Resolves the player's face choices against enemy intents. Valid only in "choose" phase.
export function sessionChoose(
  session: CardCombatSession,
  choices: CardChoice[],
): CardCombatSession {
  const combatState = resolveChoices(session.combatState, choices);
  const phase: CombatPhase = combatState.isComplete ? "complete" : "draw";
  return { combatState, phase };
}
