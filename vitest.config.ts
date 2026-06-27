import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Exclude git worktree copies (.claude/worktrees/*) so local runs don't pick
    // up duplicate/stale test files — keeps the gate matching a clean checkout.
    exclude: [...configDefaults.exclude, "**/.claude/worktrees/**"],
  },
});
