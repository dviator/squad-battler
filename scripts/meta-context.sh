#!/usr/bin/env bash
#
# meta-context.sh — curated context retrieval for autonomous pipeline sessions.
#
# Pulls the most relevant chunks from the meta/feedback corpus, the backlog, and
# the design docs for a natural-language query, so a cold session loads only the
# context it needs instead of everything.
#
# Primary: qmd (semantic + BM25 + rerank) when installed with a built index.
# Fallback: ripgrep keyword search (always available, incl. ephemeral cloud runs).
#
# Usage:  scripts/meta-context.sh "breeding balance feedback"
#         scripts/meta-context.sh --raw "shop economy"   # paths only, no snippets
#
# See meta/qmd-setup.md for the qmd collection setup.

# No `pipefail`: search pipelines end in `head`, which closes early and would
# otherwise SIGPIPE an upstream `rg`/`sort` into a non-zero exit under `set -e`.
set -eu

RAW=0
if [[ "${1:-}" == "--raw" ]]; then
  RAW=1
  shift
fi

QUERY="${*:-}"
if [[ -z "$QUERY" ]]; then
  echo "usage: meta-context.sh [--raw] \"<query>\"" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORPUS_DIRS=(meta backlog docs)

# ── Primary: qmd ──
# Use it only if the binary exists AND at least one collection has been indexed,
# otherwise fall through to ripgrep so a fresh/ephemeral environment still returns results.
if command -v qmd >/dev/null 2>&1; then
  if qmd collection list 2>/dev/null | grep -qE "^(meta|backlog|docs) "; then
    echo "# meta-context via qmd (collections: meta backlog docs)"
    qmd query "$QUERY" -c meta -c backlog -c docs 2>/dev/null && exit 0
    echo "# qmd query failed — falling back to ripgrep" >&2
  fi
fi

# ── Fallback: keyword search ──
# Prefer ripgrep when it is actually on PATH (faster), else POSIX grep, which is
# always present — including spawned scripts and ephemeral cloud sessions where
# `rg` may be unavailable.
if command -v rg >/dev/null 2>&1; then
  GREP_TOOL="rg"
else
  GREP_TOOL="grep"
fi

# Build a case-insensitive OR pattern from significant query words (>=4 chars).
PATTERN="$(
  echo "$QUERY" | tr 'A-Z' 'a-z' | tr -cs 'a-z0-9' '\n' \
    | awk 'length($0) >= 4' | sort -u | paste -sd'|' -
)"
if [[ -z "$PATTERN" ]]; then
  PATTERN="$(echo "$QUERY" | tr 'A-Z' 'a-z')"
fi

cd "$REPO_ROOT"
EXISTING=()
for d in "${CORPUS_DIRS[@]}"; do
  [[ -d "$d" ]] && EXISTING+=("$d")
done

echo "# meta-context via $GREP_TOOL (pattern: $PATTERN)"
if [[ ${#EXISTING[@]} -eq 0 ]]; then
  echo "# no corpus directories found" >&2
  exit 0
fi

# count_matches → emits "path:count" for files with >=1 match.
count_matches() {
  if [[ "$GREP_TOOL" == "rg" ]]; then
    rg -c -i -e "$PATTERN" --glob '*.md' "${EXISTING[@]}" 2>/dev/null || true
  else
    grep -rciE --include='*.md' -e "$PATTERN" "${EXISTING[@]}" 2>/dev/null | grep -v ':0$' || true
  fi
}

# show_context FILE → matching lines with one line of surrounding context.
show_context() {
  if [[ "$GREP_TOOL" == "rg" ]]; then
    rg -i -n -C1 --max-columns 200 -e "$PATTERN" "$1" 2>/dev/null | head -12 || true
  else
    grep -inE -A1 -B1 -e "$PATTERN" "$1" 2>/dev/null | head -12 || true
  fi
}

# Matching files ranked by match count (highest first), top 12.
FILES="$(count_matches | sort -t: -k2 -nr | head -12 | cut -d: -f1)"

if [[ -z "${FILES// /}" ]]; then
  echo "# no matches"
  exit 0
fi

if [[ "$RAW" -eq 1 ]]; then
  printf '%s\n' "$FILES"
else
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    echo ""
    echo "## $f"
    show_context "$f"
  done < <(printf '%s\n' "$FILES")
fi
