#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  echo "Usage: $0 <branch-name> <prompt>"
  echo ""
  echo "Creates a git worktree and runs Claude headless in it."
  echo ""
  echo "Arguments:"
  echo "  branch-name   Name for the new branch (e.g., feat/add-wolf-species)"
  echo "  prompt        The task description for Claude"
  echo ""
  echo "Options:"
  echo "  --max-turns N    Max agentic turns (default: 50)"
  echo ""
  echo "Example:"
  echo "  $0 feat/add-wolf \"Add a Wolf species with pack tactics targeting\""
  exit 1
}

MAX_TURNS=50
BRANCH_NAME=""
PROMPT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --max-turns)
      MAX_TURNS="$2"
      shift 2
      ;;
    --help|-h)
      usage
      ;;
    *)
      if [ -z "$BRANCH_NAME" ]; then
        BRANCH_NAME="$1"
      elif [ -z "$PROMPT" ]; then
        PROMPT="$1"
      else
        echo "Error: unexpected argument '$1'" >&2
        usage
      fi
      shift
      ;;
  esac
done

if [ -z "$BRANCH_NAME" ] || [ -z "$PROMPT" ]; then
  usage
fi

WORKTREE_DIR="$PROJECT_ROOT/../squad-battler-worktrees/$BRANCH_NAME"

echo "=== Worktree Agent ==="
echo "Branch: $BRANCH_NAME"
echo "Worktree: $WORKTREE_DIR"
echo "Max turns: $MAX_TURNS"
echo ""

mkdir -p "$(dirname "$WORKTREE_DIR")"
git -C "$PROJECT_ROOT" worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" 2>/dev/null || {
  echo "Worktree or branch already exists, attempting to reuse..."
  if [ -d "$WORKTREE_DIR" ]; then
    echo "Using existing worktree at $WORKTREE_DIR"
  else
    echo "Error: could not create worktree for branch $BRANCH_NAME" >&2
    exit 1
  fi
}

echo "Running Claude in worktree..."
echo ""

cd "$WORKTREE_DIR"

claude -p "$PROMPT" \
  --max-turns "$MAX_TURNS" \
  --allowedTools "Read,Edit,Write,Glob,Grep,Bash(bun *),Bash(bun run *),Bash(bunx *),Bash(git add *),Bash(git commit *),Bash(git status *),Bash(git diff *),Bash(git log *)" \
  --output-format text

CLAUDE_EXIT=$?

echo ""
echo "=== Agent Finished (exit: $CLAUDE_EXIT) ==="

echo ""
echo "Changes in worktree:"
git -C "$WORKTREE_DIR" log --oneline "main..HEAD" 2>/dev/null || git -C "$WORKTREE_DIR" log --oneline -5

echo ""
read -p "Open a draft PR? [y/N] " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd "$WORKTREE_DIR"
  git push -u origin "$BRANCH_NAME"
  gh pr create --draft --title "$BRANCH_NAME" --body "$(cat <<EOF
Automated by worktree-agent.sh

**Task**: $PROMPT
**Max turns**: $MAX_TURNS
EOF
)"
  echo "PR created."
fi

echo ""
echo "Worktree: $WORKTREE_DIR"
echo "To clean up: git -C $PROJECT_ROOT worktree remove $WORKTREE_DIR"
