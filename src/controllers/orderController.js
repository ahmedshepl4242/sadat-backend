const orderService = require('../services/orderService');
const { successResponse, errorResponse } = require('../utils/helpers');

class OrderController {
  // Create order by user
  async createByUser(req, res) {
    try {
      console.log('Creating order with data:', req.body);
      const result = await orderService.createByUser(req.user.id, req.body, req.tenant.id);
      
      return successResponse(res, result, 'Order created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Create order by vendor
  async createByVendor(req, res) {
    try {
      const result = await orderService.createByVendor(req.vendor.id, req.body, req.tenant.id);
      return successResponse(res, result, 'Order created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Vendor counter offer
  async vendorCounterOffer(req, res) {
    try {
      const { id } = req.params;
      const result = await orderService.vendorCounterOffer(id, req.vendor.id, req.body, req.tenant.id);
      return successResponse(res, result, 'Counter offer submitted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // User approve order
  async userApprove(req, res) {
    try {
      const { id } = req.params;
      const result = await orderService.userApprove(id, req.user.id, req.tenant.id);
      return successResponse(res, result, 'Order approved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Captain approve order
  async captainApprove(req, res) {
    try {
      const { id } = req.params;
      const { deliveryPrice } = req.body;
      const result = await orderService.captainApprove(id, req.captain.id, req.tenant.id, deliveryPrice);
      return successResponse(res, result, 'Order accepted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get orders by user
  async getByUser(req, res) {
    try {
      const { page, limit, status } = req.query;
      const result = await orderService.getByUser(req.user.id, req.tenant.id, page, limit, status);
      return successResponse(res, result, 'Orders retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get orders by vendor
  async getByVendor(req, res) {
    try {
      const { page, limit, status } = req.query;
      const result = await orderService.getByVendor(req.vendor.id, req.tenant.id, page, limit, status);
      return successResponse(res, result, 'Orders retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get orders by captain
  async getByCaptain(req, res) {
    try {
      const { page, limit, status } = req.query;
      const result = await orderService.getByCaptain(req.captain.id, req.tenant.id, page, limit, status);
      return successResponse(res, result, 'Orders retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get available orders for captains
  async getAvailableOrders(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await orderService.getAvailableOrders(req.tenant.id, page, limit);
      return successResponse(res, result, 'Available orders retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get order by ID
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const result = await orderService.getOrderById(id, req.tenant.id);
      return successResponse(res, result, 'Order retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  // Vendor reject order
  async vendorReject(req, res) {
    try {
      const { id } = req.params;
      const result = await orderService.vendorReject(id, req.vendor.id, req.tenant.id);
      return successResponse(res, result, 'Order rejected successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Finalize order (user confirms delivery)
  async finalize(req, res) {
    try {
      const { id } = req.params;
      const result = await orderService.finalize(id, req.user.id, req.tenant.id);
      return successResponse(res, result, 'Order finalized successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Mark order as delivered (captain)
  async markDelivered(req, res) {
    try {
      const { id } = req.params;
      const result = await orderService.markDelivered(id, req.captain.id, req.tenant.id);
      return successResponse(res, result, 'Order marked as delivered successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Rate captain (user)
  async rateCaptain(req, res) {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const result = await orderService.rateCaptain(id, req.user.id, rating, req.tenant.id);
      return successResponse(res, result, 'Captain rated successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Start delivery
  async startDelivery(req, res) {
    try {
      const { id } = req.params;
      const result = await orderService.startDelivery(id, req.captain.id, req.tenant.id);
      return successResponse(res, result, 'Delivery started successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Delete order
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const result = await orderService.deleteOrder(id, req.user.id, req.tenant.id);
      return successResponse(res, result, 'Order cancelled successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Get order statistics
  async getOrderStats(req, res) {
    try {
      const result = await orderService.getOrderStats(req.tenant.id);
      return successResponse(res, result, 'Order statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // Captain arrived at user location
  async captainArrived(req, res) {
    try {
      const { id } = req.params;
      const result = await orderService.captainArrived(id, req.captain.id, req.tenant.id);
      return successResponse(res, result, 'User notified about captain arrival');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new OrderController(); 