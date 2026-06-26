const captainRequestService = require('../services/captainRequestService');
const { successResponse, errorResponse } = require('../utils/helpers');

class CaptainRequestController {
  // Submit a new request
  async submitRequest(req, res) {
    try {
      const { description } = req.body;
      const result = await captainRequestService.submitRequest(req.captain.id, description, req.tenant.id);
      return successResponse(res, result, 'Request submitted successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get captain's own requests
  async getCaptainRequests(req, res) {
    try {
      const { page, limit, status } = req.query;
      const result = await captainRequestService.getRequestsByCaptain(req.captain.id, req.tenant.id, page, limit, status);
      return successResponse(res, result, 'Requests retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all requests (admin endpoint - would need admin auth in real app)
  async getAllRequests(req, res) {
    try {
      const { page, limit, status } = req.query;
      const result = await captainRequestService.getAllRequests(page, limit, status, req.tenant.id);
      return successResponse(res, result, 'All requests retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get request by ID
  async getRequestById(req, res) {
    try {
      const { id } = req.params;
      const result = await captainRequestService.getRequestById(id, req.tenant.id);
      return successResponse(res, result, 'Request retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }



  // Delete request
  async deleteRequest(req, res) {
    try {
      const { id } = req.params;
      const result = await captainRequestService.deleteRequest(id, req.captain.id, req.tenant.id);
      return successResponse(res, result, 'Request deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new CaptainRequestController(); 