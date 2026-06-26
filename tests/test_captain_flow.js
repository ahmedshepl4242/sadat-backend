const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { TimingTracker } = require('./timingUtils');

// Configuration
const CONFIG = {
  baseURL: 'http://localhost:3000',
  tenantId: 'tenant_' + Date.now().toString(),
  logFile: 'test_captain_results.log',
  timeout: 30000
};

// Timing tracker
const timingTracker = new TimingTracker();

// Test data
const TEST_DATA = {
  admin: {
    userName: `TestAdmin_${Date.now()}`,
    email: `testadmin_${Date.now()}@test.com`,
    phoneNumber: `+1666789${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
    password: 'TestAdmin123!',
    address: '789 Admin Plaza',
    tenantId: CONFIG.tenantId,
    fcmToken: 'test_admin_fcm_token',
    neighborhood_name: 'Test Neighborhood'
  },
  captains: [
    {
      userName: `testcaptain1_${Date.now()}`,
      email: `testcaptain1_${Date.now()}@test.com`,
      phoneNumber: `+1555123${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      password: 'TestCaptain123!',
      longitude: -74.006,
      latitude: 40.7128,
      fcmToken: 'test_captain1_fcm_token',
      workingHoursStart: '08:00',
      workingHoursEnd: '20:00'
    },
    {
      userName: `testcaptain2_${Date.now()}`,
      email: `testcaptain2_${Date.now()}@test.com`,
      phoneNumber: `+1555124${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      password: 'TestCaptain123!',
      longitude: -74.010,
      latitude: 40.7150,
      fcmToken: 'test_captain2_fcm_token',
      workingHoursStart: '09:00',
      workingHoursEnd: '21:00'
    },
    {
      userName: `testcaptain3_${Date.now()}`,
      email: `testcaptain3_${Date.now()}@test.com`,
      phoneNumber: `+1555125${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      password: 'TestCaptain123!',
      longitude: -74.015,
      latitude: 40.7180,
      fcmToken: 'test_captain3_fcm_token',
      workingHoursStart: '10:00',
      workingHoursEnd: '22:00'
    }
  ]
};

// Global state
const STATE = {
  tokens: {},
  ids: {},
  requestCount: 0,
  captainIds: [],
  captainTokens: []
};

// Logging utility
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.initLogFile();
  }

  initLogFile() {
    const timestamp = new Date().toISOString();
    const header = `\n${'='.repeat(80)}\nCaptain Flow Test Run Started: ${timestamp}\n${'='.repeat(80)}\n`;
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
  logger.info('🔄 Starting admin signup (with neighborhood creation)');

  try {
    const response = await apiClient.request({
      method: 'POST',
      url: '/api/admin-signup/signup',
      data: TEST_DATA.admin
    });

    const data = response.data || response;

    if (!data || !data.admin || !data.neighborhood) {
      logger.error('❌ Admin signup failed - unexpected response structure', {
        responseKeys: response ? Object.keys(response) : 'no response',
        dataKeys: data ? Object.keys(data) : 'no data',
        hasAdmin: !!(data && data.admin),
        hasNeighborhood: !!(data && data.neighborhood)
      });
      throw new Error('Admin signup response has unexpected structure');
    }

    STATE.tokens.admin = data.token;
    STATE.ids.admin = data.admin.id;
    STATE.ids.neighborhood = data.neighborhood.id;

    logger.success('✅ Admin signup successful (with neighborhood)', {
      adminId: STATE.ids.admin,
      neighborhoodId: STATE.ids.neighborhood,
      token: STATE.tokens.admin.substring(0, 20) + '...'
    });

    return response;
  } catch (error) {
    logger.error('❌ Admin signup failed', error.message);
    throw error;
  }
}

