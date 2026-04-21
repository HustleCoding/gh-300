#!/usr/bin/env zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
FIXTURE="$ROOT/fixtures/smoke"
CURSOR_DEFAULT="/Applications/Cursor.app/Contents/Resources/app/bin/cursor"

if [[ -x "$CURSOR_DEFAULT" ]]; then
  export PATH="${CURSOR_DEFAULT:h}:$PATH"
  export SWARMFORGE_CURSOR_BIN="${SWARMFORGE_CURSOR_BIN:-$CURSOR_DEFAULT}"
fi

echo "SwarmForge smoke: fixture=$FIXTURE"
echo "Using Cursor CLI: ${SWARMFORGE_CURSOR_BIN:-cursor}"

git -C "$FIXTURE" rev-parse --is-inside-work-tree &>/dev/null || {
  git -C "$FIXTURE" init -b master >/dev/null
  git -C "$FIXTURE" add swarmforge .gitignore 2>/dev/null || true
  git -C "$FIXTURE" add .
  git -C "$FIXTURE" commit -m "SwarmForge smoke fixture" >/dev/null || true
}

# Clear stale tmux session from a previous failed run
tmux has-session -t swarmforge-smoketest 2>/dev/null && tmux kill-session -t swarmforge-smoketest

"$ROOT/swarmforge.sh" "$FIXTURE"

echo ""
echo "Next: tmux ls | grep swarmforge"
echo "      tmux attach -t swarmforge-smoketest   # interact with Cursor agent pane"
echo "      tmux kill-session -t swarmforge-smoketest   # cleanup"
