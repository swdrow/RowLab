#!/bin/bash
# RowLab Deployment Script

set -e  # Exit on error

echo "╔══════════════════════════════════════════════╗"
echo "║      RowLab Deployment Script                ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/swd/RowLab"
SERVICE_NAME="rowlab"

# Check if running in project directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from RowLab project directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install

echo ""
echo -e "${YELLOW}Step 2: Building production bundle...${NC}"
npm run build

echo ""
echo -e "${YELLOW}Step 3: Checking systemd service...${NC}"

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}Service is running. Restarting...${NC}"
    sudo systemctl restart "$SERVICE_NAME"
else
    echo -e "${YELLOW}Service not running. Starting...${NC}"
    sudo systemctl start "$SERVICE_NAME"
fi

echo ""
echo -e "${YELLOW}Step 4: Enabling service on boot...${NC}"
sudo systemctl enable "$SERVICE_NAME"

echo ""
echo -e "${YELLOW}Step 5: Checking service status...${NC}"
sudo systemctl status "$SERVICE_NAME" --no-pager

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Deployment Complete!                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Service status: ${GREEN}$(systemctl is-active $SERVICE_NAME)${NC}"
echo -e "Access URL: ${GREEN}http://localhost:3002${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure nginx (see config/nginx-location.conf)"
echo "  2. Test application at http://localhost:3002"
echo "  3. Check logs: sudo journalctl -u rowlab -f"
echo ""
