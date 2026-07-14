const captainService = require('../services/captainService');
const { successResponse, errorResponse } = require('../utils/helpers');

class CaptainController {
  // Get captain profile
  async getProfile(req, res) {
    try {
      const result = await captainService.getProfile(req.captain.id, req.tenant.id);
      return successResponse(res, result, 'Profile retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Update captain profile
  async updateProfile(req, res) {
    try {
      const result = await captainService.updateProfile(req.captain.id, req.body, req.tenant.id, req.file);
      return successResponse(res, result, 'Profile updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get captain status
  async getStatus(req, res) {
    try {
      const result = await captainService.getStatus(req.captain.id, req.tenant.id);
      return successResponse(res, result, 'Status retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Update captain status
  async updateStatus(req, res) {
    try {
      const { isAvailable } = req.body;
      const result = await captainService.updateStatus(req.captain.id, isAvailable, req.tenant.id);
      return successResponse(res, result, 'Status updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get captain location
  async getLocation(req, res) {
    try {
      const result = await captainService.getLocation(req.captain.id, req.tenant.id);
      return successResponse(res, result, 'Location retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Update captain location
  async updateLocation(req, res) {
    try {
      const { longitude, latitude } = req.body;
      const result = await captainService.updateLocation(req.captain.id, longitude, latitude, req.tenant.id);
      return successResponse(res, result, 'Location updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get captain orders
  async getCaptainOrders(req, res) {
    try {
      const { page, limit, status } = req.query;
      const result = await captainService.getCaptainOrders(req.captain.id, req.tenant.id, page, limit, status);
      return successResponse(res, result, 'Orders retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get captain statistics
  async getCaptainStats(req, res) {
    try {
      const result = await captainService.getCaptainStats(req.captain.id, req.tenant.id);
      return successResponse(res, result, 'Statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get available captains (public endpoint)
  async getAvailableCaptains(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await captainService.getAvailableCaptains(req.tenant.id, page, limit);
      return successResponse(res, result, 'Available captains retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Search captains by location (public endpoint)
  async searchCaptainsByLocation(req, res) {
    try {
      const { longitude, latitude, radiusKm, page, limit } = req.query;
      if (!longitude || !latitude) {
        return errorResponse(res, 'Longitude and latitude are required', 400);
      }
      const result = await captainService.searchCaptainsByLocation(
        parseFloat(longitude), 
        parseFloat(latitude), 
        radiusKm ? parseFloat(radiusKm) : 10, 
        page, 
        limit,
        req.tenant.id
      );
      return successResponse(res, result, 'Captains found successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Update FCM token
  async updateFCMToken(req, res) {
    try {
      const { fcmToken } = req.body;
      const result = await captainService.updateFCMToken(req.captain.id, fcmToken, req.tenant.id);
      return successResponse(res, result, 'FCM token updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Update working hours
  async updateWorkingHours(req, res) {
    try {
      const { workingHoursStart, workingHoursEnd } = req.body;
      const result = await captainService.updateWorkingHours(req.captain.id, workingHoursStart, workingHoursEnd, req.tenant.id);
      return successResponse(res, result, 'Working hours updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Update captain location (cache only)
  async updateLocation(req, res) {
    try {
      const { longitude, latitude } = req.body;
      // console.log(req.captain);
      const result = await captainService.updateLocation(req.captain.id, longitude, latitude, req.tenant.id);
      return successResponse(res, result, 'Location updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Update captain availability
  async updateAvailability(req, res) {
    try {
      const { isAvailable } = req.body;
      const result = await captainService.updateAvailability(req.captain.id, isAvailable, req.tenant.id);
      return successResponse(res, result, 'Availability updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get cached captain data (admin endpoint)
  async getCachedCaptainData(req, res) {
    try {
      const result = captainService.getCachedCaptainData(req.tenant.id);
      return successResponse(res, result, 'Cached captain data retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get captain location (for user tracking)
  async getCaptainLocation(req, res) {
    try {
      const { id } = req.params;
      const result = await captainService.getCaptainLocation(id, req.tenant.id);
      return successResponse(res, result, 'Captain location retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  
  // Delete captain account
  async deleteAccount(req, res) {
    try {
      const result = await captainService.deleteAccount(req.captain.id, req.tenant.id);
      return successResponse(res, result, 'Account deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new CaptainController(); 