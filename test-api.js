// Warehouse Inventory API Test Script
const http = require('http');

const BASE_URL = 'http://localhost:3000';
let testCount = 0;
let passCount = 0;
let failCount = 0;

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : body;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function test(name, testFn) {
  testCount++;
  testFn()
    .then(result => {
      passCount++;
      console.log(`✅ ${name} - PASS`);
      if (result.data) console.log(`   Response:`, JSON.stringify(result.data).substring(0, 100));
    })
    .catch(error => {
      failCount++;
      console.log(`❌ ${name} - FAIL`);
      console.log(`   Error:`, error.message);
    });
}

async function runTests() {
  console.log('🧪 Starting Warehouse Inventory API Tests...\n');
  console.log('Make sure your server is running at http://localhost:3000\n');

  const uniqueSku = `TEST-${Date.now()}`;

  // Test 1: GET all inventory items
  test('GET /api/inventory - Get all inventory items', async () => {
    const result = await makeRequest('GET', '/api/inventory');
    if (result.status === 200 && Array.isArray(result.data)) {
      return result;
    }
    throw new Error(`Expected 200 with array, got ${result.status}`);
  });

  // Test 2: GET inventory statistics
  test('GET /api/inventory/stats - Get statistics', async () => {
    const result = await makeRequest('GET', '/api/inventory/stats');
    if (result.status === 200 && result.data.totalItems !== undefined) {
      return result;
    }
    throw new Error(`Expected 200 with stats, got ${result.status}`);
  });

  // Test 3: GET specific inventory item
  test('GET /api/inventory/1 - Get specific item', async () => {
    const result = await makeRequest('GET', '/api/inventory/1');
    if (result.status === 200 && result.data.id === 1) {
      return result;
    }
    throw new Error(`Expected 200 with item id 1, got ${result.status}`);
  });

  // Test 4: GET non-existent item (404)
  test('GET /api/inventory/999 - Get non-existent item (404)', async () => {
    const result = await makeRequest('GET', '/api/inventory/999');
    if (result.status === 404) {
      return result;
    }
    throw new Error(`Expected 404, got ${result.status}`);
  });

  // Test 5: GET low stock items
  test('GET /api/inventory/low-stock - Get low stock items', async () => {
    const result = await makeRequest('GET', '/api/inventory/low-stock');
    if (result.status === 200 && Array.isArray(result.data)) {
      return result;
    }
    throw new Error(`Expected 200 with array, got ${result.status}`);
  });

  // Test 6: POST new inventory item
  test('POST /api/inventory - Create new item', async () => {
    const result = await makeRequest('POST', '/api/inventory', {
      name: 'Test Item',
      sku: uniqueSku,
      quantity: 10,
      location: 'A-1-1',
      category: 'Test',
      minStock: 5,
      maxStock: 50,
      unit: 'units'
    });
    if (result.status === 201 && result.data.name === 'Test Item') {
      return result;
    }
    throw new Error(`Expected 201 with new item, got ${result.status}`);
  });

  // Test 7: PUT update inventory item
  test('PUT /api/inventory/1 - Update item', async () => {
    const result = await makeRequest('PUT', '/api/inventory/1', { quantity: 50 });
    if (result.status === 200 && result.data.quantity === 50) {
      return result;
    }
    throw new Error(`Expected 200 with updated item, got ${result.status}`);
  });

  // Test 8: PATCH adjust quantity
  test('PATCH /api/inventory/1/quantity - Adjust quantity', async () => {
    const result = await makeRequest('PATCH', '/api/inventory/1/quantity', {
      adjustment: 5,
      operation: 'add'
    });
    if (result.status === 200 && result.data.quantity !== undefined) {
      return result;
    }
    throw new Error(`Expected 200 with adjusted quantity, got ${result.status}`);
  });

  // Wait for all tests to complete
  setTimeout(() => {
    console.log('\n📊 Test Results:');
    console.log(`   Total: ${testCount}`);
    console.log(`   ✅ Passed: ${passCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   Success Rate: ${((passCount / testCount) * 100).toFixed(1)}%`);
    process.exit(failCount > 0 ? 1 : 0);
  }, 2000);
}

runTests();
