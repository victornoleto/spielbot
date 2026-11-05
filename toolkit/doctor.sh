#!/usr/bin/env bash
# Checks what spielbot needs. With --fix, installs what needs no password (npm deps, Chromium for Playwright).
# Exit code 0 when every required item is present. Optional items only warn.
# Never installs system packages (that needs sudo): it prints the command for the user instead.
set -uo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
fix=false; [ "${1:-}" = "--fix" ] && fix=true
missing=0
ok()   { printf '  ok    %s\n' "$1"; }
bad()  { printf '  MISS  %s -> %s\n' "$1" "$2"; missing=$((missing + 1)); }
warn() { printf '  opt   %s -> %s\n' "$1" "$2"; }

echo "required"
if command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 22 ]; then ok "node $(node -v)"
else bad "node >= 22" "install from https://nodejs.org or with nvm/fnm"; fi
for t in ffmpeg ffprobe; do command -v $t >/dev/null && ok "$t" || bad "$t" "sudo apt install ffmpeg  (macOS: brew install ffmpeg)"; done
command -v python3 >/dev/null && ok "python3" || bad "python3" "install Python 3.12+"
command -v uv >/dev/null && ok "uv" || bad "uv" "curl -LsSf https://astral.sh/uv/install.sh | sh"

if [ -d "$ROOT/node_modules/playwright-core" ]; then ok "playwright-core (npm)"
elif $fix; then (cd "$ROOT" && npm install --silent) && ok "playwright-core (installed)" || bad "playwright-core" "cd $ROOT && npm install"
else bad "playwright-core" "cd $ROOT && npm install   (or: spielbot doctor --fix)"; fi

if [ -d "$ROOT/node_modules/playwright-core" ]; then
    exe=$(cd "$ROOT" && node -e "import('playwright-core').then(m => console.log(m.chromium.executablePath()))" 2>/dev/null)
    if [ -n "$exe" ] && [ -x "$exe" ]; then ok "chromium for playwright"
    elif $fix; then (cd "$ROOT" && npx playwright-core install chromium) && ok "chromium (installed)" || bad "chromium" "cd $ROOT && npx playwright-core install chromium"
    else bad "chromium for playwright" "cd $ROOT && npx playwright-core install chromium   (or: spielbot doctor --fix)"; fi
fi

if v=$(npx --yes "hyperframes@${HYPERFRAMES_VERSION:-0.9.16}" --version 2>/dev/null | tail -1) && [ -n "$v" ]; then ok "hyperframes $v"
else bad "hyperframes" "check network access to the npm registry (npx downloads it on first use)"; fi

echo "optional"
if command -v heygen >/dev/null; then ok "heygen CLI (music catalog)"
else warn "heygen CLI" "only for background music: curl -fsSL https://static.heygen.ai/cli/install.sh | bash"; fi
if npx --yes "hyperframes@${HYPERFRAMES_VERSION:-0.9.16}" auth status 2>/dev/null | grep -q '^Account:'; then ok "hyperframes sign-in (music catalog)"
else warn "hyperframes sign-in" "only for background music; the user runs: ! npx hyperframes auth login"; fi
[ -n "${ELEVENLABS_API_KEY:-}" ] && ok "ELEVENLABS_API_KEY set (paid voice)" || warn "ELEVENLABS_API_KEY" "only for the paid voice; the user runs: ! export ELEVENLABS_API_KEY=..."

echo
[ $missing -eq 0 ] && echo "ready" || echo "$missing required item(s) missing"
exit $missing
