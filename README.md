# Squad Battler

A genetic roguelike auto-battler where evolution meets tactical combat.

## Concept

Squad Battler combines:
- **Auto-battler mechanics**: Battles resolve automatically based on unit positioning and stats
- **Tick-based combat**: Each attack has independent cooldown timers creating unique attack rhythms
- **Genetic evolution**: Breed survivors to create stronger lineages with inherited mutations
- **Roguelike progression**: Push through sequential battles until your squad falls, then breed and try again

## Core Systems

### Combat Engine

**Tick-Based System**: Each unit has one or more attacks with independent cooldown timers. Every tick, all timers decrement. When a timer hits 0, that attack fires and resets.

```typescript
// Example: Tiger with 2-tick cooldown attacks ~3x as often as Bear with 4-tick cooldown
Tiger: Maul (cd: 2) → attacks on ticks 2, 4, 6, 8...
Bear: Swipe (cd: 4) → attacks on ticks 4, 8, 12...
```

**Speed Resolution**: When multiple attacks trigger on the same tick, unit speed determines execution order.

### Species System

Each species has unique attack patterns:

- **Bear**: AOE swipe (cd: 4) - hits all enemies, high HP, slow
- **Eagle**: Snipe (cd: 3) - targets lowest HP enemy, fast, fragile
- **Tiger**: Maul (cd: 2) - attacks opposite enemy, balanced stats

### Genetics & Mutations

**Breeding**: Combine two units of the same species to produce offspring
- Offspring inherits mutations probabilistically (50% chance per parent mutation)
- Small chance for random new mutations
- Generation counter tracks lineage depth

**Mutations**:
- `thick_hide`: +30 HP
- `swift_reflexes`: +3 Speed
- `powerful_muscles`: +8 Attack Power
- `adrenaline_rush`: -1 to all attack cooldowns
- `berserker`: +15 Attack, -20 HP

### Roguelike Loop

1. Assemble a squad of 3 units (choose species + position)
2. Face sequential battles of increasing difficulty
3. HP persists between battles (no healing)
4. Run ends when squad is eliminated
5. Breed survivors (or from stable) to create next generation
6. Repeat with stronger, evolved units

## Quick Start

### Install Dependencies

```bash
bun install
```

### Run Tests

```bash
bun test
```

### Run Simulations

```bash
bun run src/sim/runner.ts
```

This demonstrates:
- A single battle with detailed logs
- Genetic breeding examples
- A full roguelike run (5 rounds)
- Tournament statistics (1000 battles)

### Use as Library

```typescript
import { simulateBattle, createUnit, TIGER, EAGLE, BEAR, Position } from "./src";

const player = [
  createUnit(TIGER, Position.Left),
  createUnit(EAGLE, Position.Center),
  createUnit(BEAR, Position.Right, { mutations: ["thick_hide"] }),
];

const enemy = [
  createUnit(BEAR, Position.Left),
  createUnit(TIGER, Position.Center),
  createUnit(EAGLE, Position.Right),
];

const result = simulateBattle(player, enemy);
console.log(result.winner); // "player" | "enemy"
```

## Project Structure

```
squad-battler/
├── src/
│   ├── core/           # Pure game logic (zero dependencies)
│   │   ├── types.ts    # Core data structures
│   │   ├── battle.ts   # Tick-based combat engine
│   │   ├── unit.ts     # Unit creation and state
│   │   ├── genetics.ts # Breeding and inheritance
│   │   ├── targeting.ts # Attack target resolution
│   │   └── logger.ts   # Battle logging utilities
│   ├── data/           # Declarative configs
│   │   ├── species.ts  # Species definitions
│   │   └── mutations.ts # Mutation definitions
│   ├── sim/            # Simulation harness
│   │   └── runner.ts   # Demo scenarios and tournaments
│   └── index.ts        # Public API exports
├── tests/              # Comprehensive test suite
│   ├── unit.test.ts
│   ├── battle.test.ts
│   ├── genetics.test.ts
│   └── targeting.test.ts
├── scripts/
│   ├── worktree-agent.sh  # Parallel agent launcher
│   └── overnight.sh       # Long-horizon batch agent
├── .claude/
│   ├── settings.json      # Project hooks (committable)
│   └── hooks/
│       ├── lint-on-edit.sh      # Auto-format on file edit
│       └── pre-commit-check.sh  # Tests + typecheck before commit
├── biome.json
└── package.json
```

