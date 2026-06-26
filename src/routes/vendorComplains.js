const express = require('express');
const router = express.Router();
const vendorComplainController = require('../controllers/vendorComplainController');
const { protectVendor } = require('../middlewares/auth');
const { vendorComplainValidation, paginationValidation } = require('../utils/validation');


/**
 * @swagger
 * /api/vendor-complains/{id}:
 *   get:
 *     summary: Get vendor complaint by ID
 *     tags: [Vendor Complains]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VendorComplain'
 *                 message:
 *                   type: string
 *                   example: Complain retrieved successfully
 */
router.get('/:id', vendorComplainController.getComplainById);


// Protected routes - require vendor authentication
router.use(protectVendor);

/**
 * @swagger
 * /api/vendor-complains:
 *   post:
 *     summary: Create a new vendor complaint
 *     tags: [Vendor Complains]
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
 *               - description
 *               - type
 *             properties:
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Complaint description
 *               type:
 *                 type: string
 *                 enum: [USER, VENDOR, CAPTAIN]
 *                 description: Source of complaint
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VendorComplain'
 *                 message:
 *                   type: string
 *                   example: Complain submitted successfully
 */
router.post('/', vendorComplainValidation.create, vendorComplainController.createComplain);

/**
 * @swagger
 * /api/vendor-complains:
 *   get:
 *     summary: Get vendor's complaints
 *     tags: [Vendor Complains]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
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
 *         description: Complaints retrieved successfully
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
 *                     complains:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VendorComplain'
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
 *                   example: Complains retrieved successfully
 */
router.get('/', paginationValidation, vendorComplainController.getVendorComplains);

/**
 * @swagger
 * /api/vendor-complains/{id}:
 *   delete:
 *     summary: Delete vendor complaint
 *     tags: [Vendor Complains]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint deleted successfully
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
 *                       example: Complain deleted successfully
 *                 message:
 *                   type: string
 *                   example: Complain deleted successfully
 */
router.delete('/:id', vendorComplainController.deleteComplain);

module.exports = router;
