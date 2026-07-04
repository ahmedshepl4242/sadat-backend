const neighborhoodService = require('../services/neighborhoodService');
const { successResponse, errorResponse } = require('../utils/helpers');

class NeighborhoodController {
  // Create neighborhood (admin endpoint)
  async createNeighborhood(req, res) {
    try {
      const result = await neighborhoodService.createNeighborhood(req.body, req.tenant.id);
      return successResponse(res, result, 'Neighborhood created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all neighborhoods (public endpoint)
  async getAllNeighborhoods(req, res) {
    try {
      const result = await neighborhoodService.getAllNeighborhoods(req.tenant.id);
      return successResponse(res, result, 'Neighborhoods retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get neighborhood by ID
  async getNeighborhoodById(req, res) {
    try {
      const { id } = req.params;
      const result = await neighborhoodService.getNeighborhoodById(id, req.tenant.id);
      return successResponse(res, result, 'Neighborhood retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Update neighborhood (admin endpoint)
  async updateNeighborhood(req, res) {
    try {
      const { id } = req.params;
      const result = await neighborhoodService.updateNeighborhood(id, req.body, req.tenant.id);
      return successResponse(res, result, 'Neighborhood updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Delete neighborhood (admin endpoint)
  async deleteNeighborhood(req, res) {
    try {
      const { id } = req.params;
      const result = await neighborhoodService.deleteNeighborhood(id, req.tenant.id);
      return successResponse(res, result, 'Neighborhood deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Reorder neighborhoods (admin endpoint)
  async reorderNeighborhoods(req, res) {
    try {
      const { orderedIds } = req.body;
      const result = await neighborhoodService.reorderNeighborhoods(orderedIds, req.tenant.id);
      return successResponse(res, result, 'Neighborhoods reordered successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new NeighborhoodController(); 