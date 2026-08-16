import { describe, expect, test } from "vitest";
import {
  CardBottomFaceSchema,
  CardFaceSchema,
  CardSchema,
  CardTopFaceSchema,
  DeckSchema,
} from "../src/core/cards";
import { TargetType } from "../src/core/types";
import { ALL_DECKS, BEAR_DECK, EAGLE_DECK, TIGER_DECK } from "../src/data/cards";

describe("CardTopFaceSchema", () => {
  test("parses a valid attack face", () => {
    const face = { damageMultiplier: 2.5, targetType: TargetType.OppositeEnemy };
    expect(CardTopFaceSchema.parse(face)).toEqual(face);
  });

  test("rejects zero or negative damageMultiplier", () => {
    expect(() =>
      CardTopFaceSchema.parse({ damageMultiplier: 0, targetType: TargetType.AllEnemies }),
    ).toThrow();
    expect(() =>
      CardTopFaceSchema.parse({ damageMultiplier: -1, targetType: TargetType.AllEnemies }),
    ).toThrow();
  });

  test("rejects invalid targetType", () => {
    expect(() =>
      CardTopFaceSchema.parse({ damageMultiplier: 1.0, targetType: "invalid" }),
    ).toThrow();
  });
});

describe("CardBottomFaceSchema", () => {
  test("parses defend face", () => {
    const face = { type: "defend", value: 5 };
    expect(CardBottomFaceSchema.parse(face)).toEqual(face);
  });

  test("parses move face", () => {
    const face = { type: "move", value: 1 };
    expect(CardBottomFaceSchema.parse(face)).toEqual(face);
  });

  test("parses utility face", () => {
    const face = { type: "utility", value: 8 };
    expect(CardBottomFaceSchema.parse(face)).toEqual(face);
  });

  test("rejects invalid bottom type", () => {
    expect(() => CardBottomFaceSchema.parse({ type: "attack", value: 5 })).toThrow();
  });
});

describe("CardFaceSchema (union)", () => {
  test("accepts a top (attack) face", () => {
    const face = { damageMultiplier: 1.5, targetType: TargetType.RandomEnemy };
    expect(() => CardFaceSchema.parse(face)).not.toThrow();
  });

  test("accepts a bottom face", () => {
    const face = { type: "defend", value: 3 };
    expect(() => CardFaceSchema.parse(face)).not.toThrow();
  });
});

describe("CardSchema", () => {
  const validCard = {
    id: "test_card",
    name: "Test Card",
    top: { damageMultiplier: 2.0, targetType: TargetType.LowestHpEnemy },
    bottom: { type: "defend" as const, value: 4 },
    speciesId: "bear",
  };

  test("parses a valid card", () => {
    expect(CardSchema.parse(validCard)).toEqual(validCard);
  });

  test("rejects card with missing fields", () => {
    const { id: _id, ...noId } = validCard;
    expect(() => CardSchema.parse(noId)).toThrow();
  });

  test("rejects card whose top face has no targetType", () => {
    const bad = { ...validCard, top: { damageMultiplier: 2.0 } };
    expect(() => CardSchema.parse(bad)).toThrow();
  });

  test("rejects card whose bottom face has invalid type", () => {
    const bad = { ...validCard, bottom: { type: "block", value: 3 } };
    expect(() => CardSchema.parse(bad)).toThrow();
  });
});

describe("DeckSchema", () => {
  test("parses an array of valid cards", () => {
    expect(() => DeckSchema.parse(BEAR_DECK)).not.toThrow();
  });

  test("parses an empty deck", () => {
    expect(DeckSchema.parse([])).toEqual([]);
  });
});

describe("BEAR_DECK", () => {
  test("has exactly 4 cards", () => {
    expect(BEAR_DECK).toHaveLength(4);
  });

  test("all cards have speciesId 'bear'", () => {
    for (const card of BEAR_DECK) {
      expect(card.speciesId).toBe("bear");
    }
  });

  test("all tops have valid TargetType", () => {
    const validTypes = Object.values(TargetType) as string[];
    for (const card of BEAR_DECK) {
      expect(validTypes).toContain(card.top.targetType);
    }
  });

  test("all bottoms have valid type enum", () => {
    const validBottomTypes = ["defend", "move", "utility"];
    for (const card of BEAR_DECK) {
      expect(validBottomTypes).toContain(card.bottom.type);
    }
  });

  test("contains a greedy card (highest damageMultiplier > 4)", () => {
    const hasGreedy = BEAR_DECK.some((c) => c.top.damageMultiplier > 4);
    expect(hasGreedy).toBe(true);
  });
});

describe("EAGLE_DECK", () => {
  test("has exactly 4 cards", () => {
    expect(EAGLE_DECK).toHaveLength(4);
  });

  test("all cards have speciesId 'eagle'", () => {
    for (const card of EAGLE_DECK) {
      expect(card.speciesId).toBe("eagle");
    }
  });

  test("all tops have valid TargetType", () => {
    const validTypes = Object.values(TargetType) as string[];
    for (const card of EAGLE_DECK) {
      expect(validTypes).toContain(card.top.targetType);
    }
  });

  test("all bottoms have valid type enum", () => {
    const validBottomTypes = ["defend", "move", "utility"];
    for (const card of EAGLE_DECK) {
      expect(validBottomTypes).toContain(card.bottom.type);
    }
  });
});

describe("TIGER_DECK", () => {
  test("has exactly 4 cards", () => {
    expect(TIGER_DECK).toHaveLength(4);
  });

  test("all cards have speciesId 'tiger'", () => {
    for (const card of TIGER_DECK) {
      expect(card.speciesId).toBe("tiger");
    }
  });

  test("all tops have valid TargetType", () => {
    const validTypes = Object.values(TargetType) as string[];
    for (const card of TIGER_DECK) {
      expect(validTypes).toContain(card.top.targetType);
    }
  });

  test("all bottoms have valid type enum", () => {
    const validBottomTypes = ["defend", "move", "utility"];
    for (const card of TIGER_DECK) {
      expect(validBottomTypes).toContain(card.bottom.type);
    }
  });
});

describe("ALL_DECKS", () => {
  test("contains decks for bear, eagle, and tiger", () => {
    expect(ALL_DECKS).toHaveProperty("bear");
    expect(ALL_DECKS).toHaveProperty("eagle");
    expect(ALL_DECKS).toHaveProperty("tiger");
  });

  test("each deck reference matches the named export", () => {
    expect(ALL_DECKS.bear).toBe(BEAR_DECK);
    expect(ALL_DECKS.eagle).toBe(EAGLE_DECK);
    expect(ALL_DECKS.tiger).toBe(TIGER_DECK);
  });
});
