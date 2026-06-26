const userService = require('../services/userService');
const { successResponse, errorResponse } = require('../utils/helpers');

class UserController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const result = await userService.getProfile(req.user.id, req.tenant.id);
      return successResponse(res, result, 'Profile retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const result = await userService.updateProfile(req.user.id, req.body, req.tenant.id);
      return successResponse(res, result, 'Profile updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // // Get user orders
  // async getUserOrders(req, res) {
  //   try {
  //     const { page, limit, status } = req.query;
  //     const result = await userService.getUserOrders(req.user.id, req.tenant.id, page, limit, status);
  //     return successResponse(res, result, 'Orders retrieved successfully');
  //   } catch (error) {
  //     return errorResponse(res, error.message, 400);
  //   }
  // }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const result = await userService.getUserStats(req.user.id, req.tenant.id);
      return successResponse(res, result, 'Statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Delete user account
  async deleteAccount(req, res) {
    try {
      const result = await userService.deleteAccount(req.user.id, req.tenant.id);
      return successResponse(res, result, 'Account deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Update FCM token
  async updateFCMToken(req, res) {
    try {
      const { fcmToken } = req.body;
      const result = await userService.updateFCMToken(req.user.id, fcmToken, req.tenant.id);
      return successResponse(res, result, 'FCM token updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new UserController(); 