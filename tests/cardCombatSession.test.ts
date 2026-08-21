import { describe, expect, test } from "vitest";
import { createSession, sessionChoose, sessionDraw } from "../src/core/cardCombatSession";
import { BEAR_DECK, EAGLE_DECK } from "../src/data/cards";

const PLAYER_HP = 100;
const ENEMY_HP = 100;

const allTop = (hand: { id: string }[]) =>
  hand.map((c) => ({ cardId: c.id, face: "top" as const }));
const allBottom = (hand: { id: string }[]) =>
  hand.map((c) => ({ cardId: c.id, face: "bottom" as const }));

describe("createSession", () => {
  test("starts in draw phase", () => {
    const session = createSession(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    expect(session.phase).toBe("draw");
  });

  test("combat state starts at turn 0 and is not complete", () => {
    const session = createSession(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    expect(session.combatState.turnNumber).toBe(0);
    expect(session.combatState.isComplete).toBe(false);
    expect(session.combatState.winner).toBeNull();
  });

  test("combat state has empty hands initially", () => {
    const session = createSession(BEAR_DECK, EAGLE_DECK, PLAYER_HP, ENEMY_HP);
    expect(session.combatState.playerHand).toHaveLength(0);
    expect(session.combatState.enemyHand).toHaveLength(0);
  });
});

describe("sessionDraw", () => {
  test("transitions phase from draw to choose", () => {
    const session = createSession(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    const after = sessionDraw(session);
    expect(after.phase).toBe("choose");
  });

  test("draws 3 cards into the player hand", () => {
    const session = createSession(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    const after = sessionDraw(session);
    expect(after.combatState.playerHand).toHaveLength(3);
  });

  test("enemy intents are populated (one per enemy hand card)", () => {
    const session = createSession(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    const after = sessionDraw(session);
    expect(after.combatState.enemyIntents).toHaveLength(after.combatState.enemyHand.length);
  });

  test("does not mutate the original session", () => {
    const session = createSession(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    const originalPhase = session.phase;
    sessionDraw(session);
    expect(session.phase).toBe(originalPhase);
  });
});

describe("sessionChoose", () => {
  test("transitions phase from choose to draw when combat continues", () => {
    const session = createSession(BEAR_DECK, BEAR_DECK, 1000, 1000);
    const afterDraw = sessionDraw(session);
    const afterChoose = sessionChoose(afterDraw, allTop(afterDraw.combatState.playerHand));
    expect(afterChoose.phase).toBe("draw");
  });

  test("transitions phase to complete when combat ends", () => {
    const session = createSession(BEAR_DECK, BEAR_DECK, PLAYER_HP, 1);
    const afterDraw = sessionDraw(session);
    const afterChoose = sessionChoose(afterDraw, allTop(afterDraw.combatState.playerHand));
    expect(afterChoose.phase).toBe("complete");
    expect(afterChoose.combatState.isComplete).toBe(true);
    expect(afterChoose.combatState.winner).toBe("player");
  });

  test("player attack reduces enemy HP", () => {
    const session = createSession(BEAR_DECK, BEAR_DECK, 1000, 1000);
    const afterDraw = sessionDraw(session);
    const afterChoose = sessionChoose(afterDraw, allTop(afterDraw.combatState.playerHand));
    expect(afterChoose.combatState.enemySquadHp).toBeLessThan(1000);
  });

  test("player defend reduces incoming damage compared to all-attack", () => {
    const session = createSession(BEAR_DECK, BEAR_DECK, 1000, 1000);
    const afterDraw = sessionDraw(session);

    const withAttack = sessionChoose(afterDraw, allTop(afterDraw.combatState.playerHand));
    const withDefend = sessionChoose(afterDraw, allBottom(afterDraw.combatState.playerHand));
    expect(withDefend.combatState.playerSquadHp).toBeGreaterThan(
      withAttack.combatState.playerSquadHp,
    );
  });

  test("clears hand and intents after choices resolved", () => {
    const session = createSession(BEAR_DECK, BEAR_DECK, 1000, 1000);
    const afterDraw = sessionDraw(session);
    const afterChoose = sessionChoose(afterDraw, allTop(afterDraw.combatState.playerHand));
    expect(afterChoose.combatState.playerHand).toHaveLength(0);
    expect(afterChoose.combatState.enemyIntents).toHaveLength(0);
  });
});

describe("full session cycle", () => {
  test("draw → choose → draw cycle works across multiple turns", () => {
    let session = createSession(BEAR_DECK, BEAR_DECK, 1000, 1000);
    expect(session.phase).toBe("draw");

    session = sessionDraw(session);
    expect(session.phase).toBe("choose");

    session = sessionChoose(session, allTop(session.combatState.playerHand));
    expect(session.phase).toBe("draw");

    session = sessionDraw(session);
    expect(session.phase).toBe("choose");
  });

  test("session reaches complete phase and stays complete", () => {
    let session = createSession(BEAR_DECK, BEAR_DECK, 30, 30);
    let turns = 0;
    while (session.phase !== "complete" && turns < 20) {
      session = sessionDraw(session);
      session = sessionChoose(session, allTop(session.combatState.playerHand));
      turns++;
    }
    expect(session.phase).toBe("complete");
    expect(session.combatState.winner).not.toBeNull();
  });
});
