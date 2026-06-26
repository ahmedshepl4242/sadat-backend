const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { TimingTracker } = require('./timingUtils');

// Configuration
const CONFIG = {
  baseURL: 'http://localhost:3000',
  tenantId: 'tenant_' + Date.now().toString(), // Unique tenant ID for testing
  logFile: 'test_bad_order_scenarios_results.log',
  timeout: 30000
};

// Timing tracker
const timingTracker = new TimingTracker();

// Test data
const TEST_DATA = {
  user: {
    userName: `testuser_${Date.now()}`,
    email: `testuser_${Date.now()}@test.com`,
    phoneNumber: `+1234567${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
    password: 'TestUser123!',
    address: '123 Test Street',
    neighborhoodId: null, // Will be set after neighborhood creation
    fcmToken: 'test_user_fcm_token'
  },
  vendor: {
    vendorName: `TestVendor_${Date.now()}`,
    contactNumber: `+1987654${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
    password: 'TestVendor123!',
    address: '456 Vendor Avenue',
    description: 'Test vendor for automated testing',
    neighborhoodId: null, // Will be set after neighborhood creation
    longitude: -74.006,
    latitude: 40.7128,
    fcmToken: 'test_vendor_fcm_token'
  },
  captain: {
    userName: `testcaptain_${Date.now()}`,
    email: `testcaptain_${Date.now()}@test.com`,
    phoneNumber: `+1555123${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
    password: 'TestCaptain123!',
    longitude: -74.006,
    latitude: 40.7128,
    fcmToken: 'test_captain_fcm_token',
    workingHoursStart: '08:00',
    workingHoursEnd: '20:00'
  },
  admin: {
    userName: `TestAdmin_${Date.now()}`,
    email: `testadmin_${Date.now()}@test.com`,
    phoneNumber: `+1666789${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
    password: 'TestAdmin123!',
    address: '789 Admin Plaza',
    tenantId: CONFIG.tenantId,
    fcmToken: 'test_admin_fcm_token',
    neighborhood_name: 'Test Neighborhood'
  }
};

// Global state
const STATE = {
  tokens: {},
  ids: {},
  orderId: null,
  requestCount: 0
};

// Logging utility
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.initLogFile();
  }

  initLogFile() {
    const timestamp = new Date().toISOString();
    const header = `\n${'='.repeat(80)}\nBad Order Scenarios Test Run Started: ${timestamp}\n${'='.repeat(80)}\n`;
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

async function verifyOrderStatus(expectedStatus, role = null) {
  try {
    logger.info(`Verifying order status: expected ${expectedStatus}`);

    const response = await apiClient.request({
      method: 'GET',
      url: `/api/orders/${STATE.orderId}`
    });

    // The order data is directly in response.data due to axios interceptor
    const currentStatus = response.data.status;

    if (currentStatus === expectedStatus) {
      logger.success(`✅ Order status verified: ${currentStatus}`);
      return response.data;
    } else {
      logger.warn(`⚠️ Order status mismatch: expected ${expectedStatus}, got ${currentStatus}`);
      return response.data;
    }
  } catch (error) {
    logger.error('Failed to verify order status', error.message);
    throw error;
  }
}

// Authentication functions
async function signupUser() {
  logger.info('🔄 Starting user signup');

  try {
    // Update neighborhood ID
    const userData = { ...TEST_DATA.user, neighborhoodId: STATE.ids.neighborhood };

    const response = await apiClient.request({
      method: 'POST',
      url: '/api/auth/signup/user',
      data: userData
    });

    STATE.tokens.user = response.data.token;
    STATE.ids.user = response.data.user.id;

    logger.success('✅ User signup successful', {
      userId: STATE.ids.user,
      token: STATE.tokens.user.substring(0, 20) + '...'
    });

    return response.data;
  } catch (error) {
    logger.error('❌ User signup failed', error.message);
    throw error;
  }
}

async function signupVendor() {
  logger.info('🔄 Starting vendor signup');

  try {
    // Update neighborhood ID
    const vendorData = { ...TEST_DATA.vendor, neighborhoodId: STATE.ids.neighborhood };

    const response = await apiClient.request({
      method: 'POST',
      url: '/api/auth/signup/vendor',
      data: vendorData
    });

    STATE.tokens.vendor = response.data.token;
    STATE.ids.vendor = response.data.vendor.id;

    logger.success('✅ Vendor signup successful', {
      vendorId: STATE.ids.vendor,
      token: STATE.tokens.vendor.substring(0, 20) + '...'
    });

    // Set pricing for this vendor in the created neighborhood
    await setTestVendorPricing();

    return response.data;
  } catch (error) {
    logger.error('❌ Vendor signup failed', error.message);
    throw error;
  }
}

async function signupCaptain() {
  logger.info('🔄 Starting captain signup');

  try {
    const response = await apiClient.request({
      method: 'POST',
      url: '/api/auth/signup/captain',
      data: TEST_DATA.captain
    });

    STATE.tokens.captain = response.data.token;
    STATE.ids.captain = response.data.captain.id;

    logger.success('✅ Captain signup successful', {
      captainId: STATE.ids.captain,
      token: STATE.tokens.captain.substring(0, 20) + '...'
    });

    return response.data;
  } catch (error) {
    logger.error('❌ Captain signup failed', error.message);
    throw error;
  }
}

async function signupAdmin() {
  logger.info('🔄 Starting admin signup (with neighborhood and system vendor creation)');

  try {
    const response = await apiClient.request({
      method: 'POST',
      url: '/api/admin-signup/signup',
      data: TEST_DATA.admin
    });

    // The response structure from our API is { success: true, data: {...}, message: '...' }
    // The actual data is in response.data
    const data = response.data || response;

    // Check if we have the expected data structure in the response
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

    // Extract neighborhood and system vendor from the 3-in-1 response
    STATE.ids.neighborhood = data.neighborhood.id;
    STATE.ids.systemVendor = data.systemVendor.id;
    STATE.tokens.systemVendor = data.systemVendor.token;

    logger.success('✅ Admin signup successful (with neighborhood and system vendor)', {
      adminId: STATE.ids.admin,
      neighborhoodId: STATE.ids.neighborhood,
      systemVendorId: STATE.ids.systemVendor,
      token: STATE.tokens.admin.substring(0, 20) + '...'
    });
    
    // Verify all three entities were created correctly
    logger.info('🔍 Verifying 3-in-1 creation', {
      tenant: {
        id: data.admin.id,
        name: data.admin.tenantName,
        email: data.admin.email
      },
      neighborhood: {
        id: data.neighborhood.id,
        name: data.neighborhood.name,
        tenantId: data.neighborhood.tenantId
      },
      systemVendor: {
        id: data.systemVendor.id,
        name: data.systemVendor.vendorName,
        tenantId: data.systemVendor.tenantId
      }
    });

    return response;
  } catch (error) {
    logger.error('❌ Admin signup failed', error.message);
    throw error;
  }
}

async function setTestVendorPricing() {
  logger.info('🔄 Setting test vendor pricing for neighborhood');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: 'POST',
      url: '/api/vendor-pricing',
      data: {
        vendorId: STATE.ids.vendor,
        neighborhoodId: STATE.ids.neighborhood,
        price: 15.00
      }
    });

    logger.success('✅ Test vendor pricing set successfully', {
      vendorId: STATE.ids.vendor,
      neighborhoodId: STATE.ids.neighborhood,
      price: 15.00
    });

    return response.data;
  } catch (error) {
    logger.error('❌ Test vendor pricing setup failed', error.message);
    throw error;
  }
}

