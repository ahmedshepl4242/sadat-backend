const vendorComplainService = require('../services/vendorComplainService');
const { successResponse, errorResponse } = require('../utils/helpers');

class VendorComplainController {
  // Create a new complain
  async createComplain(req, res) {
    try {
      const result = await vendorComplainService.createComplain(req.vendor.id, req.body, req.tenant.id);
      return successResponse(res, result, 'Complain submitted successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get vendor's complains
  async getVendorComplains(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await vendorComplainService.getVendorComplains(req.vendor.id, req.tenant.id, page, limit);
      return successResponse(res, result, 'Complains retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all complains (admin endpoint)
  async getAllComplains(req, res) {
    try {
      const { page, limit, type } = req.query;
      const result = await vendorComplainService.getAllComplains(req.tenant.id, page, limit, type);
      return successResponse(res, result, 'All complains retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get complain by ID
  async getComplainById(req, res) {
    try {
      const { id } = req.params;
      const result = await vendorComplainService.getComplainById(id, req.tenant.id);
      return successResponse(res, result, 'Complain retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Delete complain
  async deleteComplain(req, res) {
    try {
      const { id } = req.params;
      const result = await vendorComplainService.deleteComplain(id, req.vendor.id, req.tenant.id);
      return successResponse(res, result, 'Complain deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new VendorComplainController();
