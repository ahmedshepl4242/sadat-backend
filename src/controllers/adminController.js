const adminService = require('../services/adminService');
const orderService = require('../services/orderService');
const { successResponse, errorResponse, hashPassword } = require('../utils/helpers');
const prisma = require('../utils/prisma');

class AdminController {
  // Admin profile
  async getProfile(req, res) {
    try {
      const result = await adminService.getProfile(req.tenant.id);
      return successResponse(res, result, 'Admin profile retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Update admin profile
  async updateProfile(req, res) {
    try {
      const result = await adminService.updateProfile(req.admin.id, req.body, req.tenant.id);
      return successResponse(res, result, 'Admin profile updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Update FCM token
  async updateFCMToken(req, res) {
    try {
      const { fcmToken } = req.body;
      const result = await adminService.updateFCMToken(req.admin.id, fcmToken, req.tenant.id);
      return successResponse(res, result, 'FCM token updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Lock/Unlock Captain
  async updateCaptainLockStatus(req, res) {
    try {
      const { id } = req.params;
      const { isLocked } = req.body;
      const result = await adminService.updateCaptainLockStatus(id, isLocked, req.tenant.id);
      return successResponse(res, result, `Captain ${isLocked ? 'locked' : 'unlocked'} successfully`);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Lock/Unlock Vendor
  async updateVendorLockStatus(req, res) {
    try {
      const { id } = req.params;
      const { isLocked } = req.body;
      const result = await adminService.updateVendorLockStatus(id, isLocked, req.tenant.id);
      return successResponse(res, result, `Vendor ${isLocked ? 'locked' : 'unlocked'} successfully`);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all captains for admin management
  async getAllCaptains(req, res) {
    try {
      const { isLocked, search } = req.query;
      const result = await adminService.getAllCaptains(req.tenant.id, isLocked === 'true' ? true : isLocked === 'false' ? false : null, search);
      return successResponse(res, result, 'Captains retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all vendors for admin management
  async getAllVendors(req, res) {
    try {
      const { page, limit, isLocked, category } = req.query;
      const tenantId = req.tenant.id;
      const result = await adminService.getAllVendors(tenantId, page, limit, isLocked === 'true' ? true : isLocked === 'false' ? false : null, category);
      return successResponse(res, result, 'Vendors retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Reply to captain request
  async replyToCaptainRequest(req, res) {
    try {
      const { id } = req.params;
      const { status, reply } = req.body;
      const result = await adminService.replyToCaptainRequest(id, status, reply, req.tenant.id);
      return successResponse(res, result, 'Reply sent successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Activate captain profile
  async activateCaptain(req, res) {
    try {
      const { id } = req.params;
      const result = await adminService.activateCaptain(id, req.tenant.id);
      return successResponse(res, result, 'Captain activated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all users for admin management
  async getAllUsers(req, res) {
    try {
      const { page, limit, search } = req.query;
      const result = await adminService.getAllUsers(req.tenant.id, page, limit, search);
      return successResponse(res, result, 'Users retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Update captain working hours (admin only)
  async updateCaptainWorkingHours(req, res) {
    try {
      const { id } = req.params;
      const { workingHoursStart, workingHoursEnd } = req.body;
      const result = await adminService.updateCaptainWorkingHours(id, workingHoursStart, workingHoursEnd, req.tenant.id);
      return successResponse(res, result, 'Captain working hours updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get orders by captain
  async getOrdersByCaptain(req, res) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      const result = await adminService.getOrdersByCaptain(id, req.tenant.id, page, limit);
      return successResponse(res, result, 'Captain orders retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get orders by user
  async getOrdersByUser(req, res) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      const result = await adminService.getOrdersByUser(id, req.tenant.id, page, limit);
      return successResponse(res, result, 'User orders retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get orders by vendor
  async getOrdersByVendor(req, res) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      const result = await adminService.getOrdersByVendor(id, req.tenant.id, page, limit);
      return successResponse(res, result, 'Vendor orders retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get captain statistics
  async getCaptainStatistics(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const result = await adminService.getCaptainStatistics(id,  req.tenant.id, startDate, endDate);
      return successResponse(res, result, 'Captain statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get user statistics
  async getUserStatistics(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const result = await adminService.getUserStatistics(id, startDate, endDate, req.tenant.id);
      return successResponse(res, result, 'User statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get vendor statistics
  async getVendorStatistics(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const result = await adminService.getVendorStatistics(id, startDate, endDate, req.tenant.id);
      return successResponse(res, result, 'Vendor statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all captains statistics overview
  async getAllCaptainsStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const result = await adminService.getAllCaptainsStatistics(req.tenant.id, startDate, endDate);
      return successResponse(res, result, 'Captains statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Bulk set vendor neighborhood pricing
  async bulkSetVendorNeighborhoodPricing(req, res) {
    try {
      const { vendorId } = req.params;
      const { neighborhoodPrices } = req.body;
      const result = await adminService.bulkSetVendorNeighborhoodPricing(vendorId, neighborhoodPrices, req.tenant.id);
      return successResponse(res, result, 'Vendor neighborhood pricing updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Admin counter offer
  async adminCounterOffer(req, res) {
    try {
      const { id } = req.params;
      const result = await adminService.adminCounterOffer(id, req.body, req.tenant.id);
      return successResponse(res, result, 'Admin counter offer submitted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all user complaints
  async getAllUserComplaints(req, res) {
    try {
      const { page, limit, type } = req.query;
      const result = await adminService.getAllUserComplaints(req.tenant.id, page, limit, type);
      return successResponse(res, result, 'User complaints retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Reply to user complaint
  async replyToUserComplaint(req, res) {
    try {
      const { id } = req.params;
      const { reply } = req.body;
      const result = await adminService.replyToUserComplaint(id, reply, req.tenant.id);
      return successResponse(res, result, 'Reply sent to user successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all vendor complaints
  async getAllVendorComplaints(req, res) {
    try {
      const { page, limit, type } = req.query;
      const result = await adminService.getAllVendorComplaints(req.tenant.id, page, limit, type);
      return successResponse(res, result, 'Vendor complaints retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Reply to vendor complaint
  async replyToVendorComplaint(req, res) {
    try {
      const { id } = req.params;
      const { reply } = req.body;
      const result = await adminService.replyToVendorComplaint(id, reply, req.tenant.id);
      return successResponse(res, result, 'Reply sent to vendor successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Search users by username
  async searchUsers(req, res) {
    try {
      const { query, page, limit } = req.query;
      if (!query) {
        return errorResponse(res, 'Search query is required', 400);
      }
      const result = await adminService.searchUsers(query, page, limit, req.tenant.id);
      return successResponse(res, result, 'User search results retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Search captains by username
  async searchCaptains(req, res) {
    try {
      const { query, page, limit } = req.query;
      if (!query) {
        return errorResponse(res, 'Search query is required', 400);
      }
      const result = await adminService.searchCaptains(query, page, limit, req.tenant.id);
      return successResponse(res, result, 'Captain search results retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all orders with filters
  async getAllOrders(req, res) {
    try {
      const orderService = require('../services/orderService');
      const { page, limit, status, startDate, endDate } = req.query;
      const result = await orderService.getAllOrders(
        req.tenant.id,
        page,
        limit,
        status,
        startDate,
        endDate
      );
      return successResponse(res, result, 'Orders retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Change delivery price for special order
  async changeDeliveryPrice(req, res) {
    try {
      const { orderId } = req.params;
      const { deliveryPrice } = req.body;

      if (!deliveryPrice) {
        return errorResponse(res, 'Delivery price is required', 400);
      }

      const result = await orderService.adminChangeDeliveryPrice(
        orderId,
        deliveryPrice,
        req.tenant.id
      );
      return successResponse(res, result, 'Delivery price updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Set captain max limits
  async setCaptainMaxLimits(req, res) {
    try {
      const { id } = req.params;
      const { maxNumberOfOrders, maxEarnings } = req.body;

      if (!maxNumberOfOrders && !maxEarnings) {
        return errorResponse(res, 'At least one limit (maxNumberOfOrders or maxEarnings) is required', 400);
      }

      const result = await adminService.setCaptainMaxLimits(
        id,
        maxNumberOfOrders,
        maxEarnings,
        req.tenant.id
      );
      return successResponse(res, result, 'Captain limits updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
  // Reset vendor password (admin only)
  async resetVendorPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return errorResponse(res, 'Password must be at least 6 characters', 400);
      }

      const vendor = await prisma.vendor.findFirst({
        where: { id: BigInt(id), tenantId: req.tenant.id },
        select: { id: true, tenantId: true },
      });
      if (!vendor) {
        return errorResponse(res, 'Vendor not found', 404);
      }

      const hashed = await hashPassword(newPassword);
      await prisma.vendor.update({
        where: { id_tenantId: { id: vendor.id, tenantId: req.tenant.id } },
        data: { password: hashed },
      });

      return successResponse(res, null, 'Vendor password reset successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Create a special order on behalf of a user (admin only)
  async createOrderForUser(req, res) {
    try {
      const { userId, description, additionalNotes, phoneNumber, neighborhoodId } = req.body;

      if (!userId || !description || !phoneNumber || !neighborhoodId) {
        return errorResponse(res, 'userId, description, phoneNumber, and neighborhoodId are required', 400);
      }

      const user = await prisma.user.findFirst({
        where: { id: BigInt(userId), tenantId: req.tenant.id },
        select: { id: true },
      });
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      const orderData = {
        vendorId: '-1',
        description,
        additionalNotes: additionalNotes || '',
        userAddress: '',
        userLongitude: 0,
        userLatitude: 0,
        phoneNumber,
        neighborhoodId,
      };

      const result = await orderService.createSpecialOrder(userId, orderData, req.tenant.id);
      return successResponse(res, result, 'Order created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async releaseCaptain(req, res) {
    try {
      const result = await orderService.releaseCaptain(req.params.orderId, req.tenant.id);
      return successResponse(res, result, 'Captain released successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async assignCaptain(req, res) {
    try {
      const { captainId } = req.body;
      if (!captainId) return errorResponse(res, 'captainId is required', 400);
      const result = await orderService.assignCaptain(req.params.orderId, captainId, req.tenant.id);
      return successResponse(res, result, 'Captain assigned successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async deleteUser(req, res) {
    try {
      await adminService.deleteUser(req.params.id, req.tenant.id);
      return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async deleteCaptain(req, res) {
    try {
      await adminService.deleteCaptain(req.params.id, req.tenant.id);
      return successResponse(res, null, 'Captain deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async deleteVendor(req, res) {
    try {
      await adminService.deleteVendor(req.params.id, req.tenant.id);
      return successResponse(res, null, 'Vendor deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new AdminController();