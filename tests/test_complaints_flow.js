const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { TimingTracker } = require('./timingUtils');

// Configuration
const CONFIG = {
  baseURL: 'http://localhost:3000',
  tenantId: 'tenant_' + Date.now().toString(),
  logFile: 'test_complaints_results.log',
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
  users: [
    {
      userName: `testuser1_${Date.now()}`,
      email: `testuser1_${Date.now()}@test.com`,
      phoneNumber: `+1234567${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      password: 'TestUser123!',
      address: '123 Test Street 1',
      neighborhoodId: null,
      fcmToken: 'test_user1_fcm_token'
    },
    {
      userName: `testuser2_${Date.now()}`,
      email: `testuser2_${Date.now()}@test.com`,
      phoneNumber: `+1234568${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      password: 'TestUser123!',
      address: '456 Test Street 2',
      neighborhoodId: null,
      fcmToken: 'test_user2_fcm_token'
    },
    {
      userName: `testuser3_${Date.now()}`,
      email: `testuser3_${Date.now()}@test.com`,
      phoneNumber: `+1234569${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      password: 'TestUser123!',
      address: '789 Test Street 3',
      neighborhoodId: null,
      fcmToken: 'test_user3_fcm_token'
    }
  ],
  complaints: [
    {
      userIndex: 0,
      description: 'Service was very slow and the delivery took too long. The food arrived cold.',
      type: 'VENDOR'
    },
    {
      userIndex: 0,
      description: 'Captain was rude and unprofessional during delivery.',
      type: 'CAPTAIN'
    },
    {
      userIndex: 1,
      description: 'Wrong order was delivered and customer service was unhelpful.',
      type: 'USER'
    },
    {
      userIndex: 1,
      description: 'App crashed multiple times during order placement.',
      type: 'USER'
    },
    {
      userIndex: 2,
      description: 'Vendor refused to prepare the order without proper explanation.',
      type: 'VENDOR'
    }
  ]
};

// Global state
const STATE = {
  tokens: {},
  ids: {},
  requestCount: 0,
  userIds: [],
  userTokens: [],
  complaintIds: []
};

// Logging utility
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.initLogFile();
  }

  initLogFile() {
    const timestamp = new Date().toISOString();
    const header = `\n${'='.repeat(80)}\nComplaints Flow Test Run Started: ${timestamp}\n${'='.repeat(80)}\n`;
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

    // Update neighborhood ID in user data
    TEST_DATA.users.forEach(user => {
      user.neighborhoodId = STATE.ids.neighborhood;
    });

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

async function signupUsers() {
  logger.info('🔄 Starting user signups');

  try {
    for (let i = 0; i < TEST_DATA.users.length; i++) {
      const userData = TEST_DATA.users[i];

      logger.info(`🔄 Signing up user ${i + 1}: ${userData.userName}`);

      const response = await apiClient.request({
        method: 'POST',
        url: '/api/auth/signup/user',
        data: userData
      });

      STATE.userIds.push(response.data.user.id);
      STATE.userTokens.push(response.data.token);

      logger.success(`✅ User ${i + 1} signup successful`, {
        userId: response.data.user.id,
        userName: userData.userName,
        token: response.data.token.substring(0, 20) + '...'
      });

      await delay(500);
    }

    logger.success('✅ All users signed up successfully', {
      totalUsers: STATE.userIds.length,
      userIds: STATE.userIds
    });

    return STATE.userIds;
  } catch (error) {
    logger.error('❌ User signup failed', error.message);
    throw error;
  }
}

// Complaint functions
async function submitComplaints() {
  logger.info('🔄 Submitting complaints from users');

  try {
    for (let i = 0; i < TEST_DATA.complaints.length; i++) {
      const complaintData = TEST_DATA.complaints[i];
      const userToken = STATE.userTokens[complaintData.userIndex];

      apiClient.setAuthToken(userToken);

      logger.info(`🔄 Submitting complaint ${i + 1} from user ${complaintData.userIndex + 1}`);

      const response = await apiClient.request({
        method: 'POST',
        url: '/api/complains',
        data: {
          description: complaintData.description,
          type: complaintData.type
        }
      });

      STATE.complaintIds.push(response.data.id);

      logger.success(`✅ Complaint ${i + 1} submitted successfully`, {
        complaintId: response.data.id,
        type: complaintData.type,
        userIndex: complaintData.userIndex + 1,
        description: complaintData.description.substring(0, 50) + '...'
      });

      await delay(500);
    }

    logger.success('✅ All complaints submitted successfully', {
      totalComplaints: STATE.complaintIds.length,
      complaintIds: STATE.complaintIds
    });

    return STATE.complaintIds;
  } catch (error) {
    logger.error('❌ Complaint submission failed', error.message);
    throw error;
  }
}

async function getUserComplaints() {
  logger.info('🔄 Getting complaints for each user');

  try {
    const userComplaints = {};

    for (let i = 0; i < STATE.userTokens.length; i++) {
      const userToken = STATE.userTokens[i];
      const userId = STATE.userIds[i];

      apiClient.setAuthToken(userToken);

      logger.info(`🔄 Getting complaints for user ${i + 1}`);

      const response = await apiClient.request({
        method: 'GET',
        url: '/api/complains?page=1&limit=10'
      });

      userComplaints[userId] = response.data.complains;

      logger.success(`✅ User ${i + 1} complaints retrieved`, {
        userId,
        complaintsCount: response.data.complains.length,
        pagination: response.data.pagination
      });

      await delay(500);
    }

    // Validate complaint counts
    const totalUserComplaints = Object.values(userComplaints).reduce((sum, complaints) => sum + complaints.length, 0);
    totalComplaintsSubmitted = STATE.complaintIds.length
    logger.info('📊 User complaints summary', {
      totalComplaintsSubmitted: STATE.complaintIds.length,
      totalComplaintsRetrieved: totalUserComplaints,
      complaintsMatch: totalComplaintsSubmitted === totalUserComplaints,
      userComplaintBreakdown: Object.keys(userComplaints).map(userId => ({
        userId,
        count: userComplaints[userId].length
      }))
    });

    return userComplaints;
  } catch (error) {
    logger.error('❌ Getting user complaints failed', error.message);
    throw error;
  }
}

async function getAdminComplaints() {
  logger.info('🔄 Getting all complaints via admin endpoint');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: 'GET',
      url: '/api/admin/complaints?page=1&limit=20'
    });

    const adminComplaints = response.data.complaints;

    logger.success('✅ Admin complaints retrieved successfully', {
      totalComplaintsFromAdmin: adminComplaints.length,
      totalComplaintsSubmitted: STATE.complaintIds.length,
      complaintsMatch: adminComplaints.length === STATE.complaintIds.length,
      pagination: response.data.pagination
    });

    // Validate all submitted complaints are visible to admin
    const adminComplaintIds = adminComplaints.map(c => c.id);
    const missingComplaints = STATE.complaintIds.filter(id => !adminComplaintIds.includes(id));

    if (missingComplaints.length === 0) {
      logger.success('✅ All submitted complaints are visible to admin');
    } else {
      logger.warn('⚠️ Some complaints are missing from admin view', {
        missingComplaintIds: missingComplaints
      });
    }

    return response.data;
  } catch (error) {
    logger.error('❌ Getting admin complaints failed', error.message);
    throw error;
  }
}

async function replyToComplaints() {
  logger.info('🔄 Admin replying to complaints');

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const replies = [
      'Thank you for your feedback. We are investigating this issue and will take appropriate action.',
      'We apologize for the inconvenience. Our team will address this matter with the relevant parties.',
      'Your complaint has been noted. We are working to improve our service quality.',
      'We take your concerns seriously and will implement measures to prevent this in the future.',
      'Thank you for bringing this to our attention. We will ensure better service moving forward.'
    ];

    for (let i = 0; i < STATE.complaintIds.length; i++) {
      const complaintId = STATE.complaintIds[i];
      const reply = replies[i % replies.length];

      logger.info(`🔄 Replying to complaint ${i + 1} (ID: ${complaintId})`);

      const response = await apiClient.request({
        method: 'PUT',
        url: `/api/admin/complaints/${complaintId}/reply`,
        data: { reply }
      });

      logger.success(`✅ Reply sent to complaint ${i + 1}`, {
        complaintId,
        reply: reply.substring(0, 50) + '...',
        repliedAt: response.data.repliedAt
      });

      await delay(500);
    }

    logger.success('✅ All complaints replied to successfully', {
      totalReplies: STATE.complaintIds.length
    });

    return true;
  } catch (error) {
    logger.error('❌ Replying to complaints failed', error.message);
    throw error;
  }
}

async function verifyComplaintReplies() {
  logger.info('🔄 Verifying complaint replies for each user');

  try {
    let totalRepliedComplaints = 0;
    let totalUnrepliedComplaints = 0;

    for (let i = 0; i < STATE.userTokens.length; i++) {
      const userToken = STATE.userTokens[i];
      const userId = STATE.userIds[i];

      apiClient.setAuthToken(userToken);

      logger.info(`🔄 Checking complaint replies for user ${i + 1}`);

      const response = await apiClient.request({
        method: 'GET',
        url: '/api/complains?page=1&limit=10'
      });

      const userComplaints = response.data.complains;
      const repliedComplaints = userComplaints.filter(c => c.reply !== null);
      const unrepliedComplaints = userComplaints.filter(c => c.reply === null);

      totalRepliedComplaints += repliedComplaints.length;
      totalUnrepliedComplaints += unrepliedComplaints.length;

      logger.success(`✅ User ${i + 1} complaint replies verified`, {
        userId,
        totalComplaints: userComplaints.length,
        repliedComplaints: repliedComplaints.length,
        unrepliedComplaints: unrepliedComplaints.length,
        replies: repliedComplaints.map(c => ({
          id: c.id,
          reply: c.reply?.substring(0, 50) + '...',
          repliedAt: c.repliedAt
        }))
      });

      await delay(500);
    }

    // Final verification
    const allComplaintsReplied = totalUnrepliedComplaints === 0;

    logger.success('✅ Complaint replies verification completed', {
      totalComplaintsSubmitted: STATE.complaintIds.length,
      totalRepliedComplaints,
      totalUnrepliedComplaints,
      allComplaintsReplied,
      replySuccessRate: `${((totalRepliedComplaints / STATE.complaintIds.length) * 100).toFixed(1)}%`
    });

    return {
      totalRepliedComplaints,
      totalUnrepliedComplaints,
      allComplaintsReplied
    };
  } catch (error) {
    logger.error('❌ Verifying complaint replies failed', error.message);
    throw error;
  }
}

// Main test function
async function runComplaintsFlow() {
  const testStartTime = Date.now();
  timingTracker.startTracking();

  try {
    logger.info('🚀 Starting Complaints Flow Test');
    logger.info('Configuration', CONFIG);

    // Phase 1: Setup
    logger.info('\n📋 PHASE 1: SETUP');

    timingTracker.startOperation('signupAdmin');
    await signupAdmin();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('signupUsers');
    await signupUsers();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 2: Complaint Submission
    logger.info('\n📝 PHASE 2: COMPLAINT SUBMISSION');

    timingTracker.startOperation('submitComplaints');
    await submitComplaints();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 3: Complaint Retrieval
    logger.info('\n📊 PHASE 3: COMPLAINT RETRIEVAL');

    timingTracker.startOperation('getUserComplaints');
    await getUserComplaints();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation('getAdminComplaints');
    await getAdminComplaints();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 4: Admin Response
    logger.info('\n💬 PHASE 4: ADMIN RESPONSE');

    timingTracker.startOperation('replyToComplaints');
    await replyToComplaints();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 5: Verification
    logger.info('\n✅ PHASE 5: VERIFICATION');

    timingTracker.startOperation('verifyComplaintReplies');
    await verifyComplaintReplies();
    timingTracker.endOperation();
    await delay(1000);

    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    // Test Summary
    logger.success('\n🎉 COMPLAINTS FLOW TEST COMPLETED SUCCESSFULLY!');
    logger.info('Test Summary', {
      totalRequests: STATE.requestCount,
      duration: `${testDuration} seconds`,
      totalUsers: STATE.userIds.length,
      totalComplaints: STATE.complaintIds.length,
      userIds: STATE.userIds,
      complaintIds: STATE.complaintIds,
      testData: {
        adminEmail: TEST_DATA.admin.email,
        userEmails: TEST_DATA.users.map(u => u.email),
        complaintTypes: TEST_DATA.complaints.map(c => c.type)
      }
    });

    // Timing Statistics
    timingTracker.printStats();

    return {
      success: true,
      duration: testDuration,
      userIds: STATE.userIds,
      complaintIds: STATE.complaintIds,
      requestCount: STATE.requestCount,
      timingStats: timingTracker.getStats()
    };

  } catch (error) {
    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    logger.error('\n💥 COMPLAINTS FLOW TEST FAILED!');
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
  runComplaintsFlow()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Complaints flow test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Complaints flow test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = {
  runComplaintsFlow,
  Logger,
  ApiClient,
  CONFIG,
  TEST_DATA
};