## Architecture

**Three-Layer Design**:

1. **Core Layer** (pure functions, fully deterministic)
   - All game rules and mechanics
   - 100% testable
   - Zero side effects

2. **Data Layer** (declarative configs)
   - Species definitions
   - Mutation catalog
   - Easy to extend without touching code

3. **Shell Layer** (future: rendering, UI)
   - Currently: text logging and simulation
   - Next: visual renderer

## Design Principles

- **Simulation-first**: Every mechanic is tested via simulation before any UI
- **Pure functions**: Core logic has zero side effects → fearless refactoring
- **Type safety**: Strict TypeScript prevents entire classes of bugs
- **Deterministic**: Battles are reproducible (given same inputs)
- **Extensible**: Add species/mutations via data, not code changes

## Next Steps

### Immediate (Week 2)
- [ ] Visual renderer (Pixi.js or Canvas)
- [ ] UI for squad composition
- [ ] Run persistence (save/load)
- [ ] More species (10+ total)
- [ ] More mutations (20+ total)

### Future
- [ ] Cross-species breeding (hybrids)
- [ ] Ability system (active abilities beyond attacks)
- [ ] Status effects (stun, poison, buffs)
- [ ] Equipment/items
- [ ] Meta-progression (unlock species/mutations)

## Testing

All core systems have comprehensive test coverage:

```bash
bun run test          # Run all tests
bun run test:watch    # Watch mode
bun run lint          # Biome lint + format check
bun run typecheck     # TypeScript type checking
```

Current test suites:
- **unit.test.ts**: Unit creation, stats, mutations
- **battle.test.ts**: Combat mechanics, damage, win conditions
- **genetics.test.ts**: Breeding, inheritance, mutations
- **targeting.test.ts**: Attack target resolution

## Development

**Tech Stack**:
- Runtime: Bun
- Language: TypeScript (strict mode)
- Testing: Vitest + fast-check (property-based)
- Linting/Formatting: Biome
- Validation: Zod schemas

**Scripts**:
```bash
bun run test        # Run all tests
bun run test:watch  # Watch mode
bun run lint        # Biome check (lint + format)
bun run lint:fix    # Biome check with auto-fix
bun run typecheck   # TypeScript type checking
bun run dev         # Run main entry point
bun run test:sim    # Run battle simulations
```

**Workflow**:
1. Design mechanic (as test scenario)
2. Implement in core layer
3. Run simulation to validate
4. Iterate based on data
5. Add to game when verified

## Agentic Development

This project is set up for agentic coding with Claude Code.

### Quality Hooks (`.claude/settings.json`)

Three hooks run automatically during Claude Code sessions:

- **PostToolUse (Edit|Write)**: Runs `biome check --write` on every file Claude edits, enforcing consistent formatting without manual intervention.
- **PreToolUse (Bash → git commit)**: Blocks commits unless both `bun run typecheck` and `bun run test` pass. Only triggers on `git commit` commands, passes through all other Bash usage.
- **Stop**: Prompt-based review that checks for unnecessary complexity, architecture violations, trivial comments, and missing enum usage before Claude finishes responding.

### Parallel Agents (`scripts/worktree-agent.sh`)

Run multiple Claude agents on independent features simultaneously using git worktrees for file isolation:

```bash
# Terminal 1
./scripts/worktree-agent.sh feat/add-wolf "Add a Wolf species with pack tactics"

# Terminal 2
./scripts/worktree-agent.sh feat/poison-mutation "Add a poison status effect mutation"
```

Each agent gets its own worktree, branch, and scoped tool permissions. Defaults to 50 turns and $5 budget. Run `./scripts/worktree-agent.sh --help` for options.

### Overnight Batch (`scripts/overnight.sh`)

Run long-horizon tasks unattended with logging and auto-PR creation:

```bash
./scripts/overnight.sh "Add 5 new species with unique attack patterns and full test coverage"

# With custom limits
./scripts/overnight.sh --max-turns 300 --max-budget 30 \
  "Implement status effects system (poison, stun, buffs) with breeding interactions"
```

Creates a timestamped branch, logs all output, pushes and opens a draft PR when done, and sends a macOS notification on completion. Defaults to 200 turns and $20 budget. Run `./scripts/overnight.sh --help` for options.

## License

MIT
