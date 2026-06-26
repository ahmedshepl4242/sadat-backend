const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { TimingTracker } = require('./timingUtils');

// Configuration
const CONFIG = {
  baseURL: 'http://localhost:3000',
  tenantId: 'tenant_' + Date.now().toString(), // Unique tenant ID for testing
  logFile: 'vendor_pricing_test_results.log',
  timeout: 30000,
  neighborhoodCount: 3,
  vendorCount: 3
};

// Timing tracker
const timingTracker = new TimingTracker();

// Test data
const TEST_DATA = {
  admin: {
    userName: `TestPricingAdmin_${Date.now()}`,
    email: `testpricingadmin_${Date.now()}@test.com`,
    phoneNumber: `+1777888${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
    password: 'TestAdmin123!',
    address: '789 Admin Plaza',
    tenantId: CONFIG.tenantId,
    fcmToken: 'test_admin_fcm_token',
    neighborhood_name: 'Test Initial Neighborhood'
  },
  neighborhoods: [
    { name: 'Downtown District' },
    { name: 'Suburban Heights' },
    { name: 'Industrial Zone' }
  ],
  vendors: [
    {
      vendorName: `PizzaPlace_${Date.now()}`,
      contactNumber: `+1111222${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      password: 'TestVendor123!',
      address: '100 Pizza Street',
      description: 'Best pizza in town',
      longitude: -74.006,
      latitude: 40.7128,
      fcmToken: 'pizza_vendor_fcm_token'
    },
    {
      vendorName: `BurgerJoint_${Date.now()}`,
      contactNumber: `+1333444${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      password: 'TestVendor123!',
      address: '200 Burger Avenue',
      description: 'Gourmet burgers and fries',
      longitude: -74.007,
      latitude: 40.7129,
      fcmToken: 'burger_vendor_fcm_token'
    },
    {
      vendorName: `SushiBar_${Date.now()}`,
      contactNumber: `+1555666${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      password: 'TestVendor123!',
      address: '300 Sushi Lane',
      description: 'Fresh sushi and Japanese cuisine',
      longitude: -74.008,
      latitude: 40.7130,
      fcmToken: 'sushi_vendor_fcm_token'
    }
  ]
};

// Global state
const STATE = {
  tokens: {},
  ids: {
    neighborhoods: [],
    vendors: []
  },
  requestCount: 0,
  createdNeighborhoods: [],
  createdVendors: []
};

// Logging utility
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.initLogFile();
  }

  initLogFile() {
    const timestamp = new Date().toISOString();
    const header = `\n${'='.repeat(80)}\nVendor Pricing Test Run Started: ${timestamp}\n${'='.repeat(80)}\n`;
    fs.writeFileSync(this.logFile, header);
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');

    if (data) {
      const dataStr = JSON.stringify(data, null, 2);
      console.log(dataStr);
      fs.appendFileSync(this.logFile, dataStr + '\n');
    }

    fs.appendFileSync(this.logFile, '\n');
  }

  info(message, data) { this.log('INFO', message, data); }
  success(message, data) { this.log('SUCCESS', message, data); }
  error(message, data) { this.log('ERROR', message, data); }
  warn(message, data) { this.log('WARN', message, data); }
}

const logger = new Logger(CONFIG.logFile);

// HTTP client with logging
class ApiClient {
  constructor(baseURL, tenantId) {
    this.baseURL = baseURL;
    this.tenantId = tenantId;
    this.client = axios.create({
      baseURL,
      timeout: CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        STATE.requestCount++;
        logger.info(`Request #${STATE.requestCount}: ${config.method.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.success(`Response #${STATE.requestCount}: ${response.status} ${response.statusText}`, {
          data: response.data,
          headers: response.headers
        });
        return response;
      },
      (error) => {
        const errorData = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        };
        logger.error(`Response #${STATE.requestCount}: Request failed`, errorData);
        return Promise.reject(error);
      }
    );
  }

  async request(config) {
    try {
      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  setAuthToken(token) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }
}

const apiClient = new ApiClient(CONFIG.baseURL, CONFIG.tenantId);

