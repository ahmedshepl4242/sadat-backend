const menuService = require('../services/menuService');
const { errorResponse, successResponse } = require('../utils/helpers');

class MenuController {
  // Create a new menu item
  async createMenu(req, res) {
    try {
      const vendorId = req.vendor.id;
      const photo = req.file;
      const result = await menuService.createMenu(vendorId, photo, req.tenant.id);
      return successResponse(res, result, 'menu item created successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Get all menu items for a vendor
  async getVendorMenus(req, res) {
    try {
      const vendorId = req.vendor.id;
      const { page = 1, limit = 10 } = req.query;
      const result = await menuService.getVendorMenus(vendorId, req.tenant.id, parseInt(page), parseInt(limit));
      return successResponse(res, result, 'menu item retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Get a specific menu item by ID
  async getMenuById(req, res) {
    try {
      const { id } = req.params;
      const result = await menuService.getMenuById(id, req.tenant.id);
      return successResponse(res, result, 'menu item retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Update a menu item
  async updateMenu(req, res) {
    try {
      const { id } = req.params;
      const vendorId = req.vendor.id;
      const photo = req.file;
      const result = await menuService.updateMenu(id, vendorId, photo, req.tenant.id);
      return successResponse(res, result, 'menu item updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Delete a menu item
  async deleteMenu(req, res) {
    try {
      const { id } = req.params;
      const vendorId = req.vendor.id;
      const result = await menuService.deleteMenu(id, vendorId, req.tenant.id);
      return successResponse(res, result, 'menu item deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Get menu statistics for a vendor
  async getMenuStats(req, res) {
    try {
      const vendorId = req.vendor.id;
      const result = await menuService.getMenuStats(vendorId, req.tenant.id);
      return successResponse(res, result, 'menu item statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }



  // Public endpoint to get vendor menus (for customers)
  async getPublicVendorMenus(req, res) {
    try {
      const { vendorId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const result = await menuService.getVendorMenus(vendorId, req.tenant.id, parseInt(page), parseInt(limit));
      return successResponse(res, result, 'menu item retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }
}

module.exports = new MenuController(); 