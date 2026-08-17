import { describe, expect, test } from "vitest";
import {
  createCardCombatState,
  drawHand,
  resolveCardTarget,
  resolveChoices,
} from "../src/core/cardCombat";
import { Position, TargetType } from "../src/core/types";
import { BEAR_DECK, EAGLE_DECK, TIGER_DECK } from "../src/data/cards";

const PLAYER_HP = 100;
const ENEMY_HP = 100;

const THREE_SPECIES_DECK = [...BEAR_DECK, ...EAGLE_DECK, ...TIGER_DECK];

// Helpers
const allTop = (hand: { id: string }[]) =>
  hand.map((c) => ({ cardId: c.id, face: "top" as const }));
const allBottom = (hand: { id: string }[]) =>
  hand.map((c) => ({ cardId: c.id, face: "bottom" as const }));

describe("createCardCombatState", () => {
  test("sets HP totals from parameters", () => {
    const state = createCardCombatState(BEAR_DECK, BEAR_DECK, 80, 120);
    expect(state.playerSquadHp).toBe(80);
    expect(state.enemySquadHp).toBe(120);
  });

  test("starts with empty hands, discard, and no intents", () => {
    const state = createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    expect(state.playerHand).toHaveLength(0);
    expect(state.enemyHand).toHaveLength(0);
    expect(state.playerDiscard).toHaveLength(0);
    expect(state.enemyDiscard).toHaveLength(0);
    expect(state.enemyIntents).toHaveLength(0);
  });

  test("starts at turn 0, not complete, no winner", () => {
    const state = createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    expect(state.turnNumber).toBe(0);
    expect(state.isComplete).toBe(false);
    expect(state.winner).toBeNull();
  });

  test("derives one slot per unique speciesId in the deck", () => {
    const state = createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    expect(state.playerSlots).toHaveLength(1);
    expect(state.playerSlots[0]!.speciesId).toBe("bear");
  });

  test("assigns Left, Center, Right positions in order of first appearance", () => {
    const state = createCardCombatState(
      THREE_SPECIES_DECK,
      THREE_SPECIES_DECK,
      PLAYER_HP,
      ENEMY_HP,
    );
    expect(state.playerSlots).toHaveLength(3);
    expect(state.playerSlots[0]!.position).toBe(Position.Left);
    expect(state.playerSlots[1]!.position).toBe(Position.Center);
    expect(state.playerSlots[2]!.position).toBe(Position.Right);
  });

  test("deck is set to the provided deck (no cards consumed yet)", () => {
    const state = createCardCombatState(BEAR_DECK, EAGLE_DECK, PLAYER_HP, ENEMY_HP);
    expect(state.playerDeck).toHaveLength(BEAR_DECK.length);
    expect(state.enemyDeck).toHaveLength(EAGLE_DECK.length);
  });
});

describe("drawHand", () => {
  test("draws exactly 3 cards into player hand", () => {
    const s = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP));
    expect(s.playerHand).toHaveLength(3);
  });

  test("draws exactly 3 cards into enemy hand", () => {
    const s = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP));
    expect(s.enemyHand).toHaveLength(3);
  });

  test("enemy intents are generated (one per enemy hand card)", () => {
    const s = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP));
    expect(s.enemyIntents).toHaveLength(s.enemyHand.length);
  });

  test("enemy intents reference cards present in enemy hand", () => {
    const s = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP));
    const handIds = new Set(s.enemyHand.map((c) => c.id));
    for (const intent of s.enemyIntents) {
      expect(handIds.has(intent.cardId)).toBe(true);
    }
  });

  test("increments turnNumber by 1", () => {
    const s = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP));
    expect(s.turnNumber).toBe(1);
  });

  test("removes drawn cards from the player deck", () => {
    const s = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP));
    // BEAR_DECK has 4 cards; 3 drawn → 1 remaining
    expect(s.playerDeck).toHaveLength(BEAR_DECK.length - 3);
  });

  test("reshuffles discard when deck has fewer than 3 cards", () => {
    // Turn 1: draw 3, deck has 1 left (4-3)
    // After resolve: discard has 3, deck has 1
    // Turn 2: deck (1) + discard (3) = 4 → reshuffle → can draw 3
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    state = drawHand(state);
    state = resolveChoices(state, allTop(state.playerHand));

    expect(state.playerDeck).toHaveLength(1);
    expect(state.playerDiscard).toHaveLength(3);

    state = drawHand(state);
    expect(state.playerHand).toHaveLength(3);
    expect(state.playerDiscard).toHaveLength(0); // discard flushed into deck
  });

  test("drawn cards are not duplicated across hand and remaining deck", () => {
    const s = drawHand(createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP));
    const handIds = new Set(s.playerHand.map((c) => c.id));
    const deckIds = s.playerDeck.map((c) => c.id);
    for (const id of deckIds) {
      expect(handIds.has(id)).toBe(false);
    }
  });
});