async function signupCaptains() {
  logger.info('🔄 Starting captain signups');

  try {
    for (let i = 0; i < TEST_DATA.captains.length; i++) {
      const captainData = TEST_DATA.captains[i];

      logger.info(`🔄 Signing up captain ${i + 1}: ${captainData.userName}`);

      const response = await apiClient.request({
        method: 'POST',
        url: '/api/auth/signup/captain',
        data: captainData
      });

      STATE.captainIds.push(response.data.captain.id);
      STATE.captainTokens.push(response.data.token);

      logger.success(`✅ Captain ${i + 1} signup successful`, {
        captainId: response.data.captain.id,
        userName: captainData.userName,
        token: response.data.token.substring(0, 20) + '...'
      });

      await delay(500);
    }

    logger.success('✅ All captains signed up successfully', {
      totalCaptains: STATE.captainIds.length,
      captainIds: STATE.captainIds
    });

    return STATE.captainIds;
  } catch (error) {
    logger.error('❌ Captain signup failed', error.message);
    throw error;
  }
}

// Captain management functions
async function unlockCaptains() {
  logger.info('🔄 Unlocking captains (first 2 out of 3)');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const captainsToUnlock = STATE.captainIds.slice(0, 2);

    for (const captainId of captainsToUnlock) {
      const response = await apiClient.request({
        method: 'PUT',
        url: `/api/admin/captains/${captainId}/lock-status`,
        data: { isLocked: false }
      });

      logger.success(`✅ Captain ${captainId} unlocked successfully`, {
        captainId,
        isLocked: response.data.isLocked
      });

      await delay(500);
    }

    logger.success('✅ Selected captains unlocked successfully', {
      unlockedCaptains: captainsToUnlock,
      remainingLocked: STATE.captainIds.slice(2)
    });

    return captainsToUnlock;
  } catch (error) {
    logger.error('❌ Captain unlock failed', error.message);
    throw error;
  }
}

async function getCachedCaptainData() {
  logger.info('🔄 Getting cached captain data');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: 'GET',
      url: '/api/admin/captains-cached'
    });

    logger.success('✅ Cached captain data retrieved successfully', {
      cachedCaptainsCount: Object.keys(response.data).length,
      cachedData: response.data
    });

    return response.data;
  } catch (error) {
    logger.error('❌ Getting cached captain data failed', error.message);
    throw error;
  }
}

async function updateCaptainLocations() {
  logger.info('🔄 Updating captain locations');

  try {
    const locationUpdates = [
      { captainIndex: 0, longitude: -74.020, latitude: 40.7200 },
      { captainIndex: 1, longitude: -74.025, latitude: 40.7220 }
    ];

    for (const update of locationUpdates) {
      const captainId = STATE.captainIds[update.captainIndex];
      const captainToken = STATE.captainTokens[update.captainIndex];

      apiClient.setAuthToken(captainToken);

      const response = await apiClient.request({
        method: 'PUT',
        url: '/api/captains/location',
        data: {
          longitude: update.longitude,
          latitude: update.latitude
        }
      });

      logger.success(`✅ Captain ${captainId} location updated successfully`, {
        captainId,
        newLongitude: update.longitude,
        newLatitude: update.latitude
      });

      await delay(500);
    }

    logger.success('✅ Captain locations updated successfully');
    return locationUpdates;
  } catch (error) {
    logger.error('❌ Captain location update failed', error.message);
    throw error;
  }
}

async function verifyCaptainLocations() {
  logger.info('🔄 Verifying captain location updates');

  try {
    for (let i = 0; i < 2; i++) {
      const captainToken = STATE.captainTokens[i];
      apiClient.setAuthToken(captainToken);

      const response = await apiClient.request({
        method: 'GET',
        url: '/api/captains/profile'
      });

      logger.success(`✅ Captain ${i + 1} location verified`, {
        captainId: STATE.captainIds[i],
        longitude: response.data.longitude,
        latitude: response.data.latitude
      });

      await delay(500);
    }

    logger.success('✅ All captain locations verified');
  } catch (error) {
    logger.error('❌ Captain location verification failed', error.message);
    throw error;
  }
}

async function activateCaptains() {
  logger.info('🔄 Activating captains (first 2)');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const captainsToActivate = STATE.captainIds.slice(0, 2);

    for (const captainId of captainsToActivate) {
      const response = await apiClient.request({
        method: 'PUT',
        url: `/api/admin/captains/${captainId}/activate`
      });

      logger.success(`✅ Captain ${captainId} activated successfully`, {
        captainId,
        userName: response.data.userName,
        lastActivated: response.data.lastActivated
      });

      await delay(500);
    }

    logger.success('✅ Selected captains activated successfully', {
      activatedCaptains: captainsToActivate
    });

    return captainsToActivate;
  } catch (error) {
    logger.error('❌ Captain activation failed', error.message);
    throw error;
  }
}

