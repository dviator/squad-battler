import { describe, expect, it } from "vitest";
import { formatAttackLine } from "../src/web/utils/battleLog";

describe("formatAttackLine", () => {
  it("shows single target after an arrow", () => {
    expect(formatAttackLine("Eagle", "Talon Slash", ["Goob"])).toBe(
      "Eagle uses Talon Slash → Goob",
    );
  });

  it("lists multiple targets comma-separated for AoE", () => {
    expect(formatAttackLine("Bear", "Maul", ["Goob", "Slug"])).toBe("Bear uses Maul → Goob, Slug");
  });

  it("omits the arrow when targetIds is empty", () => {
    expect(formatAttackLine("Tiger", "Pounce", [])).toBe("Tiger uses Pounce");
  });
});
