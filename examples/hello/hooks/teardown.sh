#!/usr/bin/env bash
# Stops the demo app server. The app keeps state in memory, so there is no data to clean up.
here=$(cd "$(dirname "$0")/.." && pwd)
[ -f "$here/build/.server.pid" ] && kill "$(cat "$here/build/.server.pid")" 2>/dev/null
rm -f "$here/build/.server.pid"
