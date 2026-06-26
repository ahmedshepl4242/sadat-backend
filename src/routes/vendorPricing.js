const express = require('express');
const router = express.Router();
const vendorPricingController = require('../controllers/vendorPricingController');
const { protectVendor } = require('../middlewares/auth');
const { protectAdmin } = require('../middlewares/auth');
const { vendorPricingValidation, paginationValidation } = require('../utils/validation');




/**
 * @swagger
 * /api/vendor-pricing/neighborhoods:
 *   get:
 *     summary: Get all neighborhoods with pricing status for current vendor
 *     tags: [Vendor Pricing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: integer
 *           minimum: 1
 *           description: Vendor ID
 *     responses:
 *       200:
 *         description: Neighborhoods with pricing retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Neighborhood ID
 *                       name:
 *                         type: string
 *                         description: Neighborhood name
 *                       price:
 *                         type: number
 *                         format: float
 *                         description: Current price (null if not set)
 *                       hasPricing:
 *                         type: boolean
 *                         description: Whether pricing is set for this neighborhood
 *                 message:
 *                   type: string
 *                   example: Neighborhoods with pricing retrieved successfully
 */
router.get('/neighborhoods', protectAdmin, vendorPricingController.getNeighborhoodsWithPricing);

/**
 * @swagger
 * /api/vendor-pricing/{neighborhoodId}:
 *   get:
 *     summary: Get pricing for specific vendor-neighborhood combination
 *     tags: [Vendor Pricing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           description: Vendor ID
 *       - in: path
 *         name: neighborhoodId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Neighborhood ID
 *     responses:
 *       200:
 *         description: Vendor neighborhood pricing retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VendorNeighborhoodPrice'
 *                 message:
 *                   type: string
 *                   example: Vendor neighborhood pricing retrieved successfully
 */
router.get('/:neighborhoodId', vendorPricingValidation.neighborhoodParam, vendorPricingController.getVendorNeighborhoodPrice);

// All routes require vendor authentication
router.use(protectAdmin);

/**
 * @swagger
 * /api/vendor-pricing:
 *   post:
 *     summary: Set or update vendor pricing for a neighborhood
 *     tags: [Vendor Pricing]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - neighborhoodId
 *               - price
 *             properties:
 *               vendorId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Vendor ID
 *               neighborhoodId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Neighborhood ID
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Delivery price for this neighborhood
 *     responses:
 *       200:
 *         description: Vendor neighborhood pricing set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VendorNeighborhoodPrice'
 *                 message:
 *                   type: string
 *                   example: Vendor neighborhood pricing set successfully
 */
router.post('/', vendorPricingValidation.setPrice, vendorPricingController.setVendorNeighborhoodPrice);

/**
 * @swagger
 * /api/vendor-pricing:
 *   get:
 *     summary: Get all pricing for current vendor
 *     tags: [Vendor Pricing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: integer
 *           minimum: 1
 *           description: Vendor ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Vendor pricing retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     pricing:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VendorNeighborhoodPrice'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                 message:
 *                   type: string
 *                   example: Vendor pricing retrieved successfully
 */
router.get('/', paginationValidation, vendorPricingController.getVendorPricing);

/**
 * @swagger
 * /api/vendor-pricing/{neighborhoodId}:
 *   delete:
 *     summary: Delete vendor pricing for a neighborhood
 *     tags: [Vendor Pricing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: integer
 *           minimum: 1
 *           description: Vendor ID
 *       - in: path
 *         name: neighborhoodId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Neighborhood ID
 *     responses:
 *       200:
 *         description: Vendor neighborhood pricing deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Vendor neighborhood pricing deleted successfully
 *                 message:
 *                   type: string
 *                   example: Vendor neighborhood pricing deleted successfully
 */
router.delete('/:neighborhoodId', vendorPricingValidation.neighborhoodParam, vendorPricingController.deleteVendorNeighborhoodPrice);

module.exports = router; 