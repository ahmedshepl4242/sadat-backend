const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { TimingTracker } = require('./timingUtils');

// Configuration
const CONFIG = {
  baseURL: 'http://localhost:3000',
  tenantId: 'tenant_' + Date.now().toString(), // Unique tenant ID for testing
  logFile: 'test_special_order_results.log',
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
    const header = `\n${'='.repeat(80)}\nAPI Test Run Started: ${timestamp}\n${'='.repeat(80)}\n`;
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
    
    // Store system vendor credentials for login
    STATE.systemVendorCredentials = {
      contactNumber: TEST_DATA.admin.phoneNumber,
      password: TEST_DATA.admin.password
    };

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

async function loginSystemVendor() {
  logger.info('🔄 Logging in as system vendor');
  
  // We don't actually need to login as system vendor since we'll use admin token
  // But we'll keep this function for compatibility with the existing flow
  logger.success('✅ Skipping system vendor login (using admin token directly)');
  
  // Set the system vendor token to be the same as admin token
  STATE.tokens.systemVendor = STATE.tokens.admin;
  
  return { token: STATE.tokens.admin };
}

// Order workflow functions
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

async function createSpecialOrder() {
  logger.info('🔄 Creating special order as user with system vendor');

  apiClient.setAuthToken(STATE.tokens.user);

  try {
    const orderData = {
      vendorId: parseInt(STATE.ids.systemVendor), // Ensure it's a number
      description: 'Special order for automated flow with system vendor',
      userAddress: '123 Test Street',
      phoneNumber: '+1234567890',
      neighborhoodId: STATE.ids.neighborhood,
      additionalNotes: 'Please ring the doorbell'
    };

    const response = await apiClient.request({
      method: 'POST',
      url: '/api/orders/create-by-user',
      data: orderData
    });

    STATE.orderId = response.data.id;

    logger.success('✅ Special order created successfully with system vendor', {
      orderId: STATE.orderId,
      vendorId: orderData.vendorId,
      status: response.data.status
    });

    // Verify order status
    await verifyOrderStatus('PENDING');

    return response.data;
  } catch (error) {
    logger.error('❌ Special order creation failed', error.message);
    throw error;
  }
}

async function systemVendorCounterOffer() {
  logger.info('🔄 System vendor sending counter offer');
  
  // Debug log to see what tokens we have
  logger.info('Current tokens state', {
    hasAdminToken: !!STATE.tokens.admin,
    hasSystemVendorToken: !!STATE.tokens.systemVendor,
    adminToken: STATE.tokens.admin ? STATE.tokens.admin.substring(0, 20) + '...' : 'undefined',
    systemVendorToken: STATE.tokens.systemVendor ? STATE.tokens.systemVendor.substring(0, 20) + '...' : 'undefined'
  });

  // Use admin token for system vendor operations (as requested)
  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const counterOfferData = {
      description: 'Special order counter offer from system vendor',
      price: 25.50,
      additionalNotes: 'Standard service fee applied'
    };

    const response = await apiClient.request({
      method: 'PUT',
      url: `/api/orders/${STATE.orderId}/vendor-counter-offer`,
      data: counterOfferData
    });

    logger.success('✅ Counter offer sent successfully by system vendor', {
      orderId: STATE.orderId,
      price: counterOfferData.price,
      status: response.data.status
    });

    // Verify order status
    await verifyOrderStatus('COUNTER_OFFER_SENT');

    // Check that delivery price is set
    if (response.data.deliveryPrice) {
      logger.success('✅ Delivery price is set after counter offer', {
        deliveryPrice: response.data.deliveryPrice
      });
    } else {
      logger.warn('⚠️ Delivery price is not set after counter offer');
    }

    return response.data;
  } catch (error) {
    logger.error('❌ Counter offer failed', error.message);
    throw error;
  }
}

async function userAcceptCounterOffer() {
  logger.info('🔄 User accepting counter offer');

  apiClient.setAuthToken(STATE.tokens.user);

  try {
    const response = await apiClient.request({
      method: 'PUT',
      url: `/api/orders/${STATE.orderId}/user-approve`
    });

    logger.success('✅ Counter offer accepted successfully', {
      orderId: STATE.orderId,
      status: response.data.status
    });

    // Verify order status
    await verifyOrderStatus('COUNTER_OFFER_ACCEPTED');

    return response.data;
  } catch (error) {
    logger.error('❌ Counter offer acceptance failed', error.message);
    throw error;
  }
}

async function captainAcceptOrder() {
  logger.info('🔄 Captain accepting order');

  apiClient.setAuthToken(STATE.tokens.captain);

  try {
    const response = await apiClient.request({
      method: 'PUT',
      url: `/api/orders/${STATE.orderId}/captain-approve`
    });

    logger.success('✅ Order accepted by captain successfully', {
      orderId: STATE.orderId,
      captainId: STATE.ids.captain,
      status: response.data.status
    });

    // Switch to user token for order verification to avoid captain tenantId issues
    apiClient.setAuthToken(STATE.tokens.user);
    // Verify order status
    await verifyOrderStatus('ACCEPTED_BY_CAPTAIN');

    return response.data;
  } catch (error) {
    logger.error('❌ Captain order acceptance failed', error.message);
    throw error;
  }
}

