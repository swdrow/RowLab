#!/bin/bash
# Stop RowLab development servers

echo "Stopping RowLab development environment..."

# Stop tmux session if it exists
if tmux has-session -t rowlab-dev 2>/dev/null; then
    echo "✓ Killing tmux session 'rowlab-dev'"
    tmux kill-session -t rowlab-dev
fi

# Kill any remaining Node processes on ports 3001 and 3002
echo "✓ Checking for processes on ports 3001 and 3002..."

# Find and kill processes on port 3001 (Vite)
VITE_PID=$(lsof -ti:3001 2>/dev/null)
if [ ! -z "$VITE_PID" ]; then
    echo "  - Killing Vite dev server (PID: $VITE_PID)"
    kill -9 $VITE_PID 2>/dev/null
fi

# Find and kill processes on port 3002 (Express)
EXPRESS_PID=$(lsof -ti:3002 2>/dev/null)
if [ ! -z "$EXPRESS_PID" ]; then
    echo "  - Killing Express server (PID: $EXPRESS_PID)"
    kill -9 $EXPRESS_PID 2>/dev/null
fi

# Kill any Node processes running from RowLab directory
ROWLAB_PIDS=$(ps aux | grep "[n]ode.*RowLab" | awk '{print $2}')
if [ ! -z "$ROWLAB_PIDS" ]; then
    echo "  - Killing remaining RowLab Node processes"
    echo "$ROWLAB_PIDS" | xargs kill -9 2>/dev/null
fi

echo ""
echo "✓ All development servers stopped!"
echo ""
