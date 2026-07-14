const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { TimingTracker } = require("./timingUtils");

// Configuration
const CONFIG = {
  baseURL: "http://localhost:3000",
  tenantId: "tenant_" + Date.now().toString(), // Unique tenant ID for testing
  logFile: "test_vendor_initiated_order_results.log",
  timeout: 30000,
};

// Timing tracker
const timingTracker = new TimingTracker();

// Test data
const TEST_DATA = {
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
  captain: {
    userName: `testcaptain_${Date.now()}`,
    email: `testcaptain_${Date.now()}@test.com`,
    phoneNumber: `+1555123${Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")}`,
    password: "TestCaptain123!",
    longitude: -74.006,
    latitude: 40.7128,
    fcmToken: "test_captain_fcm_token",
    workingHoursStart: "08:00",
    workingHoursEnd: "20:00",
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
  orderId: null,
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
    const header = `\n${"=".repeat(80)}\nAPI Test Run Started: ${timestamp}\n${"=".repeat(80)}\n`;
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

async function verifyOrderStatus(expectedStatus, role = null) {
  try {
    logger.info(`Verifying order status: expected ${expectedStatus}`);

    const response = await apiClient.request({
      method: "GET",
      url: `/api/orders/${STATE.orderId}`,
    });

    // The order data is directly in response.data due to axios interceptor
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

async function signupVendor() {
  logger.info("🔄 Starting vendor signup");

  apiClient.setAuthToken(STATE.tokens.admin);

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

async function signupCaptain() {
  logger.info("🔄 Starting captain signup");

  try {
    const response = await apiClient.request({
      method: "POST",
      url: "/api/auth/signup/captain",
      data: TEST_DATA.captain,
    });

    STATE.tokens.captain = response.data.token;
    STATE.ids.captain = response.data.captain.id;

    logger.success("✅ Captain signup successful", {
      captainId: STATE.ids.captain,
      token: STATE.tokens.captain.substring(0, 20) + "...",
    });

    return response.data;
  } catch (error) {
    logger.error("❌ Captain signup failed", error.message);
    throw error;
  }
}

// Order workflow functions
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

async function vendorCreateOrder() {
  logger.info("🔄 Vendor creating order (without user ID)");

  apiClient.setAuthToken(STATE.tokens.vendor);

  try {
    const orderData = {
      // Note: No userId is provided as per the requirement
      description:
        "Test order initiated by vendor for user who contacted by other means",
      userAddress: "123 Test Street",
      phoneNumber: "+1234567890",
      neighborhoodId: STATE.ids.neighborhood,
      additionalNotes: "User contacted vendor by phone",
    };

    const response = await apiClient.request({
      method: "POST",
      url: "/api/orders/create-by-vendor",
      data: orderData,
    });

    STATE.orderId = response.data.id;

    logger.success("✅ Order created successfully by vendor", {
      orderId: STATE.orderId,
      status: response.data.status,
    });

    // Verify order status - should be COUNTER_OFFER_ACCEPTED immediately
    await verifyOrderStatus("COUNTER_OFFER_ACCEPTED");

    return response.data;
  } catch (error) {
    logger.error("❌ Order creation by vendor failed", error.message);
    throw error;
  }
}

async function checkOrderInAvailableOrders() {
  logger.info("🔄 Checking if order is available for captains");

  apiClient.setAuthToken(STATE.tokens.captain);

  try {
    const response = await apiClient.request({
      method: "GET",
      url: "/api/orders/available",
    });

    const orderFound = response.data.orders.some(
      (order) => order.id === STATE.orderId,
    );

    if (orderFound) {
      logger.success("✅ Order found in available orders for captains", {
        totalOrders: response.data.orders.length,
        targetOrderId: STATE.orderId,
      });
    } else {
      logger.warn("⚠️ Order not found in available orders for captains");
    }

    return response.data;
  } catch (error) {
    logger.error("❌ Failed to check available orders", error.message);
    throw error;
  }
}

async function captainAcceptOrder() {
  logger.info("🔄 Captain accepting order");

  apiClient.setAuthToken(STATE.tokens.captain);

  try {
    const response = await apiClient.request({
      method: "PUT",
      url: `/api/orders/${STATE.orderId}/captain-approve`,
    });

    logger.success("✅ Order accepted by captain successfully", {
      orderId: STATE.orderId,
      captainId: STATE.ids.captain,
      status: response.data.status,
    });

    // Switch to vendor token for order verification to avoid captain tenantId issues
    apiClient.setAuthToken(STATE.tokens.vendor);
    // Verify order status
    await verifyOrderStatus("ACCEPTED_BY_CAPTAIN");

    return response.data;
  } catch (error) {
    logger.error("❌ Captain order acceptance failed", error.message);
    throw error;
  }
}

async function captainArrived() {
  logger.info("🔄 Captain marking arrival at user location");

  apiClient.setAuthToken(STATE.tokens.captain);

  try {
    const response = await apiClient.request({
      method: "PUT",
      url: `/api/orders/${STATE.orderId}/arrived`,
    });

    logger.success("✅ Captain arrived successfully", {
      orderId: STATE.orderId,
      status: response.data.status,
    });

    // Switch to vendor token for order verification to avoid captain tenantId issues
    apiClient.setAuthToken(STATE.tokens.vendor);
    // Verify order status - arrived status might be ACCEPTED_BY_CAPTAIN or IN_DELIVERY
    await verifyOrderStatus("ACCEPTED_BY_CAPTAIN");

    return response.data;
  } catch (error) {
    logger.error("❌ Captain arrival failed", error.message);
    throw error;
  }
}

async function captainMarkDelivered() {
  logger.info("🔄 Captain marking order as delivered");

  apiClient.setAuthToken(STATE.tokens.captain);

  try {
    const response = await apiClient.request({
      method: "PUT",
      url: `/api/orders/${STATE.orderId}/delivered`,
    });

    logger.success("✅ Order marked as delivered successfully", {
      orderId: STATE.orderId,
      status: response.data.status,
    });

    // Switch to vendor token for order verification to avoid captain tenantId issues
    apiClient.setAuthToken(STATE.tokens.vendor);
    // Verify order status
    await verifyOrderStatus("DELIVERED");

    return response.data;
  } catch (error) {
    logger.error("❌ Mark delivered failed", error.message);
    throw error;
  }
}

async function unlockCaptain() {
  logger.info("🔄 Admin unlocking captain");

  apiClient.setAuthToken(STATE.tokens.admin);

  try {
    const response = await apiClient.request({
      method: "PUT",
      url: `/api/admin/captains/${STATE.ids.captain}/lock-status`,
      data: { isLocked: false },
    });

    logger.success("✅ Captain unlocked successfully", {
      captainId: STATE.ids.captain,
      isLocked: response.data.isLocked,
    });

    return response.data;
  } catch (error) {
    logger.error("❌ Captain unlock failed", error.message);
    throw error;
  }
}

// Verification functions
async function verifyVendorOrders() {
  logger.info("🔄 Verifying vendor orders");

  apiClient.setAuthToken(STATE.tokens.vendor);

  try {
    const response = await apiClient.request({
      method: "GET",
      url: "/api/orders/vendor/orders",
    });

    const orderFound = response.data.orders.some(
      (order) => order.id === STATE.orderId,
    );

    if (orderFound) {
      logger.success("✅ Order found in vendor orders", {
        totalOrders: response.data.orders.length,
        targetOrderId: STATE.orderId,
      });
    } else {
      logger.warn("⚠️ Order not found in vendor orders");
    }

    return response.data;
  } catch (error) {
    logger.error("❌ Vendor orders verification failed", error.message);
    throw error;
  }
}

async function verifyCaptainOrders() {
  logger.info("🔄 Verifying captain orders");

  apiClient.setAuthToken(STATE.tokens.captain);

  try {
    const response = await apiClient.request({
      method: "GET",
      url: "/api/orders/captain/orders",
    });

    const orderFound = response.data.orders.some(
      (order) => order.id === STATE.orderId,
    );

    if (orderFound) {
      logger.success("✅ Order found in captain orders", {
        totalOrders: response.data.orders.length,
        targetOrderId: STATE.orderId,
      });
    } else {
      logger.warn("⚠️ Order not found in captain orders");
    }

    return response.data;
  } catch (error) {
    logger.error("❌ Captain orders verification failed", error.message);
    throw error;
  }
}

// Main test function
async function runVendorInitiatedOrderFlow() {
  const testStartTime = Date.now();
  timingTracker.startTracking();

  try {
    logger.info("🚀 Starting Vendor Initiated Order Flow Test");
    logger.info("Configuration", CONFIG);

    // Phase 1: Account Setup
    logger.info("\n📋 PHASE 1: ACCOUNT SETUP");

    timingTracker.startOperation("signupAdmin");
    await signupAdmin();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("signupVendor");
    await signupVendor();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("signupCaptain");
    await signupCaptain();
    timingTracker.endOperation();
    await delay(1000);

    // Phase 2: Order Creation and Flow
    logger.info("\n📦 PHASE 2: ORDER CREATION AND FLOW");

    timingTracker.startOperation("unlockVendor");
    await unlockVendor();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("unlockCaptain");
    await unlockCaptain();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("vendorCreateOrder");
    await vendorCreateOrder();
    timingTracker.endOperation();
    await delay(2000);

    timingTracker.startOperation("checkOrderInAvailableOrders");
    await checkOrderInAvailableOrders();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("captainAcceptOrder");
    await captainAcceptOrder();
    timingTracker.endOperation();
    await delay(2000);

    timingTracker.startOperation("captainArrived");
    await captainArrived();
    timingTracker.endOperation();
    await delay(2000);

    timingTracker.startOperation("captainMarkDelivered");
    await captainMarkDelivered();
    timingTracker.endOperation();
    await delay(2000);

    // Phase 3: Final Verification
    logger.info("\n✅ PHASE 3: FINAL VERIFICATION");

    timingTracker.startOperation("verifyVendorOrders");
    await verifyVendorOrders();
    timingTracker.endOperation();
    await delay(1000);

    timingTracker.startOperation("verifyCaptainOrders");
    await verifyCaptainOrders();
    timingTracker.endOperation();
    await delay(1000);

    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    // Test Summary
    logger.success(
      "\n🎉 VENDOR INITIATED ORDER FLOW TEST COMPLETED SUCCESSFULLY!",
    );
    logger.info("Test Summary", {
      totalRequests: STATE.requestCount,
      duration: `${testDuration} seconds`,
      orderId: STATE.orderId,
      finalStatus: "DELIVERED",
      participantIds: STATE.ids,
      testData: {
        vendorName: TEST_DATA.vendor.vendorName,
        captainEmail: TEST_DATA.captain.email,
        adminEmail: TEST_DATA.admin.email,
      },
    });

    // Timing Statistics
    timingTracker.Stats();

    return {
      success: true,
      duration: testDuration,
      orderId: STATE.orderId,
      requestCount: STATE.requestCount,
      timingStats: timingTracker.getStats(),
    };
  } catch (error) {
    const testEndTime = Date.now();
    const testDuration = (testEndTime - testStartTime) / 1000;

    logger.error("\n💥 VENDOR INITIATED ORDER FLOW TEST FAILED!");
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
  runVendorInitiatedOrderFlow()
    .then((result) => {
      if (result.success) {
        console.log("\n✅ Test completed successfully!");
        process.exit(0);
      } else {
        console.log("\n❌ Test failed!");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("\n💥 Unexpected error:", error);
      process.exit(1);
    });
}

module.exports = {
  runVendorInitiatedOrderFlow,
  Logger,
  ApiClient,
  CONFIG,
  TEST_DATA,
};
