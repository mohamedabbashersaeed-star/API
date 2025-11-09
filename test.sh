#!/bin/bash

# Quick Warehouse Inventory API Test Script
BASE_URL="http://localhost:3000/api"

echo "🧪 Testing Warehouse Inventory API at $BASE_URL"
echo "================================================"
echo ""

# Test 1: GET all inventory items
echo "1️⃣  GET /api/inventory"
curl -s "$BASE_URL/inventory" | python3 -m json.tool || echo "Failed"
echo ""
echo ""

# Test 2: GET inventory statistics
echo "2️⃣  GET /api/inventory/stats"
curl -s "$BASE_URL/inventory/stats" | python3 -m json.tool || echo "Failed"
echo ""
echo ""

# Test 3: GET specific inventory item
echo "3️⃣  GET /api/inventory/1"
curl -s "$BASE_URL/inventory/1" | python3 -m json.tool || echo "Failed"
echo ""
echo ""

# Test 4: GET low stock items
echo "4️⃣  GET /api/inventory/low-stock"
curl -s "$BASE_URL/inventory/low-stock" | python3 -m json.tool || echo "Failed"
echo ""
echo ""

# Test 5: POST new inventory item
echo "5️⃣  POST /api/inventory - Create new item"
curl -s -X POST "$BASE_URL/inventory" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item from Script",
    "sku": "TEST-SCRIPT-001",
    "quantity": 25,
    "location": "A-1-1",
    "category": "Test",
    "minStock": 10,
    "maxStock": 100,
    "unit": "units"
  }' | python3 -m json.tool || echo "Failed"
echo ""
echo ""

# Test 6: PUT update inventory item
echo "6️⃣  PUT /api/inventory/1 - Update item"
curl -s -X PUT "$BASE_URL/inventory/1" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 50}' | python3 -m json.tool || echo "Failed"
echo ""
echo ""

# Test 7: PATCH adjust quantity
echo "7️⃣  PATCH /api/inventory/1/quantity - Adjust quantity"
curl -s -X PATCH "$BASE_URL/inventory/1/quantity" \
  -H "Content-Type: application/json" \
  -d '{"adjustment": 10, "operation": "add"}' | python3 -m json.tool || echo "Failed"
echo ""
echo ""

# Test 8: GET all inventory items again
echo "8️⃣  GET /api/inventory - Final state"
curl -s "$BASE_URL/inventory" | python3 -m json.tool || echo "Failed"
echo ""
echo ""

echo "✅ Testing complete!"
