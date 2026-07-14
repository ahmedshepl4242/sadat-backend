const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { TimingTracker } = require("./timingUtils");

// Configuration
const CONFIG = {
  baseURL: "http://localhost:3000",
  tenantId: "tenant_" + Date.now().toString(), // Unique tenant ID for testing
  logFile: "test_users_vendors_endpoints_results.log",
  timeout: 30000,
};

// Timing tracker
const timingTracker = new TimingTracker();

// Test data
const TEST_DATA = {
  user: {
    userName: `testuser_${Date.now()}`,
    email: `testuser_${Date.now()}@test.com`,
    phoneNumber: `+1234567${Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")}`,
    password: "TestUser123!",
    address: "123 Test Street",
    neighborhoodId: null, // Will be set after neighborhood creation
    fcmToken: "test_user_fcm_token",
  },
  vendor: {
    vendorName: `TestVendor_${Date.now()}`,
    contactNumber: `+1987654${Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")}`,
    password: "TestVendor123!",
    address: "456 Vendor Avenue",
    description: "Test vendor for automated testing",
    neighborhoodId: null, // Will be set after neighborhood creation
    longitude: -74.006,
    latitude: 40.7128,
    fcmToken: "test_vendor_fcm_token",
  },
  admin: {
    userName: `TestAdmin_${Date.now()}`,
    email: `testadmin_${Date.now()}@test.com`,
    phoneNumber: `+1666789${Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")}`,
    password: "TestAdmin123!",
    address: "789 Admin Plaza",
    tenantId: CONFIG.tenantId,
    fcmToken: "test_admin_fcm_token",
    neighborhood_name: "Test Neighborhood",
  },
};

// Global state
const STATE = {
  tokens: {},
  ids: {},
  orderIds: [],
  requestCount: 0,
};

// Logging utility
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.initLogFile();
  }

  initLogFile() {
    const timestamp = new Date().toISOString();
    const header = `\n${"=".repeat(80)}\nUsers and Vendors Endpoints Test Run Started: ${timestamp}\n${"=".repeat(80)}\n`;
    fs.writeFileSync(this.logFile, header);
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + "\n");

    if (data) {
      const dataStr = JSON.stringify(data, null, 2);
      console.log(dataStr);
      fs.appendFileSync(this.logFile, dataStr + "\n");
    }

    fs.appendFileSync(this.logFile, "\n");
  }

  info(message, data) {
    this.log("INFO", message, data);
  }
  success(message, data) {
    this.log("SUCCESS", message, data);
  }
  error(message, data) {
    this.log("ERROR", message, data);
  }
  warn(message, data) {
    this.log("WARN", message, data);
  }
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
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        STATE.requestCount++;
        logger.info(
          `Request #${STATE.requestCount}: ${config.method.toUpperCase()} ${config.url}`,
          {
            headers: config.headers,
            data: config.data,
          },
        );
        return config;
      },
      (error) => {
        logger.error("Request interceptor error", error);
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.success(
          `Response #${STATE.requestCount}: ${response.status} ${response.statusText}`,
          {
            data: response.data,
            headers: response.headers,
          },
        );
        return response;
      },
      (error) => {
        const errorData = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        };
        logger.error(
          `Response #${STATE.requestCount}: Request failed`,
          errorData,
        );
        return Promise.reject(error);
      },
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
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.client.defaults.headers.common["Authorization"];
  }
}

const apiClient = new ApiClient(CONFIG.baseURL, CONFIG.tenantId);

// Utility functions
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyOrderStatus(orderId, expectedStatus) {
  try {
    logger.info(
      `Verifying order status for order ${orderId}: expected ${expectedStatus}`,
    );

    const response = await apiClient.request({
      method: "GET",
      url: `/api/orders/${orderId}`,
    });

    const currentStatus = response.data.status;

    if (currentStatus === expectedStatus) {
      logger.success(`✅ Order status verified: ${currentStatus}`);
      return response.data;
    } else {
      logger.warn(
        `⚠️ Order status mismatch: expected ${expectedStatus}, got ${currentStatus}`,
      );
      return response.data;
    }
  } catch (error) {
    logger.error("Failed to verify order status", error.message);
    throw error;
  }
}

