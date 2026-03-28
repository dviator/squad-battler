# Squad Battler

A genetic roguelike auto-battler. Players escape a corporate science lab by breeding creatures across runs, combining genetics and mutations with roguelike progression.

The game is currently a CLI simulation engine. A web frontend is the next major milestone.

**Tech stack:** Bun · TypeScript (strict) · Vitest + fast-check · Biome · Zod

---

## Game Design

- [`docs/DESIGN_FRAMEWORK.md`](docs/DESIGN_FRAMEWORK.md) — core design decisions and idea evaluation criteria
- [`docs/VISION.md`](docs/VISION.md) — high-level game vision
- [`docs/SYSTEMS.md`](docs/SYSTEMS.md) — overview of all game systems
- [`docs/systems/`](docs/systems/) — deep dives: combat, genetics, economy, meta-progression, world progression
- [`docs/IMPLEMENTATION-ROADMAP.md`](docs/IMPLEMENTATION-ROADMAP.md) — what's built and what's next
- [`docs/design/queue/`](docs/design/queue/) — ideas queued for implementation
- [`docs/design/in-progress/`](docs/design/in-progress/) — currently being implemented
- [`docs/design/implemented/`](docs/design/implemented/) — shipped features

---

## Dev Workflow

```bash
bun install           # install dependencies
bun run test          # run all tests
bun run test:watch    # watch mode
bun run test:sim      # battle simulations (validate balance)
bun run typecheck     # TypeScript strict check
bun run lint          # Biome lint + format check
bun run lint:fix      # Biome auto-fix
bun run dev           # run main entry point
```

Tests must pass before every commit (enforced by pre-commit hook). Merge directly to main — no PRs.

### Parallel feature work

```bash
./scripts/worktree-agent.sh feat/feature-name "Description of feature"
```

Each agent runs in an isolated git worktree. See `./scripts/worktree-agent.sh --help`.

### Starting the pipeline session

```bash
tmux new-session -s squad-battler
caffeinate -i &
claude --channels plugin:discord@claude-plugins-official --dangerously-skip-permissions
```

See [`docs/WORKFLOW.md`](docs/WORKFLOW.md) for the full pipeline documentation.

---

## Discord

The development pipeline is driven by Discord:

| Channel | Purpose |
|---|---|
| `#design` | Post game ideas — Claude refines them into design docs |
| `#playtest` | Playtest feedback and bug reports |
| `#architecture` | Architecture notes and refactor tasks |
| `#build` | Pipeline status updates (design committed, impl started, merged) |

---

## License

MIT
