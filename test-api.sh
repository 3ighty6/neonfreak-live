#!/bin/bash

echo "=== Testing Token Balance API ==="
curl -s "https://neonfreak-live.vercel.app/api/get-token-balance?userId=test-user-123" | jq . || echo "Failed to call API"

echo -e "\n=== Testing Mux Stream Creation ==="
curl -s -X POST "https://neonfreak-live.vercel.app/api/mux-create-stream" \
  -H "Content-Type: application/json" \
  -d '{"streamerId":"test-creator","title":"Test Stream"}' | jq . || echo "Failed"

echo -e "\n=== Testing Search ==="
curl -s "https://neonfreak-live.vercel.app/api/search-hashtags?tag=test" | jq . || echo "Failed"