async function getAllCaptainsAndValidateActivation() {
  logger.info('🔄 Getting all captains and validating activation');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: 'GET',
      url: '/api/admin/captains'
    });

    const captains = response.data.captains;

    logger.success('✅ All captains retrieved successfully', {
      totalCaptains: captains.length,
      captainsWithActivation: captains.map(captain => ({
        id: captain.id,
        userName: captain.userName,
        lastActivated: captain.lastActivated,
        isLocked: captain.isLocked
      }))
    });

    // Validate activation timestamps
    const activatedCaptains = captains.filter(captain =>
      STATE.captainIds.slice(0, 2).includes(captain.id)
    );

    for (const captain of activatedCaptains) {
      if (captain.lastActivated) {
        logger.success(`✅ Captain ${captain.id} activation validated`, {
          captainId: captain.id,
          lastActivated: captain.lastActivated
        });
      } else {
        logger.warn(`⚠️ Captain ${captain.id} missing lastActivated timestamp`);
      }
    }

    return response.data;
  } catch (error) {
    logger.error('❌ Getting all captains failed', error.message);
    throw error;
  }
}

async function updateCaptainWorkingHours() {
  logger.info('🔄 Updating captain working hours');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const captainId = STATE.captainIds[0];
    const newWorkingHours = {
      workingHoursStart: '07:00',
      workingHoursEnd: '19:00'
    };

    const response = await apiClient.request({
      method: 'PUT',
      url: `/api/admin/captains/${captainId}/working-hours`,
      data: newWorkingHours
    });

    logger.success('✅ Captain working hours updated successfully', {
      captainId,
      workingHoursStart: response.data.workingHoursStart,
      workingHoursEnd: response.data.workingHoursEnd
    });

    return response.data;
  } catch (error) {
    logger.error('❌ Captain working hours update failed', error.message);
    throw error;
  }
}

async function validateWorkingHoursUpdate() {
  logger.info('🔄 Validating working hours update');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: 'GET',
      url: '/api/admin/captains'
    });

    const updatedCaptain = response.data.captains.find(captain =>
      captain.id === STATE.captainIds[0]
    );

    if (updatedCaptain) {
      logger.success('✅ Working hours update validated', {
        captainId: updatedCaptain.id,
        workingHoursStart: updatedCaptain.workingHoursStart,
        workingHoursEnd: updatedCaptain.workingHoursEnd
      });

      if (updatedCaptain.workingHoursStart === '07:00' &&
          updatedCaptain.workingHoursEnd === '19:00') {
        logger.success('✅ Working hours match expected values');
      } else {
        logger.warn('⚠️ Working hours do not match expected values', {
          expected: { start: '07:00', end: '19:00' },
          actual: {
            start: updatedCaptain.workingHoursStart,
            end: updatedCaptain.workingHoursEnd
          }
        });
      }
    } else {
      logger.error('❌ Could not find updated captain');
    }

    return updatedCaptain;
  } catch (error) {
    logger.error('❌ Working hours validation failed', error.message);
    throw error;
  }
}

async function updateCaptainFCMTokens() {
  logger.info('🔄 Updating captain FCM tokens');

  try {
    for (let i = 0; i < 2; i++) {
      const captainToken = STATE.captainTokens[i];
      const newFCMToken = `updated_fcm_token_${Date.now()}_${i}`;

      apiClient.setAuthToken(captainToken);

      const response = await apiClient.request({
        method: 'PUT',
        url: '/api/captains/fcm-token',
        data: { fcmToken: newFCMToken }
      });

      logger.success(`✅ Captain ${i + 1} FCM token updated successfully`, {
        captainId: STATE.captainIds[i],
        newFCMToken: newFCMToken
      });

      await delay(500);
    }

    logger.success('✅ Captain FCM tokens updated successfully');
  } catch (error) {
    logger.error('❌ Captain FCM token update failed', error.message);
    throw error;
  }
}

