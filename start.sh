#!/bin/bash
# Start both backend (port 3000) and webapp (port 8000)

DIR="$(cd "$(dirname "$0")" && pwd)"
BUN="$DIR/.bun/bin/bun"

# Install bun locally if missing
if [ ! -f "$BUN" ]; then
  echo "Installing Bun locally..."
  curl -fsSL https://bun.sh/install | BUN_INSTALL="$DIR/.bun" bash
fi

# Install deps if needed
[ ! -d "$DIR/backend/node_modules" ] && (cd "$DIR/backend" && "$BUN" install)
[ ! -d "$DIR/webapp/node_modules" ] && (cd "$DIR/webapp" && "$BUN" install)

# Kill any existing processes on our ports
lsof -nP -iTCP:3000 -sTCP:LISTEN -t 2>/dev/null | xargs kill 2>/dev/null
lsof -nP -iTCP:8000 -sTCP:LISTEN -t 2>/dev/null | xargs kill 2>/dev/null

echo "Starting backend on http://localhost:3000 ..."
(cd "$DIR/backend" && PATH="$DIR/.bun/bin:$PATH" "$BUN" run --hot src/index.ts) &
BACKEND_PID=$!

echo "Starting webapp on http://localhost:8000 ..."
(cd "$DIR/webapp" && PATH="$DIR/.bun/bin:$PATH" "$DIR/.bun/bin/bunx" vite --host 127.0.0.1 --port 8000) &
WEBAPP_PID=$!

echo ""
echo "Backend PID: $BACKEND_PID"
echo "Webapp  PID: $WEBAPP_PID"
echo ""
echo "Open http://localhost:8000 in your browser."
echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C to kill both
trap "echo 'Stopping...'; kill $BACKEND_PID $WEBAPP_PID 2>/dev/null; exit 0" INT TERM

wait
