const vendorService = require('../services/vendorService');
const { successResponse, errorResponse } = require('../utils/helpers');

class VendorController {
  // Get vendor profile
  async getProfile(req, res) {
    try {
      const result = await vendorService.getProfile(req.vendor.id, req.tenant.id);
      return successResponse(res, result, 'Profile retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Update vendor profile
  async updateProfile(req, res) {
    try {
      const result = await vendorService.updateProfile(req.vendor.id, req.body, req.file, req.tenant.id);
      return successResponse(res, result, 'Profile updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get vendor status
  async getStatus(req, res) {
    try {
      const result = await vendorService.getStatus(req.vendor.id, req.tenant.id);
      return successResponse(res, result, 'Status retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Update vendor status
  async updateStatus(req, res) {
    try {
      const { isOpen } = req.body;
      const result = await vendorService.updateStatus(req.vendor.id, isOpen, req.tenant.id);
      return successResponse(res, result, 'Status updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get vendor orders
  async getVendorOrders(req, res) {
    try {
      const { page, limit, status } = req.query;
      const result = await vendorService.getVendorOrders(req.vendor.id, req.tenant.id, page, limit, status);
      return successResponse(res, result, 'Orders retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get vendor statistics
  async getVendorStats(req, res) {
    try {
      const result = await vendorService.getVendorStats(req.vendor.id, req.tenant.id);
      return successResponse(res, result, 'Statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all vendors (public endpoint)
  async getAllVendors(req, res) {
    try {
      const { page, limit, isOpen, category } = req.query;
      const result = await vendorService.getAllVendors(req.tenant.id, page, limit, isOpen, category);
      return successResponse(res, result, 'Vendors retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Search vendors (public endpoint)
  async searchVendors(req, res) {
    try {
      const { query, page, limit, category } = req.query;
      if (!query) {
        return errorResponse(res, 'Search query is required', 400);
      }
      const result = await vendorService.searchVendors(query, req.tenant.id, page, limit, category);
      return successResponse(res, result, 'Search results retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Update FCM token
  async updateFCMToken(req, res) {
    try {
      const { fcmToken } = req.body;
      const result = await vendorService.updateFCMToken(req.vendor.id, fcmToken, req.tenant.id);
      return successResponse(res, result, 'FCM token updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
  // Delete vendor account
  async deleteAccount(req, res) {
    try {
      const result = await vendorService.deleteAccount(req.vendor.id, req.tenant.id);
      return successResponse(res, result, 'Account deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new VendorController(); 