describe("resolveChoices", () => {
  test("reduces enemy HP when player attacks (top face)", () => {
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    state = drawHand(state);
    state = resolveChoices(state, allTop(state.playerHand));
    expect(state.enemySquadHp).toBeLessThan(ENEMY_HP);
  });

  test("reduces player HP when enemy attacks via intents", () => {
    // Enemy always picks top by default; use large HP to ensure player doesn't die
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, 1000, 1000);
    state = drawHand(state);
    state = resolveChoices(state, allBottom(state.playerHand));
    expect(state.playerSquadHp).toBeLessThan(1000);
  });

  test("player defend bottom face reduces enemy attack damage", () => {
    // Run two resolves from the same afterDraw state: one with all-top (no defense),
    // one with all-bottom (maximum player defense). Player should take less damage defensively.
    const state = createCardCombatState(BEAR_DECK, BEAR_DECK, 1000, 1000);
    const afterDraw = drawHand(state);

    const withAttack = resolveChoices(afterDraw, allTop(afterDraw.playerHand));
    const withDefense = resolveChoices(afterDraw, allBottom(afterDraw.playerHand));

    // BEAR_DECK bottom faces: defend(5) + utility(8) + move(1) = only defend(5) reduces damage
    expect(withDefense.playerSquadHp).toBeGreaterThan(withAttack.playerSquadHp);
  });

  test("HP arithmetic: exact enemy damage calculation for all-top player turn", () => {
    // BEAR_DECK drawn order: maul(×3.5), roar(×0.8), hug(×2.0) → 3.5+0.8+2.0 = 6.3
    // DEFAULT_ATTACK_POWER = 10 → player deals 63 damage
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, 1000, 1000);
    state = drawHand(state);
    const choices = allTop(state.playerHand);
    const after = resolveChoices(state, choices);

    const playerMultiplierSum = state.playerHand.reduce(
      (sum, c) => sum + c.top.damageMultiplier,
      0,
    );
    const expectedDamage = playerMultiplierSum * 10; // DEFAULT_ATTACK_POWER = 10
    expect(after.enemySquadHp).toBe(1000 - expectedDamage);
  });

  test("clears hands and intents after resolve", () => {
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    state = drawHand(state);
    state = resolveChoices(state, allTop(state.playerHand));
    expect(state.playerHand).toHaveLength(0);
    expect(state.enemyHand).toHaveLength(0);
    expect(state.enemyIntents).toHaveLength(0);
  });

  test("played cards move to discard after resolve", () => {
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, ENEMY_HP);
    state = drawHand(state);
    state = resolveChoices(state, allTop(state.playerHand));
    expect(state.playerDiscard).toHaveLength(3);
    expect(state.enemyDiscard).toHaveLength(3);
  });

  test("isComplete and winner='player' when enemy HP reaches 0", () => {
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, PLAYER_HP, 1);
    state = drawHand(state);
    state = resolveChoices(state, allTop(state.playerHand));
    expect(state.isComplete).toBe(true);
    expect(state.winner).toBe("player");
    expect(state.enemySquadHp).toBe(0);
  });

  test("isComplete and winner='enemy' when player HP reaches 0", () => {
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, 1, ENEMY_HP);
    state = drawHand(state);
    // Player attacks for ~6.3*10=63 but player HP is 1 and enemy attacks for same
    state = resolveChoices(state, allBottom(state.playerHand));
    expect(state.isComplete).toBe(true);
    expect(state.winner).toBe("enemy");
    expect(state.playerSquadHp).toBe(0);
  });

  test("player wins when both squads reach 0 simultaneously", () => {
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, 1, 1);
    state = drawHand(state);
    state = resolveChoices(state, allTop(state.playerHand));
    expect(state.isComplete).toBe(true);
    expect(state.winner).toBe("player");
  });

  test("HP does not go below 0", () => {
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, 1, 1);
    state = drawHand(state);
    state = resolveChoices(state, allTop(state.playerHand));
    expect(state.playerSquadHp).toBeGreaterThanOrEqual(0);
    expect(state.enemySquadHp).toBeGreaterThanOrEqual(0);
  });

  test("isComplete stays false when HP is positive", () => {
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, 1000, 1000);
    state = drawHand(state);
    state = resolveChoices(state, allTop(state.playerHand));
    expect(state.isComplete).toBe(false);
    expect(state.winner).toBeNull();
  });
});