// Authentication functions
async function signupUser() {
  logger.info("🔄 Starting user signup");

  try {
    // Update neighborhood ID
    const userData = {
      ...TEST_DATA.user,
      neighborhoodId: STATE.ids.neighborhood,
    };

    const response = await apiClient.request({
      method: "POST",
      url: "/api/auth/signup/user",
      data: userData,
    });

    STATE.tokens.user = response.data.token;
    STATE.ids.user = response.data.user.id;

    logger.success("✅ User signup successful", {
      userId: STATE.ids.user,
      token: STATE.tokens.user.substring(0, 20) + "...",
    });

    return response.data;
  } catch (error) {
    logger.error("❌ User signup failed", error.message);
    throw error;
  }
}

async function signupVendor() {
  logger.info("🔄 Starting vendor signup");

  try {
    // Update neighborhood ID
    const vendorData = {
      ...TEST_DATA.vendor,
      neighborhoodId: STATE.ids.neighborhood,
    };

    const response = await apiClient.request({
      method: "POST",
      url: "/api/auth/signup/vendor",
      data: vendorData,
    });

    STATE.tokens.vendor = response.data.token;
    STATE.ids.vendor = response.data.vendor.id;

    logger.success("✅ Vendor signup successful", {
      vendorId: STATE.ids.vendor,
      token: STATE.tokens.vendor.substring(0, 20) + "...",
    });

    // Set pricing for this vendor in the created neighborhood
    await setTestVendorPricing();

    return response.data;
  } catch (error) {
    logger.error("❌ Vendor signup failed", error.message);
    throw error;
  }
}

async function signupAdmin() {
  logger.info(
    "🔄 Starting admin signup (with neighborhood and system vendor creation)",
  );

  try {
    const response = await apiClient.request({
      method: "POST",
      url: "/api/admin-signup/signup",
      data: TEST_DATA.admin,
    });

    // The response structure from our API is { success: true, data: {...}, message: '...' }
    // The actual data is in response.data
    const data = response.data || response;

    // Check if we have the expected data structure in the response
    if (!data || !data.admin || !data.neighborhood || !data.systemVendor) {
      logger.error("❌ Admin signup failed - unexpected response structure", {
        responseKeys: response ? Object.keys(response) : "no response",
        dataKeys: data ? Object.keys(data) : "no data",
        hasAdmin: !!(data && data.admin),
        hasNeighborhood: !!(data && data.neighborhood),
        hasSystemVendor: !!(data && data.systemVendor),
      });
      throw new Error("Admin signup response has unexpected structure");
    }

    STATE.tokens.admin = data.token;
    STATE.ids.admin = data.admin.id;

    // Extract neighborhood and system vendor from the 3-in-1 response
    STATE.ids.neighborhood = data.neighborhood.id;
    STATE.ids.systemVendor = data.systemVendor.id;
    STATE.tokens.systemVendor = data.systemVendor.token;

    logger.success(
      "✅ Admin signup successful (with neighborhood and system vendor)",
      {
        adminId: STATE.ids.admin,
        neighborhoodId: STATE.ids.neighborhood,
        systemVendorId: STATE.ids.systemVendor,
        token: STATE.tokens.admin.substring(0, 20) + "...",
      },
    );

    // Verify all three entities were created correctly
    logger.info("🔍 Verifying 3-in-1 creation", {
      tenant: {
        id: data.admin.id,
        name: data.admin.tenantName,
        email: data.admin.email,
      },
      neighborhood: {
        id: data.neighborhood.id,
        name: data.neighborhood.name,
        tenantId: data.neighborhood.tenantId,
      },
      systemVendor: {
        id: data.systemVendor.id,
        name: data.systemVendor.vendorName,
        tenantId: data.systemVendor.tenantId,
      },
    });

    return response;
  } catch (error) {
    logger.error("❌ Admin signup failed", error.message);
    throw error;
  }
}

