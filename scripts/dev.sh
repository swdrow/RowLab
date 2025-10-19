#!/bin/bash
# Development helper script
# Starts both frontend and backend in tmux session

SESSION_NAME="rowlab-dev"

# Check if tmux session already exists
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo "Session $SESSION_NAME already exists. Attaching..."
    tmux attach-session -t $SESSION_NAME
    exit 0
fi

# Create new tmux session
echo "Starting RowLab development environment..."

# Create session with first window for backend
tmux new-session -d -s $SESSION_NAME -n "backend"
tmux send-keys -t $SESSION_NAME:0 "cd /home/swd/RowLab" C-m
tmux send-keys -t $SESSION_NAME:0 "npm run server" C-m

# Create second window for frontend
tmux new-window -t $SESSION_NAME:1 -n "frontend"
tmux send-keys -t $SESSION_NAME:1 "cd /home/swd/RowLab" C-m
tmux send-keys -t $SESSION_NAME:1 "sleep 2 && npm run dev" C-m

# Create third window for general commands
tmux new-window -t $SESSION_NAME:2 -n "shell"
tmux send-keys -t $SESSION_NAME:2 "cd /home/swd/RowLab" C-m

# Select first window
tmux select-window -t $SESSION_NAME:0

# Attach to session
echo "Attaching to tmux session..."
echo "Use Ctrl+B then 0/1/2 to switch windows"
echo "Use Ctrl+B then D to detach"
tmux attach-session -t $SESSION_NAME
