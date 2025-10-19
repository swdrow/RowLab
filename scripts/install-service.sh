#!/bin/bash
# Install RowLab systemd service

set -e

echo "Installing RowLab systemd service..."

# Copy service file to systemd directory
sudo cp config/rowlab.service /etc/systemd/system/rowlab.service

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable rowlab.service

echo "✓ Service installed successfully!"
echo ""
echo "Usage:"
echo "  Start:   sudo systemctl start rowlab"
echo "  Stop:    sudo systemctl stop rowlab"
echo "  Restart: sudo systemctl restart rowlab"
echo "  Status:  sudo systemctl status rowlab"
echo "  Logs:    sudo journalctl -u rowlab -f"
echo ""