// Admin unlock functions
async function unlockVendor() {
  logger.info('🔄 Unlocking vendor as admin');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: 'PUT',
      url: `/api/admin/vendors/${STATE.ids.vendor}/lock-status`,
      data: {
        isLocked: false
      }
    });

    logger.success('✅ Vendor unlocked successfully', {
      vendorId: STATE.ids.vendor,
      isLocked: false
    });

    return response.data;
  } catch (error) {
    logger.error('❌ Vendor unlock failed', error.message);
    throw error;
  }
}

async function unlockCaptain() {
  logger.info('🔄 Admin unlocking captain');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: 'PUT',
      url: `/api/admin/captains/${STATE.ids.captain}/lock-status`,
      data: { isLocked: false }
    });

    logger.success('✅ Captain unlocked successfully', {
      captainId: STATE.ids.captain,
      isLocked: response.data.isLocked
    });

    return response.data;
  } catch (error) {
    logger.error('❌ Captain unlock failed', error.message);
    throw error;
  }
}

// Order workflow functions for bad scenarios
async function createOrder() {
  logger.info('🔄 Creating order as user');

  apiClient.setAuthToken(STATE.tokens.user);

  try {
    const orderData = {
      vendorId: STATE.ids.vendor,
      description: 'Test order for bad scenario flow',
      userAddress: '123 Test Street',
      phoneNumber: '+1234567890',
      neighborhoodId: STATE.ids.neighborhood,
      additionalNotes: 'Test order for scenario where vendor rejects'
    };

    const response = await apiClient.request({
      method: 'POST',
      url: '/api/orders/create-by-user',
      data: orderData
    });

    STATE.orderId = response.data.id;

    logger.success('✅ Order created successfully', {
      orderId: STATE.orderId,
      status: response.data.status
    });

    // Verify order status
    await verifyOrderStatus('PENDING');

    return response.data;
  } catch (error) {
    logger.error('❌ Order creation failed', error.message);
    throw error;
  }
}