describe("resolveCardTarget (directional targeting)", () => {
  const slots = [
    { position: Position.Left, speciesId: "a", attackPower: 10 },
    { position: Position.Center, speciesId: "b", attackPower: 10 },
    { position: Position.Right, speciesId: "c", attackPower: 10 },
  ];

  test("OppositeEnemy returns the slot at the attacker's own position", () => {
    expect(resolveCardTarget(Position.Left, TargetType.OppositeEnemy, slots)).toBe(Position.Left);
    expect(resolveCardTarget(Position.Center, TargetType.OppositeEnemy, slots)).toBe(
      Position.Center,
    );
    expect(resolveCardTarget(Position.Right, TargetType.OppositeEnemy, slots)).toBe(Position.Right);
  });

  test("LeftEnemy returns position one to the left of attacker", () => {
    expect(resolveCardTarget(Position.Center, TargetType.LeftEnemy, slots)).toBe(Position.Left);
    expect(resolveCardTarget(Position.Right, TargetType.LeftEnemy, slots)).toBe(Position.Center);
  });

  test("RightEnemy returns position one to the right of attacker", () => {
    expect(resolveCardTarget(Position.Left, TargetType.RightEnemy, slots)).toBe(Position.Center);
    expect(resolveCardTarget(Position.Center, TargetType.RightEnemy, slots)).toBe(Position.Right);
  });

  test("LeftEnemy from Position.Left falls back to first slot", () => {
    const target = resolveCardTarget(Position.Left, TargetType.LeftEnemy, slots);
    expect(target).toBe(Position.Left); // fallback to slots[0]
  });

  test("RightEnemy from Position.Right falls back to first slot", () => {
    const target = resolveCardTarget(Position.Right, TargetType.RightEnemy, slots);
    expect(target).toBe(Position.Left); // fallback to slots[0]
  });

  test("AllEnemies returns a position (shared HP pool, not null)", () => {
    const target = resolveCardTarget(Position.Center, TargetType.AllEnemies, slots);
    expect(target).not.toBeNull();
  });

  test("LowestHpEnemy returns first slot (shared pool, no per-slot HP)", () => {
    const target = resolveCardTarget(Position.Center, TargetType.LowestHpEnemy, slots);
    expect(target).toBe(Position.Left);
  });

  test("ally target types return null (not applicable in card combat attacks)", () => {
    expect(resolveCardTarget(Position.Center, TargetType.LeftAlly, slots)).toBeNull();
    expect(resolveCardTarget(Position.Center, TargetType.RightAlly, slots)).toBeNull();
  });

  test("returns null when enemy slots are empty", () => {
    expect(resolveCardTarget(Position.Left, TargetType.OppositeEnemy, [])).toBeNull();
    expect(resolveCardTarget(Position.Center, TargetType.AllEnemies, [])).toBeNull();
  });
});

describe("full combat loop", () => {
  test("multi-turn cycle: draw → resolve → draw → resolve stays consistent", () => {
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, 1000, 1000);

    // Turn 1
    state = drawHand(state);
    expect(state.playerHand).toHaveLength(3);
    expect(state.enemyIntents).toHaveLength(3);
    state = resolveChoices(state, allTop(state.playerHand));
    expect(state.playerHand).toHaveLength(0);
    expect(state.turnNumber).toBe(1);

    // Turn 2 (triggers reshuffle since BEAR_DECK has 4 cards)
    state = drawHand(state);
    expect(state.playerHand).toHaveLength(3);
    expect(state.turnNumber).toBe(2);
    state = resolveChoices(state, allTop(state.playerHand));

    expect(state.isComplete).toBe(false);
  });

  test("combat terminates when one squad is eliminated", () => {
    // Very low HP so combat ends quickly
    let state = createCardCombatState(BEAR_DECK, BEAR_DECK, 30, 30);
    let turns = 0;
    while (!state.isComplete && turns < 20) {
      state = drawHand(state);
      state = resolveChoices(state, allTop(state.playerHand));
      turns++;
    }
    expect(state.isComplete).toBe(true);
    expect(state.winner).not.toBeNull();
  });
});
