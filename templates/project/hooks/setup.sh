#!/usr/bin/env bash
# Runs before every probe/record/explore, from the project folder ($1 = project path).
# Make the app state known and reversible: snapshot what teardown.sh must undo (max ids, a DB dump, a git stash of
# fixtures…), seed demo data, or start a local server. Exit non-zero to abort the capture.
set -euo pipefail
