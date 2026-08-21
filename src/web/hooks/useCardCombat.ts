import { useCallback, useState } from "react";
import type { CardChoice } from "@/core/cardCombat";
import type { CardCombatSession } from "@/core/cardCombatSession";
import { createSession, sessionChoose, sessionDraw } from "@/core/cardCombatSession";
import type { Deck } from "@/core/cards";

export interface UseCardCombatResult {
  session: CardCombatSession;
  draw: () => void;
  submitChoices: (choices: CardChoice[]) => void;
}

export function useCardCombat(
  playerDeck: Deck,
  enemyDeck: Deck,
  playerHp: number,
  enemyHp: number,
): UseCardCombatResult {
  const [session, setSession] = useState<CardCombatSession>(() =>
    createSession(playerDeck, enemyDeck, playerHp, enemyHp),
  );

  const draw = useCallback(() => {
    setSession((s) => sessionDraw(s));
  }, []);

  const submitChoices = useCallback((choices: CardChoice[]) => {
    setSession((s) => sessionChoose(s, choices));
  }, []);

  return { session, draw, submitChoices };
}
