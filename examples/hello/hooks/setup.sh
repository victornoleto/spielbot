#!/usr/bin/env bash
# Serves the demo app on 127.0.0.1:4173 for the recording; teardown.sh stops it.
set -euo pipefail
here=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$here/build"
python3 -m http.server 4173 --bind 127.0.0.1 -d "$here/../demo-app" >/dev/null 2>&1 &
echo $! > "$here/build/.server.pid"
for _ in $(seq 50); do curl -sf http://127.0.0.1:4173/ >/dev/null && exit 0; sleep 0.1; done
echo "demo app did not start" >&2; exit 1
