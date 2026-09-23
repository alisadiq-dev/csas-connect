#!/usr/bin/env bash
# Manages an isolated Postgres instance for this project's dev/test use.
# Deliberately separate from any system-wide Postgres install: own data
# directory, own port (54329), trust auth, loopback-only.
# Requires postgresql@14 from Homebrew (brew install postgresql@14).
#
# Data/socket directory lives OUTSIDE the project root on purpose — Next.js's
# Turbopack build does a full directory scan of the project and errors out
# ("Operation not supported on socket") if it encounters the Postgres unix
# socket file, so it can't live under .devdb/ inside the repo.
set -euo pipefail

PG_BIN="/opt/homebrew/opt/postgresql@14/bin"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEVDB_DIR="$HOME/.csas-connect-devdb"
DATA_DIR="$DEVDB_DIR/data"
SOCKET_DIR="$DEVDB_DIR"
LOG_FILE="$DEVDB_DIR/logfile"
PORT=54329

case "${1:-}" in
  start)
    if [ ! -d "$DATA_DIR" ]; then
      echo "No local data directory found — initializing one (first run only)..."
      "$PG_BIN/initdb" -D "$DATA_DIR" -U csas -A trust --no-locale -E UTF8
    fi
    if "$PG_BIN/pg_ctl" -D "$DATA_DIR" status > /dev/null 2>&1; then
      echo "Local Postgres already running."
    else
      "$PG_BIN/pg_ctl" -D "$DATA_DIR" -l "$LOG_FILE" -o "-p $PORT -k $SOCKET_DIR" start
    fi
    "$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -U csas -d postgres -tc \
      "SELECT 1 FROM pg_database WHERE datname = 'csas_connect_dev'" | grep -q 1 || \
      "$PG_BIN/createdb" -h 127.0.0.1 -p "$PORT" -U csas csas_connect_dev
    "$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -U csas -d postgres -tc \
      "SELECT 1 FROM pg_database WHERE datname = 'csas_connect_test'" | grep -q 1 || \
      "$PG_BIN/createdb" -h 127.0.0.1 -p "$PORT" -U csas csas_connect_test
    # Idempotent: makes this local Postgres behave like real Supabase-hosted
    # Postgres for RLS (auth.uid(), the `authenticated` role) — see the file
    # for why this never touches db/migrations/.
    "$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -U csas -d csas_connect_dev -v ON_ERROR_STOP=1 \
      -f "$ROOT_DIR/scripts/local-auth-shim.sql" > /dev/null
    "$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -U csas -d csas_connect_test -v ON_ERROR_STOP=1 \
      -f "$ROOT_DIR/scripts/local-auth-shim.sql" > /dev/null
    echo "Local Postgres ready on 127.0.0.1:$PORT (databases: csas_connect_dev, csas_connect_test)"
    ;;
  stop)
    "$PG_BIN/pg_ctl" -D "$DATA_DIR" stop
    ;;
  status)
    "$PG_BIN/pg_ctl" -D "$DATA_DIR" status
    ;;
  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
