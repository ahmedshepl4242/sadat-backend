const vendorPricingService = require('../services/vendorPricingService');
const { successResponse, errorResponse } = require('../utils/helpers');

class VendorPricingController {
  // Set or update vendor pricing for a neighborhood
  async setVendorNeighborhoodPrice(req, res) {
    try {
      const result = await vendorPricingService.setVendorNeighborhoodPrice(req.body.vendorId, req.body, req.tenant.id);
      return successResponse(res, result, 'Vendor neighborhood pricing set successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all pricing for a vendor
  async getVendorPricing(req, res) {
    try {
      const { vendorId, page, limit } = req.query;
      const result = await vendorPricingService.getVendorPricing(vendorId, req.tenant.id, page, limit);
      return successResponse(res, result, 'Vendor pricing retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get pricing for a specific vendor-neighborhood combination
  async getVendorNeighborhoodPrice(req, res) {
    try {
      const { vendorId } = req.query;
      const { neighborhoodId } = req.params;
      const result = await vendorPricingService.getVendorNeighborhoodPrice(vendorId, neighborhoodId, req.tenant.id);
      return successResponse(res, result, 'Vendor neighborhood pricing retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Delete vendor pricing for a neighborhood
  async deleteVendorNeighborhoodPrice(req, res) {
    try {
      const vendorId = req.query.vendorId;
      const { neighborhoodId } = req.params;
      const result = await vendorPricingService.deleteVendorNeighborhoodPrice(vendorId, neighborhoodId, req.tenant.id);
      return successResponse(res, result, 'Vendor neighborhood pricing deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get all neighborhoods with pricing for a vendor
  async getNeighborhoodsWithPricing(req, res) {
    console.log(req);
    console.log(res);
    try {
      const { vendorId } = req.query;
      const result = await vendorPricingService.getNeighborhoodsWithPricing(vendorId, req.tenant.id);
      return successResponse(res, result, 'Neighborhoods with pricing retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new VendorPricingController(); 