async function getCaptainProfiles() {
  logger.info('🔄 Getting captain profiles');

  try {
    for (let i = 0; i < 2; i++) {
      const captainToken = STATE.captainTokens[i];

      apiClient.setAuthToken(captainToken);

      const response = await apiClient.request({
        method: 'GET',
        url: '/api/captains/profile'
      });

      logger.success(`✅ Captain ${i + 1} profile retrieved successfully`, {
        captainId: response.data.id,
        userName: response.data.userName,
        email: response.data.email,
        longitude: response.data.longitude,
        latitude: response.data.latitude,
        workingHoursStart: response.data.workingHoursStart,
        workingHoursEnd: response.data.workingHoursEnd,
        isAvailable: response.data.isAvailable
      });

      await delay(500);
    }

    logger.success('✅ All captain profiles retrieved successfully');
  } catch (error) {
    logger.error('❌ Getting captain profiles failed', error.message);
    throw error;
  }
}

async function getCaptainStatistics() {
  logger.info('🔄 Getting captain statistics');

  apiClient.setAuthToken(STATE.captainTokens[1]);

  try {
    const captainId = STATE.captainIds[0];

    const response = await apiClient.request({
      method: 'GET',
      url: `/api/captains/stats`
    });

    logger.success('✅ Captain statistics retrieved successfully', {
      captainId,
      statistics: response.data
    });

    return response.data;
  } catch (error) {
    logger.error('❌ Getting captain statistics failed', error.message);
    throw error;
  }
}

// Main test function
async function runCaptainFlow() {
  const testStartTime = Date.now();
  timingTracker.startTracking();

  try {
    logger.info('🚀 Starting Captain Flow Test');
    logger.info('Configuration', CONFIG);

    // Phase 1: Admin Setup
    logger.info('\n📋 PHASE 1: ADMIN SETUP');

    timingTracker.startOperation('signupAdmin');
    await signupAdmin();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 2: Captain Setup
    logger.info('\n👨‍✈️ PHASE 2: CAPTAIN SETUP');

    timingTracker.startOperation('signupCaptains');
    await signupCaptains();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 3: Captain Management
    logger.info('\n🔧 PHASE 3: CAPTAIN MANAGEMENT');

    timingTracker.startOperation('unlockCaptains');
    await unlockCaptains();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('getCachedCaptainData');
    const cachedData = await getCachedCaptainData();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('updateCaptainLocations');
    await updateCaptainLocations();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('verifyCaptainLocations');
    await verifyCaptainLocations();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('activateCaptains');
    await activateCaptains();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('getAllCaptainsAndValidateActivation');
    await getAllCaptainsAndValidateActivation();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('updateCaptainWorkingHours');
    await updateCaptainWorkingHours();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('validateWorkingHoursUpdate');
    await validateWorkingHoursUpdate();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('updateCaptainFCMTokens');
    await updateCaptainFCMTokens();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 4: Captain Profile and Statistics
    logger.info('\n📊 PHASE 4: CAPTAIN PROFILES AND STATISTICS');

    timingTracker.startOperation('getCaptainProfiles');
    await getCaptainProfiles();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('getCaptainStatistics');
    await getCaptainStatistics();
    timingTracker.endOperation();
    await delay(1000);

    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    // Test Summary
    logger.success('\n🎉 CAPTAIN FLOW TEST COMPLETED SUCCESSFULLY!');
    logger.info('Test Summary', {
      totalRequests: STATE.requestCount,
      duration: `${testDuration} seconds`,
      totalCaptains: STATE.captainIds.length,
      captainIds: STATE.captainIds,
      testData: {
        adminEmail: TEST_DATA.admin.email,
        captainEmails: TEST_DATA.captains.map(c => c.email)
      }
    });

    // Timing Statistics
    timingTracker.printStats();

    return {
      success: true,
      duration: testDuration,
      captainIds: STATE.captainIds,
      requestCount: STATE.requestCount,
      timingStats: timingTracker.getStats()
    };

  } catch (error) {
    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    logger.error('\n💥 CAPTAIN FLOW TEST FAILED!');
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
  runCaptainFlow()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Captain flow test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Captain flow test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = {
  runCaptainFlow,
  Logger,
  ApiClient,
  CONFIG,
  TEST_DATA
};