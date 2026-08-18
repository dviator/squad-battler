import { describe, expect, test } from "vitest";
import { createCardCombatState, drawHand } from "../src/core/cardCombat";
import { GreedyPolicy, simulateCardBattle } from "../src/core/combatPolicy";
import { BEAR_DECK, EAGLE_DECK, TIGER_DECK } from "../src/data/cards";

describe("GreedyPolicy", () => {
  test("is deterministic: same state + hand + ownHp → same choices", () => {
    const state = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, 100, 100));
    const choices1 = GreedyPolicy.choose(state, state.playerHand, state.playerSquadHp);
    const choices2 = GreedyPolicy.choose(state, state.playerHand, state.playerSquadHp);
    expect(choices1).toEqual(choices2);
  });

  test("produces one choice per card in hand", () => {
    const state = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, 100, 100));
    const choices = GreedyPolicy.choose(state, state.playerHand, 100);
    expect(choices).toHaveLength(state.playerHand.length);
  });

  test("choice cardIds match hand card ids", () => {
    const state = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, 100, 100));
    const choices = GreedyPolicy.choose(state, state.playerHand, 100);
    const handIds = new Set(state.playerHand.map((c) => c.id));
    for (const choice of choices) {
      expect(handIds.has(choice.cardId)).toBe(true);
    }
  });

  test("always picks top face when HP is above threshold (high HP)", () => {
    const state = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, 100, 100));
    const choices = GreedyPolicy.choose(state, state.playerHand, 100);
    expect(choices.every((c) => c.face === "top")).toBe(true);
  });

  test("always picks top face when HP is exactly at threshold (HP = 50)", () => {
    const state = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, 100, 100));
    const choices = GreedyPolicy.choose(state, state.playerHand, 50);
    expect(choices.every((c) => c.face === "top")).toBe(true);
  });

  test("picks bottom face for defend cards when HP drops below 50", () => {
    const state = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, 100, 100));
    const choices = GreedyPolicy.choose(state, state.playerHand, 49);
    const defendCards = state.playerHand.filter((c) => c.bottom.type === "defend");
    const defendChoices = choices.filter((c) => defendCards.some((d) => d.id === c.cardId));
    expect(defendChoices.every((c) => c.face === "bottom")).toBe(true);
  });

  test("non-defend cards still use top face when HP is low", () => {
    const state = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, 100, 100));
    const choices = GreedyPolicy.choose(state, state.playerHand, 49);
    const nonDefendCards = state.playerHand.filter((c) => c.bottom.type !== "defend");
    const nonDefendChoices = choices.filter((c) => nonDefendCards.some((d) => d.id === c.cardId));
    expect(nonDefendChoices.every((c) => c.face === "top")).toBe(true);
  });
});

describe("simulateCardBattle", () => {
  test("runs to completion (isComplete=true, winner set)", () => {
    const result = simulateCardBattle(BEAR_DECK, EAGLE_DECK, 100, 100, GreedyPolicy);
    expect(result.isComplete).toBe(true);
    expect(result.winner).not.toBeNull();
  });

  test("winner is 'player' or 'enemy'", () => {
    const result = simulateCardBattle(TIGER_DECK, EAGLE_DECK, 100, 100, GreedyPolicy);
    expect(["player", "enemy"]).toContain(result.winner);
  });

  test("completes within the 100-turn safety cap", () => {
    const result = simulateCardBattle(BEAR_DECK, BEAR_DECK, 100, 100, GreedyPolicy);
    expect(result.turnNumber).toBeLessThanOrEqual(100);
  });

  test("all species matchups resolve within 30 turns", () => {
    const decks = [BEAR_DECK, EAGLE_DECK, TIGER_DECK];
    for (const player of decks) {
      for (const enemy of decks) {
        const result = simulateCardBattle(player, enemy, 100, 100, GreedyPolicy);
        expect(result.turnNumber).toBeLessThan(30);
      }
    }
  });

  test("is deterministic: same inputs → same winner, turn count, and final HP", () => {
    const r1 = simulateCardBattle(BEAR_DECK, EAGLE_DECK, 100, 100, GreedyPolicy);
    const r2 = simulateCardBattle(BEAR_DECK, EAGLE_DECK, 100, 100, GreedyPolicy);
    expect(r1.winner).toBe(r2.winner);
    expect(r1.turnNumber).toBe(r2.turnNumber);
    expect(r1.playerSquadHp).toBe(r2.playerSquadHp);
    expect(r1.enemySquadHp).toBe(r2.enemySquadHp);
  });

  test("loser ends with 0 HP", () => {
    const result = simulateCardBattle(BEAR_DECK, EAGLE_DECK, 100, 100, GreedyPolicy);
    if (result.winner === "player") {
      expect(result.enemySquadHp).toBe(0);
    } else {
      expect(result.playerSquadHp).toBe(0);
    }
  });
});