async function setTestVendorPricing() {
  logger.info("🔄 Setting test vendor pricing for neighborhood");

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: "POST",
      url: "/api/vendor-pricing",
      data: {
        vendorId: STATE.ids.vendor,
        neighborhoodId: STATE.ids.neighborhood,
        price: 15.0,
      },
    });

    logger.success("✅ Test vendor pricing set successfully", {
      vendorId: STATE.ids.vendor,
      neighborhoodId: STATE.ids.neighborhood,
      price: 15.0,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ Test vendor pricing setup failed", error.message);
    throw error;
  }
}

// Admin unlock functions
async function unlockVendor() {
  logger.info("🔄 Unlocking vendor as admin");

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: "PUT",
      url: `/api/admin/vendors/${STATE.ids.vendor}/lock-status`,
      data: {
        isLocked: false,
      },
    });

    logger.success("✅ Vendor unlocked successfully", {
      vendorId: STATE.ids.vendor,
      isLocked: false,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ Vendor unlock failed", error.message);
    throw error;
  }
}

// User endpoint functions
async function getUserProfile() {
  logger.info("🔄 Getting user profile");

  apiClient.setAuthToken(STATE.tokens.user);

  try {
    const response = await apiClient.request({
      method: "GET",
      url: "/api/users/profile",
    });

    logger.success("✅ User profile retrieved successfully", {
      userId: response.data.id,
      userName: response.data.userName,
      email: response.data.email,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ User profile retrieval failed", error.message);
    throw error;
  }
}

async function updateUserFcmToken() {
  logger.info("🔄 Updating user FCM token");

  apiClient.setAuthToken(STATE.tokens.user);

  try {
    const fcmTokenData = {
      fcmToken: "new_test_user_fcm_token_" + Date.now(),
    };

    const response = await apiClient.request({
      method: "PUT",
      url: "/api/users/fcm-token",
      data: fcmTokenData,
    });

    logger.success("✅ User FCM token updated successfully", {
      userId: response.data.id,
      fcmToken: response.data.fcmToken,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ User FCM token update failed", error.message);
    throw error;
  }
}

async function getUserOrders() {
  logger.info("🔄 Getting user orders");

  apiClient.setAuthToken(STATE.tokens.user);

  try {
    const response = await apiClient.request({
      method: "GET",
      url: "/api/orders/user/orders",
    });

    logger.success("✅ User orders retrieved successfully", {
      totalOrders: response.data.orders.length,
      pagination: response.data.pagination,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ User orders retrieval failed", error.message);
    throw error;
  }
}

// Admin search functions
async function adminSearchUser() {
  logger.info("🔄 Admin searching for user");

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: "GET",
      url: `/api/admin/users/search?query=${TEST_DATA.user.userName}`,
    });

    const userFound = response.data.users.some(
      (user) => user.id === STATE.ids.user,
    );

    if (userFound) {
      logger.success("✅ User found in admin search", {
        totalUsers: response.data.users.length,
        targetUserId: STATE.ids.user,
        pagination: response.data.pagination,
      });
    } else {
      logger.warn("⚠️ User not found in admin search");
    }

    return response.data;
  } catch (error) {
    logger.error("❌ Admin user search failed", error.message);
    throw error;
  }
}

// Vendor endpoint functions
async function getVendorProfile() {
  logger.info("🔄 Getting vendor profile");

  apiClient.setAuthToken(STATE.tokens.vendor);

  try {
    const response = await apiClient.request({
      method: "GET",
      url: "/api/vendors/profile",
    });

    logger.success("✅ Vendor profile retrieved successfully", {
      vendorId: response.data.id,
      vendorName: response.data.vendorName,
      contactNumber: response.data.contactNumber,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ Vendor profile retrieval failed", error.message);
    throw error;
  }
}

async function updateVendorFcmToken() {
  logger.info("🔄 Updating vendor FCM token");

  apiClient.setAuthToken(STATE.tokens.vendor);

  try {
    const fcmTokenData = {
      fcmToken: "new_test_vendor_fcm_token_" + Date.now(),
    };

    const response = await apiClient.request({
      method: "PUT",
      url: "/api/vendors/fcm-token",
      data: fcmTokenData,
    });

    logger.success("✅ Vendor FCM token updated successfully", {
      vendorId: response.data.id,
      fcmToken: response.data.fcmToken,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ Vendor FCM token update failed", error.message);
    throw error;
  }
}

async function updateVendorStatus(isOpen = false) {
  logger.info("🔄 Updating vendor status to closed");

  apiClient.setAuthToken(STATE.tokens.vendor);

  try {
    const statusData = {
      isOpen: isOpen,
    };

    const response = await apiClient.request({
      method: "PUT",
      url: "/api/vendors/status",
      data: statusData,
    });

    logger.success("✅ Vendor status updated successfully", {
      vendorId: response.data.id,
      isOpen: response.data.isOpen,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ Vendor status update failed", error.message);
    throw error;
  }
}

async function getVendorOrders() {
  logger.info("🔄 Getting vendor orders");

  apiClient.setAuthToken(STATE.tokens.vendor);

  try {
    const response = await apiClient.request({
      method: "GET",
      url: "/api/orders/vendor/orders",
    });

    logger.success("✅ Vendor orders retrieved successfully", {
      totalOrders: response.data.orders.length,
      pagination: response.data.pagination,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ Vendor orders retrieval failed", error.message);
    throw error;
  }
}

// Vendor search function
async function vendorSearchByAdmin() {
  logger.info("🔄 Admin searching for vendor");

  // apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: "GET",
      url: `/api/vendors/search?query=${TEST_DATA.vendor.vendorName}`,
    });

    const vendorFound = response.data.vendors.some(
      (vendor) => vendor.id === STATE.ids.vendor,
    );

    if (vendorFound) {
      logger.success("✅ Vendor found in admin search", {
        totalVendors: response.data.vendors.length,
        targetVendorId: STATE.ids.vendor,
        pagination: response.data.pagination,
      });
    } else {
      logger.warn("⚠️ Vendor not found in admin search");
    }

    return response.data;
  } catch (error) {
    logger.error("❌ Admin vendor search failed", error.message);
    throw error;
  }
}

// Order creation functions
async function createOrderAsUser() {
  logger.info("🔄 Creating order as user");

  apiClient.setAuthToken(STATE.tokens.user);

  try {
    const orderData = {
      vendorId: STATE.ids.vendor,
      description: "Test order created by user for endpoints testing",
      userAddress: "123 Test Street",
      phoneNumber: "+1234567890",
      neighborhoodId: STATE.ids.neighborhood,
      additionalNotes: "Order for testing user and vendor endpoints",
    };

    const response = await apiClient.request({
      method: "POST",
      url: "/api/orders/create-by-user",
      data: orderData,
    });

    STATE.orderIds.push(response.data.id);

    logger.success("✅ Order created by user successfully", {
      orderId: response.data.id,
      status: response.data.status,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ Order creation by user failed", error.message);
    throw error;
  }
}

async function createOrderAsVendor() {
  logger.info("🔄 Creating order as vendor");

  apiClient.setAuthToken(STATE.tokens.vendor);

  try {
    const orderData = {
      description: "Test order created by vendor for endpoints testing",
      userAddress: "456 Vendor Street",
      phoneNumber: "+1234567891",
      neighborhoodId: STATE.ids.neighborhood,
      additionalNotes: "Order created by vendor for testing purposes",
    };

    const response = await apiClient.request({
      method: "POST",
      url: "/api/orders/create-by-vendor",
      data: orderData,
    });

    STATE.orderIds.push(response.data.id);

    logger.success("✅ Order created by vendor successfully", {
      orderId: response.data.id,
      status: response.data.status,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ Order creation by vendor failed", error.message);
    throw error;
  }
}

// Main test function
async function runUsersVendorsEndpoints() {
  const testStartTime = Date.now();
  timingTracker.startTracking();

  try {
    logger.info("🚀 Starting Users and Vendors Endpoints Test");
    logger.info("Configuration", CONFIG);

    // Phase 1: Account Setup
    logger.info("\n📋 PHASE 1: ACCOUNT SETUP");

    timingTracker.startOperation("signupAdmin");
    await signupAdmin();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("signupUser");
    await signupUser();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("signupVendor");
    await signupVendor();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 2: Unlock vendor
    logger.info("\n🔓 PHASE 2: UNLOCK VENDOR");

    timingTracker.startOperation("unlockVendor");
    await unlockVendor();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 3: Test user endpoints
    logger.info("\n👤 PHASE 3: USER ENDPOINTS");

    timingTracker.startOperation("getUserProfile");
    await getUserProfile();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("updateUserFcmToken");
    await updateUserFcmToken();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("updateVendorFcmToken");
    await updateVendorFcmToken();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("updateVendorStatus");
    await updateVendorStatus(false);
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("updateVendorStatus");
    await updateVendorStatus(true);
    timingTracker.endOperation();
    await delay(1000);

    // Phase 4: Admin search functionality
    logger.info("\n🔍 PHASE 4: ADMIN SEARCH");

    timingTracker.startOperation("adminSearchUser");
    await adminSearchUser();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("vendorSearchByAdmin");
    await vendorSearchByAdmin();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 5: Order creation and retrieval
    logger.info("\n📦 PHASE 5: ORDER CREATION AND RETRIEVAL");

    timingTracker.startOperation("createOrderAsUser");
    await createOrderAsUser();
    timingTracker.endOperation();
    await delay(2000);

    timingTracker.startOperation("createOrderAsVendor");
    await createOrderAsVendor();
    timingTracker.endOperation();
    await delay(2000);

    // Phase 6: Get user and vendor orders
    logger.info("\n📋 PHASE 6: GET USER AND VENDOR ORDERS");

    timingTracker.startOperation("getUserOrders");
    await getUserOrders();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("getVendorOrders");
    await getVendorOrders();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 7: Verify order statuses
    logger.info("\n✅ PHASE 7: VERIFY ORDER STATUSES");

    for (const orderId of STATE.orderIds) {
      timingTracker.startOperation("verifyOrderStatus");
      await verifyOrderStatus(orderId, "PENDING"); // All new orders should be pending
      timingTracker.endOperation();
      await delay(500);
    }

    // Phase 8: Get vendor profile again to check status
    logger.info("\n🏢 PHASE 8: VERIFY VENDOR PROFILE");

    timingTracker.startOperation("getVendorProfile");
    await getVendorProfile();
    timingTracker.endOperation();
    await delay(1000);

    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    // Test Summary
    logger.success(
      "\n🎉 USERS AND VENDORS ENDPOINTS TEST COMPLETED SUCCESSFULLY!",
    );
    logger.info("Test Summary", {
      totalRequests: STATE.requestCount,
      duration: `${testDuration} seconds`,
      totalOrders: STATE.orderIds.length,
      orderIds: STATE.orderIds,
      participantIds: STATE.ids,
      testData: {
        userEmail: TEST_DATA.user.email,
        vendorName: TEST_DATA.vendor.vendorName,
        adminEmail: TEST_DATA.admin.email,
      },
    });

    // Timing Statistics
    timingTracker.Stats();

    return {
      success: true,
      duration: testDuration,
      orderIds: STATE.orderIds,
      requestCount: STATE.requestCount,
      timingStats: timingTracker.getStats(),
    };
  } catch (error) {
    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    logger.error("\n💥 USERS AND VENDORS ENDPOINTS TEST FAILED!");
    logger.error("Error Details", {
      message: error.message,
      stack: error.stack,
      duration: `${testDuration} seconds`,
      requestCount: STATE.requestCount,
      currentState: STATE,
    });

    // Timing Statistics (partial)
    timingTracker.Stats();

    return {
      success: false,
      error: error.message,
      duration: testDuration,
      requestCount: STATE.requestCount,
      timingStats: timingTracker.getStats(),
    };
  }
}

// Execute if run directly
if (require.main === module) {
  runUsersVendorsEndpoints()
    .then((result) => {
      if (result.success) {
        console.log(
          "\n✅ Users and vendors endpoints test completed successfully!",
        );
        process.exit(0);
      } else {
        console.log("\n❌ Users and vendors endpoints test failed!");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("\n💥 Unexpected error:", error);
      process.exit(1);
    });
}

module.exports = {
  runUsersVendorsEndpoints,
  Logger,
  ApiClient,
  CONFIG,
  TEST_DATA,
};
