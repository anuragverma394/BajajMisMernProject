#!/bin/bash
# Backend Setup Script for Monorepo
# Usage: bash setup.sh

set -e

echo "=================================================="
echo "Bajaj Backend Monorepo Setup"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed"
    exit 1
fi

echo -e "${YELLOW}1. Installing root dependencies...${NC}"
npm install

echo -e "${YELLOW}2. Verifying shared package is linked...${NC}"
if [ -d "node_modules/@bajaj" ]; then
    echo -e "${GREEN}✓ @bajaj/shared is linked${NC}"
else
    echo "ERROR: @bajaj/shared not linked"
    exit 1
fi

echo ""
echo -e "${YELLOW}3. Checking service dependencies...${NC}"
SERVICES=("user-service" "auth-service" "dashboard-service" "report-service" "tracking-service" "survey-service" "lab-service" "distillery-service" "whatsapp-service")

for service in "${SERVICES[@]}"; do
    if [ -d "services/$service" ]; then
        echo -e "${GREEN}✓ /services/$service${NC}"
    fi
done

echo ""
echo -e "${GREEN}=================================================="
echo "Setup Complete! ✓"
echo "==================================================${NC}"
echo ""
echo "To start all services:"
echo "  npm start"
echo ""
echo "To start a specific service:"
echo "  cd services/user-service && npm start"
echo ""