// Utility functions
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Authentication functions
async function signupAdmin() {
  logger.info('🔄 Starting admin signup (with initial neighborhood and system vendor)');

  try {
    const response = await apiClient.request({
      method: 'POST',
      url: '/api/admin-signup/signup',
      data: TEST_DATA.admin
    });

    const data = response.data || response;

    if (!data || !data.admin || !data.neighborhood || !data.systemVendor) {
      logger.error('❌ Admin signup failed - unexpected response structure', {
        responseKeys: response ? Object.keys(response) : 'no response',
        dataKeys: data ? Object.keys(data) : 'no data',
        hasAdmin: !!(data && data.admin),
        hasNeighborhood: !!(data && data.neighborhood),
        hasSystemVendor: !!(data && data.systemVendor)
      });
      throw new Error('Admin signup response has unexpected structure');
    }

    STATE.tokens.admin = data.token;
    STATE.ids.admin = data.admin.id;
    STATE.ids.systemVendor = data.systemVendor.id;
    STATE.tokens.systemVendor = data.systemVendor.token;

    // Store the initial neighborhood created during admin signup
    STATE.ids.initialNeighborhood = data.neighborhood.id;
    STATE.createdNeighborhoods.push({
      id: data.neighborhood.id,
      name: data.neighborhood.name,
      isInitial: true
    });

    logger.success('✅ Admin signup successful (with initial neighborhood and system vendor)', {
      adminId: STATE.ids.admin,
      initialNeighborhoodId: STATE.ids.initialNeighborhood,
      systemVendorId: STATE.ids.systemVendor,
      token: STATE.tokens.admin.substring(0, 20) + '...'
    });

    return response;
  } catch (error) {
    logger.error('❌ Admin signup failed', error.message);
    throw error;
  }
}

// Neighborhood functions
async function createNeighborhoods() {
  logger.info('🔄 Creating additional neighborhoods');

  apiClient.setAuthToken(STATE.tokens.admin);

  for (let i = 0; i < TEST_DATA.neighborhoods.length; i++) {
    const neighborhoodData = TEST_DATA.neighborhoods[i];

    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/api/neighborhoods',
        data: neighborhoodData
      });

      const createdNeighborhood = {
        id: response.data.id,
        name: response.data.name,
        isInitial: false
      };

      STATE.createdNeighborhoods.push(createdNeighborhood);
      STATE.ids.neighborhoods.push(response.data.id);

      logger.success(`✅ Neighborhood created: ${response.data.name}`, {
        id: response.data.id,
        name: response.data.name
      });

      await delay(500); // Small delay between creations
    } catch (error) {
      logger.error(`❌ Failed to create neighborhood: ${neighborhoodData.name}`, error.message);
      throw error;
    }
  }

  logger.success('✅ All additional neighborhoods created successfully', {
    totalNeighborhoods: STATE.createdNeighborhoods.length,
    neighborhoods: STATE.createdNeighborhoods
  });
}

async function verifyNeighborhoodsCount() {
  logger.info('🔄 Verifying neighborhoods count');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: 'GET',
      url: '/api/neighborhoods?limit=100'
    });

    const fetchedNeighborhoods = response.data.neighborhoods;
    const expectedCount = STATE.createdNeighborhoods.length;
    const actualCount = fetchedNeighborhoods.length;

    if (actualCount === expectedCount) {
      logger.success(`✅ Neighborhoods count verified: ${actualCount} neighborhoods`, {
        expected: expectedCount,
        actual: actualCount,
        neighborhoods: fetchedNeighborhoods.map(n => ({ id: n.id, name: n.name }))
      });
    } else {
      logger.warn(`⚠️ Neighborhoods count mismatch: expected ${expectedCount}, got ${actualCount}`);
    }

    return response.data;
  } catch (error) {
    logger.error('❌ Failed to verify neighborhoods count', error.message);
    throw error;
  }
}

// Vendor functions
async function signupVendors() {
  logger.info('🔄 Starting vendor signups');

  for (let i = 0; i < TEST_DATA.vendors.length; i++) {
    const vendorData = TEST_DATA.vendors[i];

    // Assign vendor to a neighborhood (cycling through available neighborhoods)
    const neighborhoodIndex = i % STATE.createdNeighborhoods.length;
    const assignedNeighborhood = STATE.createdNeighborhoods[neighborhoodIndex];

    const vendorWithNeighborhood = {
      ...vendorData,
      neighborhoodId: assignedNeighborhood.id
    };

    try {
      const response = await apiClient.request({
        method: 'POST',
        url: '/api/auth/signup/vendor',
        data: vendorWithNeighborhood
      });

      const createdVendor = {
        id: response.data.vendor.id,
        name: response.data.vendor.vendorName,
        token: response.data.token,
        neighborhoodId: assignedNeighborhood.id,
        neighborhoodName: assignedNeighborhood.name
      };

      STATE.createdVendors.push(createdVendor);
      STATE.ids.vendors.push(response.data.vendor.id);

      logger.success(`✅ Vendor created: ${response.data.vendor.vendorName}`, {
        id: response.data.vendor.id,
        name: response.data.vendor.vendorName,
        neighborhoodId: assignedNeighborhood.id,
        neighborhoodName: assignedNeighborhood.name
      });

      await delay(1000); // Delay between vendor creations
    } catch (error) {
      logger.error(`❌ Failed to create vendor: ${vendorData.vendorName}`, error.message);
      throw error;
    }
  }

  logger.success('✅ All vendors created successfully', {
    totalVendors: STATE.createdVendors.length,
    vendors: STATE.createdVendors
  });
}

