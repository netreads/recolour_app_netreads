#!/bin/bash

# Script to fix stuck payments
# Usage: ./scripts/fix-stuck-payments.sh [order-id]
#
# If order-id is provided, fixes only that order
# If no order-id is provided, fixes all stuck orders

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ADMIN_FIX_PAYMENT_KEY is set
if [ -z "$ADMIN_FIX_PAYMENT_KEY" ]; then
    echo -e "${RED}Error: ADMIN_FIX_PAYMENT_KEY environment variable is not set${NC}"
    echo "Please set it with: export ADMIN_FIX_PAYMENT_KEY='your-key'"
    exit 1
fi

# Check if PRODUCTION_URL is set
if [ -z "$PRODUCTION_URL" ]; then
    echo -e "${RED}Error: PRODUCTION_URL environment variable is not set${NC}"
    echo "Please set it with: export PRODUCTION_URL='https://your-domain.com'"
    exit 1
fi

# Build the request body
if [ -z "$1" ]; then
    echo -e "${YELLOW}Fixing all stuck orders...${NC}"
    REQUEST_BODY="{\"adminKey\": \"$ADMIN_FIX_PAYMENT_KEY\"}"
else
    echo -e "${YELLOW}Fixing order: $1${NC}"
    REQUEST_BODY="{\"adminKey\": \"$ADMIN_FIX_PAYMENT_KEY\", \"orderId\": \"$1\"}"
fi

# Make the API call
RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/admin/fix-payment" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

# Check if the request was successful
if echo "$RESPONSE" | grep -q "\"success\":true"; then
    echo -e "${GREEN}✓ Success!${NC}"
    echo "$RESPONSE" | jq '.'
    
    FIXED_COUNT=$(echo "$RESPONSE" | jq -r '.fixedCount')
    echo -e "${GREEN}Fixed $FIXED_COUNT order(s)${NC}"
else
    echo -e "${RED}✗ Failed!${NC}"
    echo "$RESPONSE" | jq '.'
fi

