#!/bin/bash
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

case "$COMMAND" in
  "git commit"*) ;;
  *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR"

echo "Running type check..." >&2
bun run typecheck 2>&1
TYPECHECK_EXIT=$?

if [ $TYPECHECK_EXIT -ne 0 ]; then
  echo "Type check failed. Fix type errors before committing." >&2
  exit 2
fi

echo "Running tests..." >&2
bun run test 2>&1
TEST_EXIT=$?

if [ $TEST_EXIT -ne 0 ]; then
  echo "Tests failed. Fix failing tests before committing." >&2
  exit 2
fi

exit 0
