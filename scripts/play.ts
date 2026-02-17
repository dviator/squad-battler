#!/usr/bin/env bun

import { playGame } from "../src/cli/game";

// Start the game
playGame().catch((error) => {
  console.error("\n❌ Game error:", error);
  process.exit(1);
});
