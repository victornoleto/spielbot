#!/usr/bin/env bash
# Runs a command between the project's state hooks, so the app ends as it started even when the command fails:
#   <project>/hooks/setup.sh     before (seed data, start a local server, snapshot ids to delete later)
#   <project>/hooks/teardown.sh  on exit, always (delete what the scenes created, stop the server, restore data)
# Both are optional, run from the project folder, and receive the project path as $1.
# Usage: toolkit/capture/with-state.sh <project> <command ...>
set -euo pipefail
project=$(cd "$1" && pwd)
shift
teardown() { [ -x "$project/hooks/teardown.sh" ] && (cd "$project" && ./hooks/teardown.sh "$project") || true; }
trap teardown EXIT
[ -x "$project/hooks/setup.sh" ] && (cd "$project" && ./hooks/setup.sh "$project")
"$@"