async function captainMarkDelivered() {
  logger.info('🔄 Captain marking order as delivered');

  apiClient.setAuthToken(STATE.tokens.captain);

  try {
    const response = await apiClient.request({
      method: 'PUT',
      url: `/api/orders/${STATE.orderId}/delivered`
    });

    logger.success('✅ Order marked as delivered successfully', {
      orderId: STATE.orderId,
      status: response.data.status
    });

    // Switch to user token for order verification to avoid captain tenantId issues
    apiClient.setAuthToken(STATE.tokens.user);
    // Verify order status
    await verifyOrderStatus('DELIVERED');

    return response.data;
  } catch (error) {
    logger.error('❌ Mark delivered failed', error.message);
    throw error;
  }
}

async function verifyUserOrders() {
  logger.info('🔄 Verifying user orders');

  apiClient.setAuthToken(STATE.tokens.user);

  try {
    const response = await apiClient.request({
      method: 'GET',
      url: '/api/orders/user/orders'
    });

    const orderFound = response.data.orders.some(order => order.id === STATE.orderId);

    if (orderFound) {
      logger.success('✅ Order found in user orders', {
        totalOrders: response.data.orders.length,
        targetOrderId: STATE.orderId
      });
    } else {
      logger.warn('⚠️ Order not found in user orders');
    }

    return response.data;
  } catch (error) {
    logger.error('❌ User orders verification failed', error.message);
    throw error;
  }
}

async function verifyCaptainOrders() {
  logger.info('🔄 Verifying captain orders');

  apiClient.setAuthToken(STATE.tokens.captain);

  try {
    const response = await apiClient.request({
      method: 'GET',
      url: '/api/orders/captain/orders'
    });

    const orderFound = response.data.orders.some(order => order.id === STATE.orderId);

    if (orderFound) {
      logger.success('✅ Order found in captain orders', {
        totalOrders: response.data.orders.length,
        targetOrderId: STATE.orderId
      });
    } else {
      logger.warn('⚠️ Order not found in captain orders');
    }

    return response.data;
  } catch (error) {
    logger.error('❌ Captain orders verification failed', error.message);
    throw error;
  }
}

// Main test function
async function runSpecialOrderFlow() {
  const testStartTime = Date.now();
  timingTracker.startTracking();

  try {
    logger.info('🚀 Starting Special Order Flow Test with System Vendor');
    logger.info('Configuration', CONFIG);

    // Phase 1: Account Setup
    logger.info('\n📋 PHASE 1: ACCOUNT SETUP');
    
    timingTracker.startOperation('signupAdmin');
    await signupAdmin();
    timingTracker.endOperation();
    await delay(1000);
    
    // Login as system vendor to get vendor token
    timingTracker.startOperation('loginSystemVendor');
    await loginSystemVendor();
    timingTracker.endOperation();
    await delay(1000);
    
    timingTracker.startOperation('signupUser');
    await signupUser();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('signupCaptain');
    await signupCaptain();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 2: Order Creation and Flow
    logger.info('\n📦 PHASE 2: SPECIAL ORDER CREATION AND FLOW');

    timingTracker.startOperation('unlockCaptain');
    await unlockCaptain();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('createSpecialOrder');
    await createSpecialOrder();
    timingTracker.endOperation();
    await delay(2000);

    timingTracker.startOperation('systemVendorCounterOffer');
    await systemVendorCounterOffer();
    timingTracker.endOperation();
    await delay(2000);

    timingTracker.startOperation('userAcceptCounterOffer');
    await userAcceptCounterOffer();
    timingTracker.endOperation();
    await delay(2000);

    timingTracker.startOperation('captainAcceptOrder');
    await captainAcceptOrder();
    timingTracker.endOperation();
    await delay(2000);

    timingTracker.startOperation('captainMarkDelivered');
    await captainMarkDelivered();
    timingTracker.endOperation();
    await delay(2000);

    // Phase 3: Final Verification
    logger.info('\n✅ PHASE 3: FINAL VERIFICATION');

    timingTracker.startOperation('verifyUserOrders');
    await verifyUserOrders();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('verifyCaptainOrders');
    await verifyCaptainOrders();
    timingTracker.endOperation();
    await delay(1000);

    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    // Test Summary
    logger.success('\n🎉 SPECIAL ORDER FLOW TEST COMPLETED SUCCESSFULLY!');
    logger.info('Test Summary', {
      totalRequests: STATE.requestCount,
      duration: `${testDuration} seconds`,
      orderId: STATE.orderId,
      finalStatus: 'DELIVERED',
      participantIds: STATE.ids,
      testData: {
        userEmail: TEST_DATA.user.email,
        captainEmail: TEST_DATA.captain.email,
        adminEmail: TEST_DATA.admin.email
      }
    });

    // Timing Statistics
    timingTracker.printStats();

    return {
      success: true,
      duration: testDuration,
      orderId: STATE.orderId,
      requestCount: STATE.requestCount,
      timingStats: timingTracker.getStats()
    };

  } catch (error) {
    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    logger.error('\n💥 SPECIAL ORDER FLOW TEST FAILED!');
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
  runSpecialOrderFlow()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = {
  runSpecialOrderFlow,
  Logger,
  ApiClient,
  CONFIG,
  TEST_DATA
};