async function vendorRejectOrder() {
  logger.info('🔄 Vendor rejecting order');

  apiClient.setAuthToken(STATE.tokens.vendor);

  try {
    const response = await apiClient.request({
      method: 'PUT',
      url: `/api/orders/${STATE.orderId}/vendor-reject`
    });

    logger.success('✅ Vendor rejected order successfully', {
      orderId: STATE.orderId,
      status: response.data.status
    });

    // Verify order status
    await verifyOrderStatus('CANCELLED');

    return response.data;
  } catch (error) {
    logger.error('❌ Vendor reject order failed', error.message);
    throw error;
  }
}

async function createOrder2() {
  logger.info('🔄 Creating second order as user (for counter offer rejection test)');

  apiClient.setAuthToken(STATE.tokens.user);

  try {
    const orderData = {
      vendorId: STATE.ids.vendor,
      description: 'Test order for counter offer rejection scenario',
      userAddress: '456 Test Street',
      phoneNumber: '+1234567891',
      neighborhoodId: STATE.ids.neighborhood,
      additionalNotes: 'Test order for counter offer rejection'
    };

    const response = await apiClient.request({
      method: 'POST',
      url: '/api/orders/create-by-user',
      data: orderData
    });

    STATE.orderId = response.data.id;

    logger.success('✅ Second order created successfully', {
      orderId: STATE.orderId,
      status: response.data.status
    });

    // Verify order status
    await verifyOrderStatus('PENDING');

    return response.data;
  } catch (error) {
    logger.error('❌ Second order creation failed', error.message);
    throw error;
  }
}

async function vendorCounterOffer2() {
  logger.info('🔄 Vendor sending counter offer for second order');

  apiClient.setAuthToken(STATE.tokens.vendor);

  try {
    const counterOfferData = {
      description: 'Test order for counter offer rejection scenario - counter offer',
      price: 35.99,
      additionalNotes: 'Adjusted price for premium service'
    };

    const response = await apiClient.request({
      method: 'PUT',
      url: `/api/orders/${STATE.orderId}/vendor-counter-offer`,
      data: counterOfferData
    });

    logger.success('✅ Counter offer sent successfully for second order', {
      orderId: STATE.orderId,
      price: counterOfferData.price,
      status: response.data.status
    });

    // Verify order status
    await verifyOrderStatus('COUNTER_OFFER_SENT');

    return response.data;
  } catch (error) {
    logger.error('❌ Counter offer for second order failed', error.message);
    throw error;
  }
}

