#!/usr/bin/env bash
# Runs after every probe/record/explore, always, even when the capture failed ($1 = project path).
# Undo what the scenes created (delete rows past the ids saved by setup.sh, remove uploaded files), stop servers.