// Pricing functions
async function setBulkPricingForAllVendors() {
  logger.info('🔄 Setting bulk pricing for all vendors');

  apiClient.setAuthToken(STATE.tokens.admin);

  for (let i = 0; i < STATE.createdVendors.length; i++) {
    const vendor = STATE.createdVendors[i];

    // Create pricing for all neighborhoods
    const pricingData = STATE.createdNeighborhoods.map((neighborhood, index) => ({
      neighborhoodId: neighborhood.id,
      price: 10.00 + (index * 2.50) + (i * 1.00) // Varied pricing
    }));

    try {
      const response = await apiClient.request({
        method: 'PUT',
        url: `/api/admin/vendors/${vendor.id}/bulk-set-pricing`,
        data: {
          neighborhoodPrices: pricingData
        }
      });

      logger.success(`✅ Bulk pricing set for vendor: ${vendor.name}`, {
        vendorId: vendor.id,
        vendorName: vendor.name,
        pricingCount: pricingData.length,
        pricing: pricingData
      });

      await delay(500); // Small delay between bulk operations
    } catch (error) {
      logger.error(`❌ Failed to set bulk pricing for vendor: ${vendor.name}`, error.message);
      throw error;
    }
  }

  logger.success('✅ Bulk pricing set for all vendors successfully');
}

async function verifyVendorPricingForAllNeighborhoods() {
  logger.info('🔄 Verifying vendor pricing across all neighborhoods');

  apiClient.setAuthToken(STATE.tokens.admin);

  for (let i = 0; i < STATE.createdVendors.length; i++) {
    const vendor = STATE.createdVendors[i];

    try {
      const response = await apiClient.request({
        method: 'GET',
        url: `/api/vendor-pricing/neighborhoods?vendorId=${vendor.id}`
      });

      const neighborhoodsWithPricing = response.data;
      const pricedNeighborhoods = neighborhoodsWithPricing.filter(n => n.hasPricing);

      logger.success(`✅ Pricing verified for vendor: ${vendor.name}`, {
        vendorId: vendor.id,
        vendorName: vendor.name,
        totalNeighborhoods: neighborhoodsWithPricing.length,
        pricedNeighborhoods: pricedNeighborhoods.length,
        pricing: pricedNeighborhoods.map(n => ({
          neighborhoodId: n.id,
          neighborhoodName: n.name,
          price: n.price
        }))
      });

      // Verify that all neighborhoods have pricing
      if (pricedNeighborhoods.length !== STATE.createdNeighborhoods.length) {
        logger.warn(`⚠️ Pricing mismatch for vendor ${vendor.name}: expected ${STATE.createdNeighborhoods.length}, got ${pricedNeighborhoods.length}`);
      }

      await delay(500); // Small delay between verifications
    } catch (error) {
      logger.error(`❌ Failed to verify pricing for vendor: ${vendor.name}`, error.message);
      throw error;
    }
  }

  logger.success('✅ Pricing verification completed for all vendors');
}

// Neighborhood deletion test
async function testNeighborhoodDeletion() {
  logger.info('🔄 Testing neighborhood deletion');

  apiClient.setAuthToken(STATE.tokens.admin);

  // Select the last created neighborhood for deletion (not the initial one)
  const neighborhoodToDelete = STATE.createdNeighborhoods.find(n => !n.isInitial);

  if (!neighborhoodToDelete) {
    logger.warn('⚠️ No non-initial neighborhood available for deletion test');
    return;
  }

  try {
    const response = await apiClient.request({
      method: 'DELETE',
      url: `/api/neighborhoods/${neighborhoodToDelete.id}`
    });

    logger.success(`✅ Neighborhood deleted successfully: ${neighborhoodToDelete.name}`, {
      deletedNeighborhoodId: neighborhoodToDelete.id,
      deletedNeighborhoodName: neighborhoodToDelete.name
    });

    // Verify deletion by trying to get all neighborhoods
    await verifyNeighborhoodDeletion(neighborhoodToDelete);

  } catch (error) {
    logger.error(`❌ Failed to delete neighborhood: ${neighborhoodToDelete.name}`, error.message);
    throw error;
  }
}

