#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}       CHEQD TELEGRAM BOT MODERATION TESTS        ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

# First make sure GunDB server is running
if ! nc -z localhost 3000; then
  echo -e "${RED}Error: GunDB server is not running on port 3000${NC}"
  echo "Please start the GunDB server first with 'node start-hackathon.js'"
  exit 1
fi

echo -e "${GREEN}Step 1: Setting up test credentials...${NC}"
node setup-test-credentials.js

# Check if setup was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to set up test credentials${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Step 2: Running moderation function tests...${NC}"
node test-moderation.js

# Check if tests ran successfully
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Moderation tests failed${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the test results above"
echo "2. Check for any errors or unexpected behaviors"
echo "3. Modify your code as needed to fix any issues"
echo ""
echo -e "${BLUE}==================================================${NC}" 