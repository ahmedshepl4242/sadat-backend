const itemService = require('../services/itemService');
const { successResponse, errorResponse } = require('../utils/helpers');

class ItemController {
  // Create item (vendor only)
  async createItem(req, res) {
    try {
      const vendorId = req.vendor.id;
      const photo = req.file;
      const { name, description, price } = req.body;

      if (!name || !price) {
        return errorResponse(res, 'Name and price are required', 400);
      }

      const result = await itemService.createItem(
        vendorId,
        { name, description, price },
        photo,
        req.tenant.id
      );
      return successResponse(res, result, 'Item created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Update item (vendor only)
  async updateItem(req, res) {
    try {
      const { itemId } = req.params;
      const vendorId = req.vendor.id;
      const photo = req.file;
      const { name, description, price, isAvailable } = req.body;

      const result = await itemService.updateItem(
        itemId,
        vendorId,
        { name, description, price, isAvailable },
        photo,
        req.tenant.id
      );
      return successResponse(res, result, 'Item updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Delete item (vendor only)
  async deleteItem(req, res) {
    try {
      const { itemId } = req.params;

      const result = await itemService.deleteItem(
        itemId,
        req.vendor.id,
        req.tenant.id
      );
      return successResponse(res, result, 'Item deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get items by vendor (public)
  async getItemsByVendor(req, res) {
    try {
      const { vendorId } = req.params;
      const { page, limit } = req.query;

      const result = await itemService.getItemsByVendor(
        vendorId,
        req.tenant.id,
        page,
        limit
      );
      return successResponse(res, result, 'Items retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new ItemController();
