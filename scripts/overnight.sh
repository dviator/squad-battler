#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  echo "Usage: $0 <task-description>"
  echo ""
  echo "Runs a long-running Claude task on a new branch."
  echo "Designed for overnight or background execution."
  echo ""
  echo "Options:"
  echo "  --branch NAME      Branch name (default: overnight/YYYYMMDD-HHMMSS)"
  echo "  --max-turns N      Max agentic turns (default: 200)"
  echo "  --max-budget N     Max budget in USD (default: 20.00)"
  echo ""
  echo "Example:"
  echo "  $0 'Add 5 new species with unique mechanics and full test coverage'"
  exit 1
}

TASK=""
BRANCH_NAME=""
MAX_TURNS=200
MAX_BUDGET="20.00"

while [[ $# -gt 0 ]]; do
  case $1 in
    --branch)
      BRANCH_NAME="$2"
      shift 2
      ;;
    --max-turns)
      MAX_TURNS="$2"
      shift 2
      ;;
    --max-budget)
      MAX_BUDGET="$2"
      shift 2
      ;;
    --help|-h)
      usage
      ;;
    *)
      if [ -z "$TASK" ]; then
        TASK="$1"
      else
        echo "Error: unexpected argument '$1'" >&2
        usage
      fi
      shift
      ;;
  esac
done

if [ -z "$TASK" ]; then
  usage
fi

if [ -z "$BRANCH_NAME" ]; then
  BRANCH_NAME="overnight/$(date +%Y%m%d-%H%M%S)"
fi

WORKTREE_DIR="$PROJECT_ROOT/../squad-battler-worktrees/$BRANCH_NAME"
LOG_DIR="$PROJECT_ROOT/../squad-battler-worktrees/logs"
LOG_FILE="$LOG_DIR/${BRANCH_NAME//\//-}.log"

echo "=== Overnight Agent ==="
echo "Branch: $BRANCH_NAME"
echo "Task: $TASK"
echo "Max turns: $MAX_TURNS"
echo "Max budget: \$$MAX_BUDGET"
echo "Log: $LOG_FILE"
echo ""

mkdir -p "$(dirname "$WORKTREE_DIR")"
mkdir -p "$LOG_DIR"

git -C "$PROJECT_ROOT" worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR"

FULL_PROMPT="You are working on the Squad Battler project. Your task:

$TASK

Instructions:
- Run tests after making changes to verify correctness
- Commit your work incrementally with descriptive messages
- Follow existing code patterns (pure core functions, data config layer, sim layer)
- Use existing enums (Position, TargetType, BattleEventType) in type definitions
- Do not add trivial comments"

cd "$WORKTREE_DIR"

echo "Started: $(date)" | tee "$LOG_FILE"
echo "Task: $TASK" | tee -a "$LOG_FILE"
echo "---" | tee -a "$LOG_FILE"

claude -p "$FULL_PROMPT" \
  --max-turns "$MAX_TURNS" \
  --max-budget-usd "$MAX_BUDGET" \
  --allowedTools "Read,Edit,Write,Glob,Grep,Bash(bun *),Bash(bun run *),Bash(bunx *),Bash(git add *),Bash(git commit *),Bash(git status *),Bash(git diff *),Bash(git log *),Bash(ls *),Bash(wc *)" \
  --output-format text \
  2>&1 | tee -a "$LOG_FILE"

CLAUDE_EXIT=${PIPESTATUS[0]}

echo "" | tee -a "$LOG_FILE"
echo "=== Finished: $(date) (exit: $CLAUDE_EXIT) ===" | tee -a "$LOG_FILE"

echo ""
echo "Commits:"
git -C "$WORKTREE_DIR" log --oneline "main..HEAD" 2>/dev/null || git -C "$WORKTREE_DIR" log --oneline -5

if command -v gh &>/dev/null; then
  echo ""
  echo "Pushing and creating draft PR..."
  cd "$WORKTREE_DIR"
  git push -u origin "$BRANCH_NAME" 2>/dev/null && \
  gh pr create --draft \
    --title "overnight: ${BRANCH_NAME##*/}" \
    --body "$(cat <<EOF
## Overnight Agent Run

**Task**: $TASK
**Budget**: \$$MAX_BUDGET max, $MAX_TURNS turns max
**Log**: \`$LOG_FILE\`
EOF
)" 2>/dev/null || echo "PR creation skipped (no remote configured)"
fi

osascript -e "display notification \"Overnight agent finished: $BRANCH_NAME\" with title \"Squad Battler\"" 2>/dev/null || true

echo ""
echo "Worktree: $WORKTREE_DIR"
echo "Log: $LOG_FILE"
echo "To clean up: git -C $PROJECT_ROOT worktree remove $WORKTREE_DIR"