async function verifyNeighborhoodDeletion(deletedNeighborhood) {
  logger.info('🔄 Verifying neighborhood deletion');

  try {
    const response = await apiClient.request({
      method: 'GET',
      url: '/api/neighborhoods?limit=100'
    });

    const remainingNeighborhoods = response.data.neighborhoods;
    const deletedNeighborhoodExists = remainingNeighborhoods.some(n => n.id === deletedNeighborhood.id);

    if (!deletedNeighborhoodExists) {
      logger.success(`✅ Neighborhood deletion verified: ${deletedNeighborhood.name} no longer exists`, {
        deletedNeighborhoodId: deletedNeighborhood.id,
        remainingCount: remainingNeighborhoods.length
      });
    } else {
      logger.error(`❌ Neighborhood deletion failed: ${deletedNeighborhood.name} still exists`);
    }

    return !deletedNeighborhoodExists;
  } catch (error) {
    logger.error('❌ Failed to verify neighborhood deletion', error.message);
    throw error;
  }
}

// Main test function
async function runVendorPricingFlow() {
  const testStartTime = Date.now();
  timingTracker.startTracking();

  try {
    logger.info('🚀 Starting Vendor Pricing Flow Test');
    logger.info('Configuration', CONFIG);

    // Phase 1: Admin Setup
    logger.info('\n📋 PHASE 1: ADMIN AND INITIAL SETUP');

    timingTracker.startOperation('signupAdmin');
    await signupAdmin();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 2: Neighborhood Creation
    logger.info('\n🏘️ PHASE 2: NEIGHBORHOOD CREATION');

    timingTracker.startOperation('createNeighborhoods');
    await createNeighborhoods();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('verifyNeighborhoodsCount');
    await verifyNeighborhoodsCount();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 3: Vendor Creation
    logger.info('\n🏪 PHASE 3: VENDOR CREATION');

    timingTracker.startOperation('signupVendors');
    await signupVendors();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 4: Bulk Pricing Setup
    logger.info('\n💰 PHASE 4: BULK PRICING SETUP');

    timingTracker.startOperation('setBulkPricingForAllVendors');
    await setBulkPricingForAllVendors();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 5: Pricing Verification
    logger.info('\n✅ PHASE 5: PRICING VERIFICATION');

    timingTracker.startOperation('verifyVendorPricingForAllNeighborhoods');
    await verifyVendorPricingForAllNeighborhoods();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 6: Neighborhood Deletion Test
    logger.info('\n🗑️ PHASE 6: NEIGHBORHOOD DELETION TEST');

    timingTracker.startOperation('testNeighborhoodDeletion');
    await testNeighborhoodDeletion();
    timingTracker.endOperation();
    await delay(1000);

    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    // Test Summary
    logger.success('\n🎉 VENDOR PRICING FLOW TEST COMPLETED SUCCESSFULLY!');
    logger.info('Test Summary', {
      totalRequests: STATE.requestCount,
      duration: `${testDuration} seconds`,
      neighborhoodsCreated: STATE.createdNeighborhoods.length,
      vendorsCreated: STATE.createdVendors.length,
      adminId: STATE.ids.admin,
      testData: {
        adminEmail: TEST_DATA.admin.email,
        neighborhoods: STATE.createdNeighborhoods.map(n => n.name),
        vendors: STATE.createdVendors.map(v => v.name)
      }
    });

    // Timing Statistics
    timingTracker.printStats();

    return {
      success: true,
      duration: testDuration,
      requestCount: STATE.requestCount,
      neighborhoodsCreated: STATE.createdNeighborhoods.length,
      vendorsCreated: STATE.createdVendors.length,
      timingStats: timingTracker.getStats()
    };

  } catch (error) {
    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    logger.error('\n💥 VENDOR PRICING FLOW TEST FAILED!');
    logger.error('Error Details', {
      message: error.message,
      stack: error.stack,
      duration: `${testDuration} seconds`,
      requestCount: STATE.requestCount,
      currentState: STATE
    });

    // Timing Statistics (partial)
    timingTracker.printStats();

    return {
      success: false,
      error: error.message,
      duration: testDuration,
      requestCount: STATE.requestCount,
      timingStats: timingTracker.getStats()
    };
  }
}

// Execute if run directly
if (require.main === module) {
  runVendorPricingFlow()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Vendor Pricing Test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Vendor Pricing Test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = {
  runVendorPricingFlow,
  Logger,
  ApiClient,
  CONFIG,
  TEST_DATA
};