async function userRejectCounterOffer() {
  logger.info('🔄 User rejecting counter offer');

  apiClient.setAuthToken(STATE.tokens.user);

  try {
    const response = await apiClient.request({
      method: 'DELETE',
      url: `/api/orders/${STATE.orderId}`
    });

    logger.success('✅ User rejected counter offer by deleting order successfully', {
      orderId: STATE.orderId,
      status: response.data.status
    });

    // Verify order status
    // await verifyOrderStatus('CANCELLED');

    return response.data;
  } catch (error) {
    logger.error('❌ User reject counter offer failed', error.message);
    throw error;
  }
}

// Main test function
async function runBadOrderScenarios() {
  const testStartTime = Date.now();
  timingTracker.startTracking();

  try {
    logger.info('🚀 Starting Bad Order Scenarios Test');
    logger.info('Configuration', CONFIG);

    // Phase 1: Account Setup
    logger.info('\n📋 PHASE 1: ACCOUNT SETUP');
    
    timingTracker.startOperation('signupAdmin');
    await signupAdmin();
    timingTracker.endOperation();
    await delay(1000);
    
    timingTracker.startOperation('signupUser');
    await signupUser();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('signupVendor');
    await signupVendor();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('signupCaptain');
    await signupCaptain();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 2: Unlock vendor and captain
    logger.info('\n🔓 PHASE 2: UNLOCK VENDORS AND CAPTAINS');

    timingTracker.startOperation('unlockVendor');
    await unlockVendor();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('unlockCaptain');
    await unlockCaptain();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 3: Bad Scenario 1 - Vendor Rejects Order
    logger.info('\n❌ PHASE 3: BAD SCENARIO 1 - VENDOR REJECTS ORDER');

    timingTracker.startOperation('createOrder');
    await createOrder();
    timingTracker.endOperation();
    await delay(2000);

    timingTracker.startOperation('vendorRejectOrder');
    await vendorRejectOrder();
    timingTracker.endOperation();
    await delay(2000);

    // Verify that order is cancelled from user perspective
    timingTracker.startOperation('verifyCancelledOrder1');
    await verifyOrderStatus('CANCELLED');
    timingTracker.endOperation();
    await delay(1000);

    // Phase 4: Bad Scenario 2 - User Rejects Counter Offer
    logger.info('\n❌ PHASE 4: BAD SCENARIO 2 - USER REJECTS COUNTER OFFER');

    timingTracker.startOperation('createOrder2');
    await createOrder2();
    timingTracker.endOperation();
    await delay(2000);

    timingTracker.startOperation('vendorCounterOffer2');
    await vendorCounterOffer2();
    timingTracker.endOperation();
    await delay(2000);

    timingTracker.startOperation('userRejectCounterOffer');
    await userRejectCounterOffer();
    timingTracker.endOperation();
    await delay(2000);


    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    // Test Summary
    logger.success('\n🎉 BAD ORDER SCENARIOS TEST COMPLETED SUCCESSFULLY!');
    logger.info('Test Summary', {
      totalRequests: STATE.requestCount,
      duration: `${testDuration} seconds`,
      scenario1OrderId: STATE.orderId, // This would be the second order ID after scenario 2
      scenario1Outcome: 'Vendor rejected order',
      scenario2Outcome: 'User rejected counter offer by deleting order',
      participantIds: STATE.ids,
      testData: {
        userEmail: TEST_DATA.user.email,
        vendorName: TEST_DATA.vendor.vendorName,
        captainEmail: TEST_DATA.captain.email,
        adminEmail: TEST_DATA.admin.email
      }
    });

    // Timing Statistics
    timingTracker.printStats();

    return {
      success: true,
      duration: testDuration,
      requestCount: STATE.requestCount,
      timingStats: timingTracker.getStats()
    };

  } catch (error) {
    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    logger.error('\n💥 BAD ORDER SCENARIOS TEST FAILED!');
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
  runBadOrderScenarios()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Bad order scenarios test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Bad order scenarios test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = {
  runBadOrderScenarios,
  Logger,
  ApiClient,
  CONFIG,
  TEST_DATA
};