# Delivery System API Testing Script

## Overview
This comprehensive testing script validates the complete "Happy Order Flow" for the delivery management system, testing the full lifecycle from order creation to completion and rating.

## Happy Order Flow Sequence
```
1. Account Setup
   ├── User Signup
   ├── Vendor Signup
   ├── Captain Signup
   └── Admin Signup

2. Order Lifecycle
   ├── User creates order → Status: PENDING
   ├── Vendor sends counter offer → Status: COUNTER_OFFER_SENT
   ├── User accepts counter offer → Status: COUNTER_OFFER_ACCEPTED
   ├── Admin unlocks captain
   ├── Captain accepts order → Status: ACCEPTED_BY_CAPTAIN
   ├── Captain starts delivery → Status: IN_DELIVERY
   ├── Captain marks delivered → Status: DELIVERED
   └── User rates captain

3. Verification
   ├── Check order in user's orders
   ├── Check order in vendor's orders
   └── Check order in captain's orders
```

## Prerequisites

### 1. Install Dependencies
```bash
npm install axios
```

### 2. Server Configuration
- Ensure your API server is running on `http://localhost:3004`
- Verify tenant `sadat` exists in your database
- Ensure at least one neighborhood exists (ID: 1)

### 3. Database Setup
Make sure your database has:
- At least one neighborhood record with ID 1
- Tenant 'sadat' configured
- No conflicts with test data (script uses timestamps for uniqueness)

## Running the Tests

### Option 1: Direct Execution
```bash
node test_happy_order_flow.js
```

### Option 2: Using Runner Script
```bash
node run_test.js
```

### Option 3: Make Executable (Linux/Mac)
```bash
chmod +x run_test.js
./run_test.js
```

## Test Configuration

### Modifying Test Settings
Edit the `CONFIG` object in `test_happy_order_flow.js`:

```javascript
const CONFIG = {
  baseURL: 'http://localhost:3004',  // API server URL
  tenantId: 'sadat',                 // Tenant ID
  logFile: 'test_results.log',       // Log output file
  timeout: 10000                     // Request timeout (ms)
};
```

### Customizing Test Data
Modify the `TEST_DATA` object to change test accounts:

```javascript
const TEST_DATA = {
  user: {
    userName: `testuser_${Date.now()}`,
    email: `testuser_${Date.now()}@test.com`,
    // ... other fields
  },
  // ... other roles
};
```

## Output and Logging

### Console Output
- Real-time progress updates
- Request/response summaries
- Success/failure indicators
- Final test summary

### Detailed Log File
The script generates `test_results.log` with:
- Complete request/response details
- Headers and payloads
- Timestamps for all operations
- Error stack traces
- Test state information

### Example Console Output
```
🚀 Starting Delivery System Happy Order Flow Test...

📋 PHASE 1: ACCOUNT SETUP
[2024-01-15T10:30:00.000Z] INFO: 🔄 Starting user signup
[2024-01-15T10:30:01.000Z] SUCCESS: ✅ User signup successful

📦 PHASE 2: ORDER CREATION AND FLOW
[2024-01-15T10:30:05.000Z] INFO: 🔄 Creating order as user
[2024-01-15T10:30:06.000Z] SUCCESS: ✅ Order created successfully

✅ PHASE 3: FINAL VERIFICATION
[2024-01-15T10:30:45.000Z] SUCCESS: 🎉 HAPPY ORDER FLOW TEST COMPLETED SUCCESSFULLY!
```

## Test Features

### 🔄 Sequential Execution
- Each step waits for the previous to complete
- Proper async/await implementation
- Configurable delays between operations

### 🔐 Authentication Management
- Automatic token storage and management
- Role-based authentication switching
- Header management for different roles

### 📊 Comprehensive Logging
- Request/response interceptors
- Timestamped operations
- Detailed error information
- Performance metrics

### ✅ Status Verification
- Order status validation after each step
- Cross-role order verification
- Final state confirmation

### 🛡️ Error Handling
- Network timeout handling
- API error response parsing
- Graceful failure recovery
- Detailed error reporting

## API Endpoints Tested

### Authentication Endpoints
- `POST /api/auth/signup` (User)
- `POST /api/auth/vendor/signup` (Vendor)
- `POST /api/auth/captain/signup` (Captain)
- `POST /api/admin-signup/signup` (Admin)

### Order Management Endpoints
- `POST /api/orders` (Create order)
- `GET /api/orders/:id` (Get order details)
- `PUT /api/orders/:id/vendor-counter-offer`
- `PUT /api/orders/:id/user-approve`
- `PUT /api/orders/:id/captain-approve`
- `PUT /api/orders/:id/start-delivery`
- `PUT /api/orders/:id/delivered`
- `PUT /api/orders/:id/rate-captain`

### Admin Endpoints
- `PUT /api/admin/captains/:id/lock-status`

### Order Listing Endpoints
- `GET /api/users/orders`
- `GET /api/vendors/orders`
- `GET /api/captains/orders`

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3004
```
**Solution**: Ensure your API server is running on port 3004

#### 2. Tenant Not Found
```
Error: 404 - Tenant not found
```
**Solution**: Verify tenant 'sadat' exists in your database

#### 3. Neighborhood Not Found
```
Error: Invalid neighborhoodId
```
**Solution**: Ensure neighborhood with ID 1 exists

#### 4. Captain Locked
```
Error: Captain is locked
```
**Solution**: The script automatically unlocks the captain, but ensure admin permissions are working

### Debugging Tips

1. **Check server logs** while running tests
2. **Review test_results.log** for detailed request/response data
3. **Verify database state** before running tests
4. **Check network connectivity** to the API server

## Expected Test Duration
- **Typical run time**: 30-60 seconds
- **Request count**: ~25-30 API calls
- **Success rate**: Should be 100% with proper setup

## Test Data Cleanup
The script uses timestamp-based unique identifiers, so multiple test runs won't conflict. However, you may want to periodically clean test data:

```sql
-- Example cleanup (adjust table names as needed)
DELETE FROM users WHERE email LIKE 'testuser_%@test.com';
DELETE FROM vendors WHERE vendorName LIKE 'TestVendor_%';
DELETE FROM captains WHERE email LIKE 'testcaptain_%@test.com';
```

## Integration with CI/CD
The script returns appropriate exit codes:
- `0` for success
- `1` for failure

Example GitHub Actions usage:
```yaml
- name: Run API Tests
  run: node run_test.js
```

## Extension Ideas

### Adding More Test Scenarios
1. **Sad Path Testing**: Order rejections, timeouts
2. **Concurrent Orders**: Multiple orders simultaneously
3. **Error Recovery**: Network failures, retries
4. **Performance Testing**: Load testing with multiple users

### Custom Assertions
Add custom validation functions:
```javascript
function assertOrderPrice(order, expectedPrice) {
  if (order.finalPrice !== expectedPrice) {
    throw new Error(`Price mismatch: expected ${expectedPrice}, got ${order.finalPrice}`);
  }
}
```

## Support
For issues with the testing script:
1. Check the detailed logs in `test_results.log`
2. Verify all prerequisites are met
3. Ensure database is properly seeded
4. Check API server status and logs