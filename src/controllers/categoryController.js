const categoryService = require('../services/categoryService');
const { successResponse, errorResponse } = require('../utils/helpers');

class CategoryController {
  // Create category (admin endpoint)
  async createCategory(req, res) {
    try {
      const result = await categoryService.createCategory(req.body, req.tenant.id);
      return successResponse(res, result, 'Category created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all categories (public endpoint)
  async getAllCategories(req, res) {
    try {
      const result = await categoryService.getAllCategories(req.tenant.id);
      return successResponse(res, result, 'Categories retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get category by ID
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const result = await categoryService.getCategoryById(id, req.tenant.id);
      return successResponse(res, result, 'Category retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Update category (admin endpoint)
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const result = await categoryService.updateCategory(id, req.body, req.tenant.id);
      return successResponse(res, result, 'Category updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Delete category (admin endpoint)
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const result = await categoryService.deleteCategory(id, req.tenant.id);
      return successResponse(res, result, 'Category deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get vendor registration data (neighborhoods and categories)
  async getVendorRegistrationData(req, res) {
    try {
      const neighborhoodService = require('../services/neighborhoodService');

      const [neighborhoods, categories] = await Promise.all([
        neighborhoodService.getAllNeighborhoods(req.tenant.id),
        categoryService.getAllCategories(req.tenant.id)
      ]);

      return successResponse(res, { neighborhoods: neighborhoods.neighborhoods, categories }, 'Vendor registration data retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new CategoryController();
